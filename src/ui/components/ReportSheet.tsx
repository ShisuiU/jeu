import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { Modal } from './common';
import type { ReportKind } from '../../cloud/moderationCloud';

// SIGNALER / BLOQUER — fenêtre commune (classements, discussion de clan, membres, Arène).
// Signaler envoie un signalement aux modérateurs ; bloquer masque ce joueur sur cet appareil.
export interface ReportTarget { uid: string; name: string; kind: ReportKind; text?: string; where: string }

const REASONS: { kind: ReportKind; label: string }[] = [
  { kind: 'name', label: 'Nom choquant ou insultant' },
  { kind: 'chat', label: 'Message insultant' },
  { kind: 'behavior', label: 'Triche ou comportement' },
  { kind: 'clan', label: 'Clan (nom ou présentation)' },
];

export function ReportSheet({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const blocked = useGame((s) => s.save?.blocked ?? []);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [kind, setKind] = useState<ReportKind>(target.kind);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const isBlocked = blocked.some((b) => b.uid === target.uid);
  const send = async () => {
    setBusy(true);
    try {
      const m = await import('../../cloud/moderationCloud');
      await m.sendReport({ target: target.uid, targetName: target.name, kind, where: target.where, text: [target.text ? `« ${target.text} »` : '', note.trim()].filter(Boolean).join(' · ') });
      toast('Merci : le signalement a été envoyé aux modérateurs.', 'ok'); onClose();
    } catch { toast('Signalement impossible pour le moment (connexion ou compte).', 'error'); }
    finally { setBusy(false); }
  };
  const toggleBlock = () => {
    mutate((s) => { s.blocked = isBlocked ? s.blocked.filter((x) => x.uid !== target.uid) : [...s.blocked, { uid: target.uid, name: target.name }].slice(-200); });
    toast(isBlocked ? `${target.name} n’est plus bloqué.` : `${target.name} est bloqué : tu ne verras plus ses messages ni son équipe.`, 'ok');
    onClose();
  };
  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>{target.name}</h3>
      {target.text && <p className="faint report-quote">« {target.text} »</p>}
      <p className="faint" style={{ marginTop: 0 }}>Pourquoi le signaler ?</p>
      <div className="report-reasons">
        {REASONS.map((r) => <button key={r.kind} className={`report-reason ${kind === r.kind ? 'on' : ''}`} onClick={() => setKind(r.kind)}>{r.label}</button>)}
      </div>
      <input className="text-input" style={{ marginTop: 8 }} maxLength={140} placeholder="Précision (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Précision" />
      <button className="btn block" style={{ marginTop: 10 }} disabled={busy} onClick={() => void send()}>Envoyer le signalement</button>
      <button className="btn secondary block" style={{ marginTop: 8 }} onClick={toggleBlock}>{isBlocked ? 'Débloquer' : 'Bloquer ce joueur'}</button>
      <button className="acc-link" style={{ display: 'block', margin: '10px auto 0' }} onClick={onClose}>Annuler</button>
    </Modal>
  );
}

/** Ce joueur est-il bloqué sur cet appareil ? */
export const isBlockedUid = (blocked: { uid: string }[] | undefined, uid: string) => !!blocked?.some((b) => b.uid === uid);
