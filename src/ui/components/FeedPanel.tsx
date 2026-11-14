import { useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { FEED_MAX, copyCandidates, copyHeroId, copyKey, copyXp, feedBlock, feedCandidates, feedHeroes, feedPreview, feedXp, isCopyKey, validFeed } from '../../game/feed';
import { play } from '../../audio/sfx';
import { Modal, Panel, fmt } from './common';
import { Sheet } from './ListControls';
import { HeroCard } from './HeroCard';

// ABSORBER DES HÉROS — 6 emplacements, on y place des héros dont on n'a plus besoin ;
// aperçu du niveau atteint, puis confirmation (l'opération est définitive).
// Les doublons en réserve s'absorbent aussi (v1.68.3) : ils valent le double et ne quittent pas la collection.
export function FeedPanel({ targetUid }: { targetUid: string }) {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [picked, setPicked] = useState<string[]>([]);
  const [choosing, setChoosing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const valid = validFeed(save, targetUid, picked);
  const copies = copyCandidates(save);
  const nCopy = (id: string) => valid.filter((k) => k === copyKey(id)).length;
  const nameOf = (k: string) => isCopyKey(k) ? `doublon de ${HERO_BY_ID[copyHeroId(k)].name.split(/[ ,]/)[0]}` : HERO_BY_ID[save.heroes.find((h) => h.uid === k)!.heroId].name.split(/[ ,]/)[0];
  const p = feedPreview(save, targetUid, valid);
  const cands = feedCandidates(save, targetUid);
  const blocked = save.heroes.filter((h) => h.uid !== targetUid && feedBlock(save, targetUid, h)).length;

  const go = () => {
    let r: ReturnType<typeof feedHeroes> = { ok: false };
    mutate((s) => { r = feedHeroes(s, targetUid, valid); });
    setConfirm(false);
    if (!r.ok) { toast(r.reason ?? 'Impossible.', 'error'); return; }
    play('rare'); setPicked([]);
    toast(r.levels ? `+${r.levels} niveau${r.levels > 1 ? 'x' : ''} !` : 'Expérience gagnée.', 'ok');
  };
  const toggle = (uid: string) => setPicked((cur) => (cur.includes(uid) ? cur.filter((x) => x !== uid) : cur.length < FEED_MAX ? [...cur, uid] : cur));
  // Doublons : chaque toucher en ajoute un (tant qu'il en reste et qu'il y a de la place) ; le ✕ d'un emplacement le retire.
  const addCopy = (id: string, max: number) => setPicked((cur) => (cur.length < FEED_MAX && cur.filter((k) => k === copyKey(id)).length < max ? [...cur, copyKey(id)] : cur));
  const removeAt = (i: number) => setPicked(() => valid.filter((_, j) => j !== i));

  return (
    <Panel title="Absorber des héros">
      <p className="faint" style={{ marginTop: 0 }}><b>Doublons</b> : XP ×2, collection intacte. Autres héros : ils disparaissent, leur équipement revient au sac.</p>
      <div className="feed-slots">
        {Array.from({ length: FEED_MAX }, (_, i) => {
          const k = valid[i];
          if (k && isCopyKey(k)) return (
            <button key={i} className="feed-slot full" onClick={() => removeAt(i)} aria-label={`Retirer un doublon de ${HERO_BY_ID[copyHeroId(k)].name}`}>
              <HeroCard heroId={copyHeroId(k)} badge="Doublon" />
              <span className="feed-x">✕</span>
            </button>
          );
          const h = save.heroes.find((x) => x.uid === k);
          return h ? (
            <button key={i} className="feed-slot full" onClick={() => toggle(h.uid)} aria-label={`Retirer ${HERO_BY_ID[h.heroId].name}`}>
              <HeroCard heroId={h.heroId} level={h.level} />
              <span className="feed-x">✕</span>
            </button>
          ) : (
            <button key={i} className="feed-slot" onClick={() => setChoosing(true)} aria-label="Ajouter un héros">+</button>
          );
        })}
      </div>
      <div className="feed-preview">
        {valid.length ? (
          <>
            <span>+{fmt(p.xp)} XP · Niv. <b>{p.from}</b> → <b className={p.to > p.from ? 'up' : ''}>{p.to}</b>{p.capped ? ` (max du rang ${p.cap})` : ''}</span>
            <span className={save.resources.gold < p.gold ? 'lack' : 'faint'}>{fmt(p.gold)} or</span>
          </>
        ) : <span className="faint">{copies.length ? `${copies.reduce((a, c) => a + c.count, 0)} doublon(s) · ` : ''}{cands.length ? `${cands.length} héros disponibles` : 'Aucun héros disponible'}{blocked ? ` · ${blocked} protégé(s) (équipe, verrou, expédition, avatar)` : ''}</span>}
      </div>
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button className="btn secondary grow" disabled={!cands.length && !copies.length} onClick={() => setChoosing(true)}>Choisir</button>
        <button className="btn grow" disabled={!valid.length || save.resources.gold < p.gold || p.from >= p.cap} onClick={() => setConfirm(true)}>Absorber</button>
      </div>

      {choosing && (
        <Sheet title={`Choisir (${valid.length}/${FEED_MAX})`} onClose={() => setChoosing(false)} footer={<button className="btn block" onClick={() => setChoosing(false)}>Valider</button>}>
          {copies.length > 0 && (
            <>
              <h3 className="feed-h">Doublons en réserve</h3>
              <p className="faint" style={{ marginTop: 0 }}>Touche un doublon pour en ajouter un. Ta collection ne change pas.</p>
              <div className="hero-grid" style={{ marginBottom: 14 }}>
                {copies.map((c) => (
                  <div key={c.heroId} className="feed-cand">
                    <HeroCard heroId={c.heroId} badge={`${nCopy(c.heroId)}/${c.count}`} selected={nCopy(c.heroId) > 0} onClick={() => addCopy(c.heroId, c.count)} />
                    <span className="feed-val">+{fmt(copyXp(c.heroId))}</span>
                  </div>
                ))}
              </div>
              <h3 className="feed-h">Héros</h3>
            </>
          )}
          <p className="faint" style={{ marginTop: 0 }}>Les moins précieux en premier. Ils quittent ta collection. Les héros d’une équipe, verrouillés, en expédition ou en avatar sont protégés.</p>
          <div className="hero-grid">
            {cands.map((h) => (
              <div key={h.uid} className="feed-cand">
                <HeroCard heroId={h.heroId} level={h.level} selected={picked.includes(h.uid)} onClick={() => toggle(h.uid)} />
                <span className="feed-val">+{fmt(feedXp(h))}</span>
              </div>
            ))}
          </div>
        </Sheet>
      )}
      {confirm && (
        <Modal onClose={() => setConfirm(false)}>
          <h2>Absorber {valid.length} héros ?</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
            {valid.map(nameOf).join(', ')} : absorption définitive.
            {' '}Niveau {p.from} → {p.to}, pour {fmt(p.gold)} or.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setConfirm(false)}>Annuler</button>
            <button className="btn danger grow" onClick={go}>Absorber</button>
          </div>
        </Modal>
      )}
    </Panel>
  );
}
