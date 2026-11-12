import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { useAccount, loadCloud } from '../../cloud/account';
import { HERO_BY_ID } from '../../data/heroes';
import { GHOST_PREFIX, RANK_TABS, ghostRanks, rankEntry, type RankEntry, type RankField } from '../../game/ranks';
import { Screen, fmt } from '../components/common';
import { HeroArt } from '../art/HeroArt';
import { ReportSheet, type ReportTarget } from '../components/ReportSheet';
import { PlayerCard } from '../components/PlayerCard';
import { maskProfanity } from '../../game/moderation';

// CLASSEMENTS EN LIGNE — les 50 meilleurs Héritiers par mode. Il faut un compte pour y figurer ;
// tout le monde peut les consulter. Le joueur peut choisir de ne pas apparaître.
type Row = RankEntry & { uid: string };

export function Ranks({ tab: initial }: { tab?: RankField }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const push = useUI((s) => s.push);
  const user = useAccount((s) => s.user);
  const [tab, setTab] = useState<RankField>(initial ?? 'arena');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [report, setReport] = useState<ReportTarget | null>(null);
  const [view, setView] = useState<Row | null>(null);
  const blocked = useGame((st) => st.save?.blocked ?? []);
  const me = rankEntry(save);
  const def = RANK_TABS.find((t) => t.id === tab)!;

  useEffect(() => {
    let alive = true;
    setRows(null); setErr(null);
    if (!navigator.onLine) { setErr('Pas de connexion Internet.'); return; }
    loadCloud().then(async (c) => {
      if (user) await c.publishRank(user.uid, useGame.getState().save!);
      const r = await c.fetchRanks(tab);
      if (alive) { const real = r.filter((x) => (x[tab] ?? 0) > 0 && !blocked.some((b) => b.uid === x.uid)); setRows([...real, ...ghostRanks(tab, real.length)].sort((a, b) => (b[tab] ?? 0) - (a[tab] ?? 0))); setUid(c.currentUid()); }
    }).catch((e) => { if (alive) setErr((e as { code?: string })?.code === 'permission-denied' ? 'Les classements ne sont pas encore ouverts sur le serveur.' : 'Classement injoignable pour le moment.'); });
    return () => { alive = false; };
  }, [tab, user]);

  const mine = rows?.findIndex((r) => r.uid === uid) ?? -1;
  const isGhost = (r: Row) => r.uid.startsWith(GHOST_PREFIX);
  const toggle = () => {
    mutate((s) => { s.settings.showInRanks = !s.settings.showInRanks; });
    void loadCloud().then((c) => c.publishRankNow()).then(() => setTab((t) => t));
  };

  return (
    <Screen title="Classements">
      <div className="seg rk-tabs" role="tablist">
        {RANK_TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      <div className="rk-me">
        <div className="rk-av"><HeroArt heroId={me.avatar} /></div>
        <div className="grow">
          <b>{me.name}</b>
          <div className="faint">{!user ? 'Crée un compte pour apparaître au classement.' : !save.settings.showInRanks ? 'Tu n’apparais pas au classement.' : mine >= 0 ? `${mine + 1}ᵉ place` : rows ? 'Hors du top 50 pour l’instant.' : '…'}</div>
        </div>
        <div className="rk-val"><b>{fmt(me[tab])}</b><small>{def.unit}</small></div>
      </div>
      {!user && <button className="btn block" style={{ marginBottom: 10 }} onClick={() => push({ name: 'account', mode: 'register' })}>Créer un compte</button>}

      {err && <p className="muted" style={{ textAlign: 'center' }}>{err}</p>}
      {!err && !rows && <p className="muted" style={{ textAlign: 'center' }}>Chargement…</p>}
      {rows && rows.length === 0 && <p className="muted" style={{ textAlign: 'center' }}>Personne pour l’instant. Sois le premier !</p>}
      {rows && rows.length > 0 && (
        <ol className="rk-list">
          {rows.map((r, i) => (
            <li key={r.uid} className={`rk-row ${r.uid === uid ? 'me' : ''} ${isGhost(r) ? 'ghost' : ''} ${i < 3 ? `top top${i + 1}` : ''}`} onClick={() => { if (r.uid !== uid) setView(r); }}>
              <span className="rk-pos">{i + 1}</span>
              <div className="rk-av"><HeroArt heroId={HERO_BY_ID[r.avatar] ? r.avatar : 'aldric'} /></div>
              <div className="grow rk-name"><b>{maskProfanity(r.name)}</b><small className="faint">{isGhost(r) ? 'Imaginaire · ' : ''}Niv. {r.level}</small></div>
              <div className="rk-val"><b>{fmt(r[tab])}</b></div>
            </li>
          ))}
        </ol>
      )}
      {view && <PlayerCard uid={view.uid} entry={view} ghost={isGhost(view)} signedIn={!!user} self={view.uid === uid} canReport={!!user && !isGhost(view) && view.uid !== uid}
        onReport={() => { setReport({ uid: view.uid, name: view.name, kind: 'name', where: `Classement ${def.label}` }); setView(null); }} onClose={() => setView(null)} />}
      {report && <ReportSheet target={report} onClose={() => setReport(null)} />}
      {rows && rows.length > 0 && <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>Touche un joueur pour voir son profil.</p>}
      {user && (
        <button className="btn secondary block" style={{ marginTop: 14 }} onClick={toggle}>
          {save.settings.showInRanks ? 'Ne plus apparaître au classement' : 'Apparaître au classement'}
        </button>
      )}
      {rows?.some(isGhost) && <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>Peu de joueurs pour l’instant : le classement est complété par des Héritiers imaginaires, en attendant les vrais.</p>}
      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>Seuls ton nom (modifiable sur ta carte du Menu), ton avatar et tes scores sont visibles.</p>
    </Screen>
  );
}
