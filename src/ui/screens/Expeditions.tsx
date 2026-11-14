import { useEffect, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { RESOURCES, type Reward } from '../../data/resources';
import type { AffinityId, FactionId, RoleId } from '../../data/types';
import { formatDuration, msUntilReset } from '../../core/time';
import { busyHeroes, claimExpedition, condLabel, condMet, expeditionLoot, recallExpedition, refreshExpeditions, startExpedition, type ExpeditionOffer } from '../../game/expeditions';
import { play } from '../../audio/sfx';
import { InfoButton, Modal, Screen, fmt } from '../components/common';
import { HeroCard } from '../components/HeroCard';
import { RewardView } from '../components/RewardView';
import { Sheet } from '../components/ListControls';
import { EnemyArt } from '../art/EnemyArt';
import { ResourceIcon } from '../art/Icons';
import { AffinityIcon, RoleIcon } from '../art/Identity';
import { FactionEmblem } from '../art/FactionEmblem';

// EXPÉDITIONS — envoyer des héros à travers les failles ; ils reviennent avec du butin, même jeu fermé.

const dur = (m: number) => (m >= 60 ? `${m / 60} h` : `${m} min`);
function CondIcon({ c, size = 14 }: { c: ExpeditionOffer['cond']; size?: number }) {
  if (c.kind === 'affinity') return <AffinityIcon id={c.id as AffinityId} size={size} />;
  if (c.kind === 'role') return <RoleIcon id={c.id as RoleId} size={size} />;
  return <FactionEmblem id={c.id as FactionId} size={size} />;
}
function MiniLoot({ reward }: { reward: Reward }) {
  return (
    <div className="ex-loot">
      {Object.entries(reward).filter(([, v]) => (v ?? 0) >= 0.5).map(([k, v]) => {
        const d = RESOURCES[k as keyof typeof RESOURCES];
        if (!d) return null;
        return <span key={k} title={d.name}><ResourceIcon icon={d.icon} color={d.color} size={14} />{fmt(Math.round(v ?? 0))}</span>;
      })}
    </div>
  );
}

export function Expeditions() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [prep, setPrep] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [loot, setLoot] = useState<Reward | null>(null);
  useEffect(() => { if (save.expeditions?.day !== undefined) mutate((s) => { refreshExpeditions(s, now); }); }, [save.expeditions?.day]); // eslint-disable-line react-hooks/exhaustive-deps
  const ex = save.expeditions;
  const busy = busyHeroes(save);
  const offer = prep ? ex.offers.find((o) => o.id === prep) : undefined;
  const preview = offer && picked.length ? expeditionLoot(save, offer, picked) : null;

  const claim = (id: string) => {
    let r: ReturnType<typeof claimExpedition> = { ok: false };
    mutate((s) => { r = claimExpedition(s, id, now); });
    if (r.ok) { play('claim'); setLoot(r.reward ?? {}); } else toast(r.reason ?? 'Impossible.', 'error');
  };
  const launch = () => {
    if (!offer) return;
    let r: ReturnType<typeof startExpedition> = { ok: false };
    mutate((s) => { r = startExpedition(s, offer.id, picked, now); });
    if (r.ok) { play('open'); toast(`Départ pour ${offer.place} : retour dans ${dur(offer.minutes)}.`, 'ok'); setPrep(null); setPicked([]); } else toast(r.reason ?? 'Impossible.', 'error');
  };
  const runs = ex.runs ?? [];
  const oldRuns = runs.filter((r) => !ex.offers.some((o) => o.id === r.offerId));

  const card = (o: ExpeditionOffer) => {
    const run = runs.find((r) => r.offerId === o.id);
    const done = ex.done.includes(o.id);
    const ready = run && now >= run.endsAt;
    return (
      <div key={o.id} className={`ex-card ${ready ? 'ready' : ''} ${done ? 'done' : ''}`}>
        <div className="ex-art"><EnemyArt enemyId={o.art} /></div>
        <div className="ex-body">
          <div className="ex-title">{o.place}</div>
          <div className="ex-tags">
            <span>{dur(o.minutes)}</span><span>{o.size} héros</span>
            <span className="ex-cond"><CondIcon c={o.cond} /> {condLabel(o.cond)} +30 %</span>
          </div>
          <MiniLoot reward={o.base} />
          {run && !ready && (
            <div className="ex-run">
              <div className="ex-bar"><div style={{ width: `${Math.min(100, ((now - run.startAt) / (run.endsAt - run.startAt)) * 100)}%` }} /></div>
              <div className="ex-runline">
                <span className="ex-team">{run.heroUids.map((u) => { const h = save.heroes.find((x) => x.uid === u); return h ? <span key={u} className="ex-ava"><HeroCard heroId={h.heroId} /></span> : null; })}</span>
                <span className="faint">Retour dans {formatDuration(run.endsAt - now)}</span>
                <button className="ex-recall" onClick={() => mutate((s) => recallExpedition(s, o.id))}>Rappeler</button>
              </div>
            </div>
          )}
        </div>
        <div className="ex-act">
          {done ? <span className="chip">Terminée</span>
            : ready ? <button className="btn small" onClick={() => claim(o.id)}>Récupérer</button>
            : run ? null
            : <button className="btn secondary small" onClick={() => { setPrep(o.id); setPicked([]); }}>Préparer</button>}
        </div>
      </div>
    );
  };

  return (
    <Screen title="Expéditions" right={<InfoButton title="Expéditions">Envoie des héros à travers les failles. Ils reviennent après le temps indiqué, même jeu fermé, avec du butin. Un héros de l’affinité, du rôle ou de la famille demandés donne +30 % ; une équipe plus puissante rapporte jusqu’à ×1,3. Les héros en expédition peuvent toujours combattre. 4 nouvelles expéditions chaque jour.</InfoButton>}>
      <p className="faint" style={{ marginTop: 0 }}>Nouvelles expéditions dans {formatDuration(msUntilReset(now))}</p>
      <div className="ex-list">
        {oldRuns.map((r) => card(r.offer))}
        {ex.offers.map(card)}
      </div>

      {offer && (
        <Sheet title={offer.place} onClose={() => setPrep(null)} footer={
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setPrep(null)}>Annuler</button>
            <button className="btn grow" disabled={picked.length !== offer.size} onClick={launch}>{picked.length === offer.size ? `Partir (${dur(offer.minutes)})` : `Choisis ${offer.size - picked.length} héros`}</button>
          </div>
        }>
          <div className="ex-prep-head">
            <span>{picked.length ? `${picked.length}/${offer.size} héros` : `Touche ${offer.size > 1 ? `${offer.size} héros` : 'un héros'} pour l’envoyer`}</span>
            <span className={`ex-cond ${picked.length && condMet(offer.cond, picked.map((u) => save.heroes.find((h) => h.uid === u)!.heroId)) ? 'on' : ''}`}><CondIcon c={offer.cond} size={15} /> {condLabel(offer.cond)} +30 %</span>
          </div>
          {preview && (
            <div className="ex-preview">
              <span className="faint">Butin prévu{preview.ratio < 1 ? ' (équipe un peu faible)' : preview.ratio > 1.05 ? ' (équipe puissante)' : ''}</span>
              <MiniLoot reward={preview.reward} />
            </div>
          )}
          <div className="hero-grid">
            {[...save.heroes].sort((a, b) => Number(condMet(offer.cond, [b.heroId])) - Number(condMet(offer.cond, [a.heroId]))).map((h) => {
              const isBusy = busy.has(h.uid);
              const sel = picked.includes(h.uid);
              return (
                <HeroCard key={h.uid} heroId={h.heroId} level={h.level} selected={sel}
                  badge={isBusy ? 'En route' : condMet(offer.cond, [h.heroId]) ? '+30 %' : undefined}
                  onClick={() => { if (isBusy) { toast(`${HERO_BY_ID[h.heroId].name.split(/[ ,]/)[0]} est déjà en expédition.`); return; } setPicked(sel ? picked.filter((x) => x !== h.uid) : picked.length < offer.size ? [...picked, h.uid] : [...picked.slice(1), h.uid]); }} />
              );
            })}
          </div>
        </Sheet>
      )}

      {loot && (
        <Modal onClose={() => setLoot(null)}>
          <h2>Retour d’expédition</h2>
          <RewardView reward={loot} />
          <button className="btn block" style={{ marginTop: 12 }} onClick={() => setLoot(null)}>Super</button>
        </Modal>
      )}
    </Screen>
  );
}
