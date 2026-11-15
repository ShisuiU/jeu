import { useState, type ReactNode } from 'react';
import type { Reward } from '../../data/resources';
import { play } from '../../audio/sfx';
import { Modal } from './common';
import { RewardView } from './RewardView';

// RÉCUPÉRATION GROUPÉE (v1.103.0) — un bouton « Tout réclamer » et une fenêtre unique qui récapitule le butin.
export function ClaimAllButton({ label, count, onRun, title }: { label: string; count: number; onRun: () => { reward: Reward; count: number }; title: string }) {
  const [shown, setShown] = useState<Reward | null>(null);
  if (count <= 0 && !shown) return null;
  return (
    <>
      {count > 0 && (
        <button className="btn block claim-all" onClick={() => { const r = onRun(); if (r.count > 0) { play('claim'); setShown(r.reward); } }}>
          {label}<span className="ca-n">{count}</span>
        </button>
      )}
      {shown && <RewardModal title={title} reward={shown} onClose={() => setShown(null)} />}
    </>
  );
}

export function RewardModal({ title, reward, onClose, children }: { title: string; reward: Reward; onClose: () => void; children?: ReactNode }) {
  return (
    <Modal onClose={onClose}>
      <h2 className="rm-title">{title}</h2>
      {Object.keys(reward).length ? <RewardView reward={reward} compact /> : <p className="faint" style={{ textAlign: 'center' }}>Rien de plus pour l’instant.</p>}
      {children}
      <button className="btn block" style={{ marginTop: 12 }} onClick={onClose}>Parfait</button>
    </Modal>
  );
}
