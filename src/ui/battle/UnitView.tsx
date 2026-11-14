import { useRef } from 'react';
import { hpPct, shieldOf } from '../../game/battle/engine';
import { groupStatuses, statusDescription, statusValueText } from '../../game/battle/statusText';
import { STATUS_INFO, type Unit } from '../../game/battle/types';
import { AFFINITIES } from '../../data/affinities';
import { AffinityIcon } from '../art/Identity';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import { StatusIcon } from '../art/StatusIcon';
import type { Place } from './layout';

// Extrait de Battle.tsx (v1.98.0).
export interface Popup { id: number; text: string; cls: string }
export const shortName = (n: string) => n.replace(/^(Le|La|Les|L’|L')\s*/i, '').split(' ')[0];

export function UnitView({ u, place, order = 0, vfx, focus, active, acting, hit, heavy, targetable, popups, onClick, onInfo, edge }: { u: Unit; place?: Place; order?: number; vfx?: { id: number; cls: string; color: string }; focus?: boolean; active: boolean; acting: boolean; hit: boolean; heavy?: boolean; targetable: boolean; popups: Popup[]; onClick: () => void; onInfo: () => void; edge?: -1 | 0 | 1 }) {
  const sh = Math.min(1, shieldOf(u) / u.base.hp);
  // Appui long (0,45 s) : fiche de l'unité ; le toucher simple garde son rôle (cibler).
  const timer = useRef<number | undefined>(undefined);
  const longDone = useRef(false);
  const startPress = () => { longDone.current = false; window.clearTimeout(timer.current); timer.current = window.setTimeout(() => { longDone.current = true; onInfo(); }, 450); };
  const endPress = () => window.clearTimeout(timer.current);
  // États visibles en permanence sur la carte (givre, braises, poison, étourdissement, bouclier, provocation).
  const has = (id: string) => u.alive && u.statuses.some((x) => x.status === id);
  const stCls = [has('freeze') && 'st-freeze', has('burn') && 'st-burn', has('poison') && 'st-poison', has('stun') && 'st-stun', has('taunt') && 'st-taunt', u.alive && sh > 0 && 'st-shield'].filter(Boolean).join(' ');
  return (
    <button className={`unit ${u.side} ${u.flags.phase2 ? 'phase2' : ''} ${u.alive ? '' : 'dead'} ${active ? 'active' : ''} ${acting ? 'acting' : ''} ${hit ? 'hit' : ''} ${targetable ? 'targetable' : ''} ${u.isBoss ? 'boss' : ''} ${heavy ? 'heavy' : ''} ${focus ? 'focus' : ''} ${stCls}`} data-uid={u.id}
      style={place ? { left: `${place.x}%`, top: `${place.y}%`, zIndex: Math.round(place.y * 10), ['--s' as string]: place.s, ['--i' as string]: order, ['--affc' as string]: AFFINITIES[u.affinity].color } : undefined}
      onClick={() => { if (longDone.current) { longDone.current = false; return; } onClick(); }}
      onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
      onContextMenu={(e) => { e.preventDefault(); if (e.nativeEvent instanceof MouseEvent && (e.nativeEvent as PointerEvent).pointerType !== 'touch') { window.clearTimeout(timer.current); onInfo(); } }}>
      {/* Intention du boss (v1.90.0) : son ultime part au prochain tour, le joueur peut s'y préparer. */}
      {u.isBoss && u.side === 'enemy' && u.alive && (() => { const ul = u.skills.find((k) => k.slot === 'ultimate'); return ul && (u.cooldowns[ul.id] ?? 0) <= 1 ? <span className="u-intent" title={`Au prochain tour : ${ul.name}`}>⚠ {ul.name}</span> : null; })()}
      <div className="u-art">{u.kind === 'hero' ? <HeroArt heroId={u.refId} /> : <EnemyArt enemyId={u.refId} />}<span className="u-lvl">{u.level}</span><span className="u-aff"><AffinityIcon id={u.affinity} size={15} /></span><span className="u-name">{shortName(u.name)}</span>
        {stCls && <span className="u-stfx" aria-hidden><i /><i /><i /></span>}

      </div>
      <div className="u-bars">
        <div className="u-hp"><div style={{ width: `${hpPct(u) * 100}%` }} />{sh > 0 && <div className="u-sh" style={{ width: `${sh * 100}%` }} />}
          {u.isBoss && u.side === 'enemy' && <><i className={`u-act ${u.flags.phase2 ? 'past' : ''}`} style={{ left: '50%' }} />{u.flags.acts === 3 && <i className={`u-act ${u.flags.act3 ? 'past' : ''}`} style={{ left: '25%' }} />}</>}
        </div>
        {u.flags.fractureMax > 0 && <div className={`u-frac ${u.flags.fractured ? 'broken' : ''}`} title="Fracture"><div style={{ width: `${u.flags.fractured ? 100 : (u.flags.fracture / u.flags.fractureMax) * 100}%` }} /></div>}
        <div className="u-tm"><div style={{ width: `${Math.min(100, u.tm / 10)}%` }} /></div>
      </div>
      <EffectChips u={u} />
      {stCls.includes('st-stun') && <span className="u-stars" aria-hidden>✦ ✦ ✦</span>}
      {u.alive && u.flags.carapaceMax > 0 && <span className={`u-cara ${u.flags.carapace ? '' : 'broken'}`} title="Carapace">{u.flags.carapace || '✕'}</span>}
      {u.alive && u.isBoss && u.flags.enraged > 0 && <span className="u-rage" title="Enragé">ENRAGÉ</span>}
      {focus && <span className="u-focus" aria-label="Cible prioritaire"><svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 1v6M12 17v6M1 12h6M17 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>}
      {edge === 1 && <span className="u-edge up">▲ +30 %</span>}
      {edge === -1 && <span className="u-edge down">▼ −20 %</span>}
      {vfx && <span key={vfx.id} className={`vfx ${vfx.cls}`} style={{ ['--vc' as string]: vfx.color }}><i /><i /><i /></span>}
      {popups.map((p) => <span key={p.id} className={`popup ${p.cls}`}>{p.text}</span>)}
    </button>
  );
}

function EffectChips({ u }: { u: Unit }) {
  if (!u.alive || !u.statuses.length) return <div className="u-fx" aria-hidden />;
  const list = groupStatuses(u.statuses).sort((a, b) => Number(STATUS_INFO[b.id].debuff) - Number(STATUS_INFO[a.id].debuff));
  const shown = list.slice(0, 4);
  return (
    <div className="u-fx" aria-label={list.map((g) => `${STATUS_INFO[g.id].name} ${statusValueText(g, u.isBoss)}, ${g.turns} tour${g.turns > 1 ? 's' : ''}`).join(' ; ')}>
      {shown.map((g) => {
        // Version courte pour la pastille : la flèche (▲▼) et la couleur disent déjà le sens, on garde le chiffre.
        const v = statusValueText(g, u.isBoss).replace(/^[+−]/, '').replace(' %', '%');
        return (
          <span key={g.id} className={`fx-chip ${STATUS_INFO[g.id].debuff ? 'neg' : 'pos'}`} style={{ ['--fc' as string]: STATUS_INFO[g.id].color }} title={`${STATUS_INFO[g.id].name} · ${statusDescription(g, u.isBoss)} · ${g.turns} tour${g.turns > 1 ? 's' : ''}`}>
            <StatusIcon id={g.id} size={10} />{v && <i>{v}</i>}<b>{g.turns}</b>
          </span>
        );
      })}
      {list.length > shown.length && <span className="fx-chip more">+{list.length - shown.length}</span>}
    </div>
  );
}
