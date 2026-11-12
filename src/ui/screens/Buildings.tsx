import { useEffect, useState } from 'react';
import mineArt from '../../assets/buildings/mine.webp';
import trainArt from '../../assets/buildings/training.webp';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { MINE, TRAINING } from '../../data/buildings';
import { HERO_BY_ID } from '../../data/heroes';
import { RARITIES } from '../../data/rarities';
import { collectMine, collectTraining, mineCap, mineRate, mineReady, mineUpgradeCost, placeTrainee, trainPending, trainXpPerHour, unlockTrainSlot, upgradeMine } from '../../game/buildings';
import { maxLevelForRank, powerOf, computeStats } from '../../game/stats';
import { formatDuration } from '../../core/time';
import { play } from '../../audio/sfx';
import { Modal, Screen, fmt } from '../components/common';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';

const D = ({ size = 18 }: { size?: number }) => <Icon.diamond size={size} />;

// BÂTIMENTS (v1.78.0) — la Mine extrait lentement des diamants (1, 2 puis 3 par heure selon son niveau, améliorée avec
// des diamants) ; le Terrain d'entraînement fait gagner un peu d'expérience aux héros qu'on y place (1 place gratuite, 2 à ouvrir).
export function Buildings() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [pick, setPick] = useState<number | null>(null);
  // En entrant, l'expérience accumulée au Terrain est donnée aux héros.
  useEffect(() => {
    let got: ReturnType<typeof collectTraining> = [];
    mutate((s) => { got = collectTraining(s, Date.now()); });
    const ups = got.filter((g) => g.levels > 0);
    if (ups.length) toast(`Entraînement : ${ups.map((g) => `${HERO_BY_ID[save.heroes.find((h) => h.uid === g.uid)!.heroId].name} +${g.levels} niv.`).join(', ')}`, 'ok');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const b = save.buildings;
  const ready = mineReady(save, now);
  const cap = mineCap(save);
  const rate = mineRate(save);
  const upCost = mineUpgradeCost(save);
  const toNext = ready >= cap ? 0 : Math.max(0, b.mineSince + ((ready + 1) * 3600_000) / rate - now);
  const diamonds = save.resources.diamonds ?? 0;
  const pendingTotal = b.train.reduce((a, _t, i) => a + trainPending(save, i, now), 0);

  const act = (fn: (s: typeof save) => { ok: boolean; reason?: string }, ok: string) => {
    let r = { ok: false } as { ok: boolean; reason?: string };
    mutate((s) => { r = fn(s); });
    if (r.ok) { play('claim'); toast(ok, 'ok'); } else toast(r.reason ?? 'Impossible.', 'error');
  };

  return (
    <Screen title="Bâtiments" right={<span className="bld-wallet"><D /> {fmt(diamonds)}</span>}>
      {/* ── Mine ── */}
      <section className="bld-card">
        <div className="bld-art"><img src={mineArt} alt="" draggable={false} /><span className="bld-lvl">Niv. {b.mineLevel}/{MINE.maxLevel}</span></div>
        <div className="bld-body">
          <div className="bld-head"><b>Mine de diamants</b><span className="faint">{rate} <D size={14} /> par heure</span></div>
          <div className="bld-stock">
            <div className="progress"><div style={{ width: `${(ready / cap) * 100}%` }} /></div>
            <div className="row between faint" style={{ fontSize: 12.5, marginTop: 4 }}>
              <span>Réserve {ready}/{cap}</span>
              <span>{ready >= cap ? 'Réserve pleine : récolte !' : `Prochain diamant dans ${formatDuration(toNext)}`}</span>
            </div>
          </div>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button className="btn grow" disabled={ready <= 0} onClick={() => { let n = 0; mutate((s) => { n = collectMine(s, now); }); if (n) { play('claim'); toast(`+${n} diamant${n > 1 ? 's' : ''}.`, 'ok'); } }}>
              Récolter{ready > 0 ? ` ${ready}` : ''}
            </button>
            {upCost !== null
              ? <button className="btn secondary grow" disabled={diamonds + ready < upCost} onClick={() => act((s) => upgradeMine(s, now), `Mine niveau ${b.mineLevel + 1} : ${MINE.rate[b.mineLevel + 1]} diamants par heure.`)}>Niv. {b.mineLevel + 1} <D size={15} /> {upCost}</button>
              : <span className="faint grow" style={{ textAlign: 'center', alignSelf: 'center' }}>Niveau maximum</span>}
          </div>
        </div>
      </section>

      {/* ── Terrain d'entraînement ── */}
      <section className="bld-card">
        <div className="bld-art"><img src={trainArt} alt="" draggable={false} /></div>
        <div className="bld-body">
          <div className="bld-head"><b>Terrain d’entraînement</b></div>
          <p className="faint" style={{ margin: '0 0 8px', fontSize: 12.5 }}>Les héros placés ici gagnent un peu d’expérience chaque heure ({Math.round(TRAINING.xpPctPerHour * 100)} % d’un niveau), jusqu’à {TRAINING.capHours} h sans passer. Ils peuvent toujours combattre.</p>
          <div className="train-slots">
            {Array.from({ length: TRAINING.slots }, (_, i) => {
              const open = i < b.trainSlots;
              const t = b.train[i];
              const h = t ? save.heroes.find((x) => x.uid === t.uid) : undefined;
              if (!open) {
                const next = i === b.trainSlots;
                return (
                  <button key={i} className="train-slot locked" disabled={!next} onClick={() => act(unlockTrainSlot, 'Nouvelle place ouverte au Terrain.')}>
                    <Icon.lock size={20} />
                    <span><D size={14} /> {TRAINING.slotCost[i]}</span>
                  </button>
                );
              }
              if (!h) return <button key={i} className="train-slot empty" onClick={() => setPick(i)}><span className="plus">+</span><span>Placer un héros</span></button>;
              const maxed = h.level >= maxLevelForRank(h.rank);
              return (
                <button key={i} className="train-slot" onClick={() => setPick(i)} style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[h.heroId].rarity].color }}>
                  <span className="ts-art"><HeroArt heroId={h.heroId} /><span className="ts-lv">{h.level}</span></span>
                  <span className="ts-name">{HERO_BY_ID[h.heroId].name.split(' ')[0]}</span>
                  <span className="ts-xp">{maxed ? 'Niveau max du rang' : `+${fmt(trainXpPerHour(h.level))} XP/h · ${fmt(trainPending(save, i, now))} prêts`}</span>
                </button>
              );
            })}
          </div>
          {pendingTotal > 0 && (
            <button className="btn block" style={{ marginTop: 10 }} onClick={() => { let got: ReturnType<typeof collectTraining> = []; mutate((s) => { got = collectTraining(s, Date.now()); }); play('claim'); const lv = got.reduce((a, g) => a + g.levels, 0); toast(`+${fmt(got.reduce((a, g) => a + g.xp, 0))} XP${lv ? ` · +${lv} niveau${lv > 1 ? 'x' : ''}` : ''}`, 'ok'); }}>
              Donner l’expérience · {fmt(pendingTotal)} XP
            </button>
          )}
        </div>
      </section>

      {pick !== null && (
        <Modal onClose={() => setPick(null)}>
          <h2>Placer un héros</h2>
          {save.buildings.train[pick] && <button className="btn secondary block" style={{ marginBottom: 10 }} onClick={() => { act((s) => placeTrainee(s, pick, null, Date.now()), 'Héros retiré du Terrain.'); setPick(null); }}>Retirer ce héros</button>}
          <div className="train-pick">
            {[...save.heroes]
              .filter((h) => !save.buildings.train.some((t) => t?.uid === h.uid))
              .sort((a, c) => (a.level >= maxLevelForRank(a.rank) ? 1 : 0) - (c.level >= maxLevelForRank(c.rank) ? 1 : 0) || powerOf(computeStats(HERO_BY_ID[c.heroId], c)) - powerOf(computeStats(HERO_BY_ID[a.heroId], a)))
              .map((h) => {
                const maxed = h.level >= maxLevelForRank(h.rank);
                return (
                  <button key={h.uid} className={`tp-hero ${maxed ? 'maxed' : ''}`} style={{ ['--rc' as string]: RARITIES[HERO_BY_ID[h.heroId].rarity].color }}
                    onClick={() => { if (maxed) { toast('Ce héros est au niveau maximum de son rang : l’entraînement ne lui rapporterait rien.'); return; } act((s) => placeTrainee(s, pick, h.uid, Date.now()), `${HERO_BY_ID[h.heroId].name} s’entraîne.`); setPick(null); }}>
                    <span className="ts-art"><HeroArt heroId={h.heroId} /><span className="ts-lv">{h.level}</span></span>
                    <span className="tp-name">{HERO_BY_ID[h.heroId].name.split(' ')[0]}</span>
                  </button>
                );
              })}
          </div>
        </Modal>
      )}
    </Screen>
  );
}
