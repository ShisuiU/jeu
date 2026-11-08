import { useCallback, useEffect, useState } from 'react';
import { useUI } from '../../state/ui';
import { Modal, Panel, Screen } from '../components/common';
import type { Ban, Report } from '../../cloud/moderationCloud';

// MODÉRATION (modérateurs seulement) — signalements reçus, joueurs bannis.
// Bannir : le joueur disparaît des classements, de l'Arène et des fiches d'amis, et ne peut plus rien publier.
type Api = typeof import('../../cloud/moderationCloud');
const mapi = () => import('../../cloud/moderationCloud');
const KIND: Record<Report['kind'], string> = { name: 'Nom', chat: 'Message', clan: 'Clan', behavior: 'Triche / comportement' };
const when = (t: number) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function Moderation() {
  const toast = useUI((s) => s.toast);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [bans, setBans] = useState<Ban[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<void> } | null>(null);
  const load = useCallback(async () => {
    try { const m = await mapi(); setReports(await m.listReports()); setBans(await m.listBans()); setErr(null); }
    catch { setErr('Accès refusé : ce compte n’est pas modérateur, ou les règles du serveur ne sont pas à jour.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const act = async (fn: (m: Api) => Promise<unknown>, ok: string) => { try { await fn(await mapi()); toast(ok, 'ok'); await load(); } catch { toast('Action refusée par le serveur.', 'error'); } };
  // Un joueur signalé plusieurs fois apparaît une fois, avec le nombre de signalements.
  const groups = new Map<string, Report[]>();
  for (const r of reports ?? []) groups.set(r.target, [...(groups.get(r.target) ?? []), r]);
  return (
    <Screen title="Modération" right={<button className="btn secondary small" onClick={() => void load()}>Actualiser</button>}>
      {err && <p className="hint warn">{err}</p>}
      <Panel title={`Signalements · ${reports?.length ?? '…'}`}>
        {reports && reports.length === 0 && <p className="faint" style={{ margin: 0 }}>Aucun signalement. Tout va bien.</p>}
        {[...groups.entries()].map(([target, list]) => (
          <div key={target} className="mod-item">
            <div className="row between"><b>{list[0].targetName}</b><span className="faint">{list.length} signalement{list.length > 1 ? 's' : ''}</span></div>
            {list.slice(0, 3).map((r) => <div key={r.id} className="faint mod-line">{KIND[r.kind]} · {r.where} · par {r.byName} · {when(r.at)}{r.text ? <> — {r.text}</> : null}</div>)}
            <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <button className="btn small danger" onClick={() => setConfirm({ text: `Bannir ${list[0].targetName} ? Il disparaîtra des classements et de l’Arène, et ne pourra plus rien publier en ligne.`, run: () => act(async (m) => { await m.banPlayer(target, list[0].targetName, KIND[list[0].kind]); for (const r of list) await m.dismissReport(r.id); }, `${list[0].targetName} est banni.`) })}>Bannir</button>
              <button className="btn small secondary" onClick={() => void act(async (m) => { await m.removeFromRanks(target); for (const r of list) await m.dismissReport(r.id); }, 'Retiré des classements et de l’Arène.')}>Retirer des classements</button>
              <button className="btn small secondary" onClick={() => void act(async (m) => { for (const r of list) await m.dismissReport(r.id); }, 'Signalements classés.')}>Ignorer</button>
            </div>
          </div>
        ))}
      </Panel>
      <Panel title={`Joueurs bannis · ${bans.length}`}>
        {bans.length === 0 && <p className="faint" style={{ margin: 0 }}>Aucun.</p>}
        {bans.map((b) => (
          <div key={b.uid} className="stat-row" style={{ alignItems: 'center' }}>
            <span><b>{b.name}</b><div className="faint">{b.reason} · {when(b.at)}</div></span>
            <button className="btn small secondary" onClick={() => void act((m) => m.unbanPlayer(b.uid), `${b.name} n’est plus banni.`)}>Lever</button>
          </div>
        ))}
      </Panel>
      {confirm && (
        <Modal onClose={() => setConfirm(null)}>
          <p style={{ marginTop: 0, textAlign: 'center' }}>{confirm.text}</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setConfirm(null)}>Annuler</button>
            <button className="btn danger grow" onClick={() => { const c = confirm; setConfirm(null); void c.run(); }}>Confirmer</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}
