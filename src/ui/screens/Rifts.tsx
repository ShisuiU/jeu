import { useEffect, useState } from 'react';
import { CHALLENGES, RIFT_OATH_BONUS, checkChallenge, riftOathOf } from '../../data/challenges';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { RIFT_NODE, RIFT_ROOMS, RELIC_BY_ID, riftReward, type RiftNodeKind } from '../../data/rift';
import { HERO_BY_ID } from '../../data/heroes';
import { chooseNode, pickRelic, startRift, syncRift } from '../../game/rift';
import { formatDuration, msUntilWeekReset } from '../../core/time';
import { play } from '../../audio/sfx';
import { Modal, Screen } from '../components/common';
import { HeroArt } from '../art/HeroArt';
import { RewardInline } from '../components/RewardView';

const NODE_ICON: Record<RiftNodeKind, string> = { fight: '⚔', elite: '☠', altar: '✦', rest: '❖', boss: '♛' };

// LES FAILLES (v1.93.0) — expédition hebdomadaire en 10 salles : routes au choix, reliques, PV conservés.
export function Rifts() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const { push, toast } = useUI.getState();
  useEffect(() => { if (save.rift.week !== '' && save.rift.nodes.length) return; mutate((s) => { syncRift(s, Date.now()); }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { mutate((s) => { syncRift(s, Date.now()); }); }, [Math.floor(now / 60000)]); // eslint-disable-line react-hooks/exhaustive-deps
  const r = save.rift;
  useEffect(() => { const t = window.setTimeout(() => document.querySelector('.rp-room.here')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350); return () => clearTimeout(t); }, [r.room, r.status]);
  const team = save.teams.find((t) => t.id === save.activeTeamId) ?? save.teams[0];
  const resetIn = formatDuration(msUntilWeekReset(now));

  const [oath, setOath] = useState(false);
  const oathId = riftOathOf(r.week || 'x');
  const oathWhy = checkChallenge(oathId, team.slots.filter((u): u is string => !!u).map((u) => save.heroes.find((h) => h.uid === u)).filter((h): h is NonNullable<typeof h> => !!h).map((h) => HERO_BY_ID[h.heroId]));
  const enter = () => { let res = { ok: false } as ReturnType<typeof startRift>; mutate((s) => { res = startRift(s, team.slots.filter((u): u is string => !!u), Date.now(), oath && !oathWhy); }); if (res.ok) play('rare'); else toast(res.reason ?? 'Impossible.', 'error'); };
  const choose = (i: number) => {
    let res = { ok: false } as ReturnType<typeof chooseNode>;
    mutate((s) => { res = chooseNode(s, i); });
    if (!res.ok) { toast(res.reason ?? 'Impossible.', 'error'); return; }
    if (res.fight) push({ name: 'battle', spec: { mode: 'rift', room: r.room }, teamId: 'rift', seed: Date.now() });
    else play('claim');
  };
  const pick = (id: string) => { mutate((s) => { pickRelic(s, id); }); play('claim'); toast(`Relique : ${RELIC_BY_ID[id].name}`, 'ok'); };

  return (
    <Screen title="Les Failles">
      <section className="rift-head">
        <div className="faint" style={{ fontSize: 12 }}>Traversée de la semaine{resetIn ? ` · nouvelle faille dans ${resetIn}` : ''}</div>
        <p style={{ margin: '6px 0 0', fontSize: 13 }}>Dix salles, une tentative. Les PV sont conservés entre les combats ; un héros tombé attend une halte.</p>
      </section>

      {r.status !== 'idle' && (
        <section className="rift-team">
          {r.team.map((u) => { const h = save.heroes.find((x) => x.uid === u); if (!h) return null; const hp = r.hp[u] ?? 0; return (
            <div key={u} className={`rt-hero ${hp <= 0 ? 'down' : ''}`}><div className="rt-art"><HeroArt heroId={h.heroId} /></div><div className="rt-hp"><div style={{ width: `${hp * 100}%` }} /></div><span>{HERO_BY_ID[h.heroId].name.split(' ')[0]}</span></div>
          ); })}
        </section>
      )}
      {r.status !== 'idle' && r.oath && <div className="rift-relics"><span className="chip oath-chip">⚑ Serment : {CHALLENGES[r.oath].name}</span></div>}
      {r.relics.length > 0 && <div className="rift-relics">{r.relics.map((id) => <span key={id} className="chip" title={RELIC_BY_ID[id]?.text}>✦ {RELIC_BY_ID[id]?.name}</span>)}</div>}

      <div className="rift-path">
        {Array.from({ length: RIFT_ROOMS }, (_, i) => i + 1).map((room) => {
          const opts = r.nodes[room - 1] ?? [];
          const here = r.status === 'run' && room === r.room;
          const past = room < r.room || r.status === 'won';
          return (
            <div key={room} className={`rp-room ${here ? 'here' : ''} ${past ? 'past' : ''}`}>
              <span className="rp-n">{room}</span>
              <div className="rp-opts">
                {opts.map((k, i) => (
                  <button key={i} className={`rp-node k-${k}`} disabled={!here || !!r.current || !!r.altar} onClick={() => choose(i)}>
                    <b>{NODE_ICON[k]} {RIFT_NODE[k].name}</b>
                    {here && <small>{RIFT_NODE[k].text}</small>}
                    {here && (k === 'fight' || k === 'elite' || k === 'boss') && <RewardInline reward={riftReward(k, room)} />}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {r.status === 'idle' && (
        <button className={`oath-card ${oath && !oathWhy ? 'on' : ''}`} disabled={!!oathWhy} aria-pressed={oath && !oathWhy} onClick={() => { play('tap'); setOath((v) => !v); }}>
          <span className="oc-box">{oath && !oathWhy ? '✓' : ''}</span>
          <span className="grow">
            <b>⚑ Serment de la semaine · {CHALLENGES[oathId].name}</b>
            <small>{CHALLENGES[oathId].text} Tiens-le jusqu’au Gardien pour un bonus :</small>
            <RewardInline reward={RIFT_OATH_BONUS} />
            {oathWhy && <small className="neg">Équipe active : {oathWhy}</small>}
          </span>
        </button>
      )}
      {r.status === 'idle' && <button className="btn block" style={{ marginTop: 12 }} onClick={enter}>Entrer dans la faille{oath && !oathWhy ? ' sous serment' : ' avec l’équipe active'}</button>}
      {r.status === 'run' && r.current && (r.current === 'fight' || r.current === 'elite' || r.current === 'boss') && !r.altar && (
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => push({ name: 'battle', spec: { mode: 'rift', room: r.room }, teamId: 'rift', seed: Date.now() })}>Combattre · salle {r.room}</button>
      )}
      {r.status === 'won' && <p className="rift-end win">Faille refermée cette semaine. Reviens la semaine prochaine pour une nouvelle traversée.</p>}
      {r.status === 'lost' && <p className="rift-end">La faille t’a rejeté à la salle {r.best + 1}. Nouvelle tentative la semaine prochaine.</p>}

      {r.altar && (
        <Modal onClose={() => toast('Choisis une relique pour continuer.')}>
          <h2>Choisis une relique</h2>
          <div className="relic-pick">
            {r.altar.map((id) => <button key={id} className="relic" onClick={() => pick(id)}><b>✦ {RELIC_BY_ID[id].name}</b><span>{RELIC_BY_ID[id].text}</span></button>)}
          </div>
        </Modal>
      )}
    </Screen>
  );
}
