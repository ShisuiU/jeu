import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { STAGE_BY_ID, CHAPTERS, type DifficultyId } from '../../data/campaign';
import { HERO_BY_ID } from '../../data/heroes';
import { createBattle, beginTurn, performAction, unitById, availableSkills, targetKind, validTargets, hpPct, shieldOf, predictOrder } from '../../game/battle/engine';
import { chooseAction } from '../../game/battle/ai';
import { STATUS_INFO, type Action, type BattleState, type Unit } from '../../game/battle/types';
import { effectiveCooldown } from '../../game/battle/skillMods';
import { applyStageResult, stageProgress, stageWaves, teamSetups, payStage, type BattleResult } from '../../game/campaign';
import { heroXpToNext } from '../../game/progression';
import { play } from '../../audio/sfx';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import { Icon } from '../art/Icons';
import { BattleBackdrop } from '../art/BattleBackdrop';
import { Dialogue } from '../components/Dialogue';
import { Modal } from '../components/common';
import { RewardView } from '../components/RewardView';
import { HeroCard } from '../components/HeroCard';

type Phase = 'intro' | 'fight' | 'outro' | 'result';
interface Popup { id: number; text: string; cls: string }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let popSeq = 0;

export function Battle({ stageId, teamId, difficulty, seed }: { stageId: string; teamId: string; difficulty: DifficultyId; seed: number }) {
  const stage = STAGE_BY_ID[stageId];
  const chapter = CHAPTERS.find((c) => c.n === stage.chapter)!;
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const updateSettings = useGame((s) => s.updateSettings);
  const { popTo, replace, toast } = useUI.getState();

  const [initial] = useState(() => {
    const team = save.teams.find((t) => t.id === teamId) ?? save.teams[0];
    const allies = teamSetups(save, team);
    const firstTime = stageProgress(save, difficulty, stageId).clears === 0;
    return { team, allies, firstTime, battle: createBattle(allies, stageWaves(stage, difficulty), { seed, leaderUid: team.leader }) };
  });
  const sRef = useRef<BattleState>(initial.battle);
  const s = sRef.current;
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [phase, setPhase] = useState<Phase>(initial.firstTime && stage.before?.length ? 'intro' : 'fight');
  const [auto, setAuto] = useState(save.settings.autoBattleDefault);
  const [speed, setSpeed] = useState<1 | 2 | 3>(save.settings.battleSpeed);
  const [awaiting, setAwaiting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ text: string; side: string } | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [hits, setHits] = useState<Set<string>>(new Set());
  const [popups, setPopups] = useState<Record<string, Popup[]>>({});
  const [result, setResult] = useState<BattleResult | null>(null);
  const [quit, setQuit] = useState(false);
  const autoRef = useRef(auto); autoRef.current = auto;
  const speedRef = useRef(speed); speedRef.current = speed;
  const alive = useRef(true);
  const busy = useRef(false);
  const finished = useRef(false);

  useEffect(() => () => { alive.current = false; }, []);

  const addPopup = (unitId: string, text: string, cls: string) => {
    const id = ++popSeq;
    setPopups((p) => ({ ...p, [unitId]: [...(p[unitId] ?? []).slice(-3), { id, text, cls }] }));
    setTimeout(() => setPopups((p) => ({ ...p, [unitId]: (p[unitId] ?? []).filter((x) => x.id !== id) })), 1200);
  };

  const playEvents = async () => {
    const ev = s.events;
    s.events = [];
    if (!ev.length) return;
    const hit = new Set<string>();
    let pause = false;
    for (const e of ev) {
      switch (e.kind) {
        case 'damage': hit.add(e.target); addPopup(e.target, `${e.crit ? 'CRIT ' : ''}-${e.amount}`, `dmg ${e.crit ? 'crit' : ''} ${e.strong ? 'strong' : ''} ${e.weak ? 'weak' : ''}`); pause = true; break;
        case 'dot': hit.add(e.target); addPopup(e.target, `-${e.amount}`, e.status === 'poison' ? 'poison' : 'burn'); pause = true; break;
        case 'heal': if (e.amount > 0) addPopup(e.target, `+${e.amount}`, 'heal'); pause = true; break;
        case 'shield': addPopup(e.target, `+${e.amount}`, 'shieldp'); break;
        case 'status': addPopup(e.target, STATUS_INFO[e.status].name, STATUS_INFO[e.status].debuff ? 'debuff' : 'buff'); break;
        case 'resist': addPopup(e.target, e.immune ? 'Immunisé' : 'Résisté', 'resist'); break;
        case 'skip': addPopup(e.target, STATUS_INFO[e.status].name, 'debuff'); pause = true; break;
        case 'death': addPopup(e.target, 'K.O.', 'death'); pause = true; break;
        case 'revive': addPopup(e.target, 'Ressuscité !', 'heal'); play('rare'); pause = true; break;
        case 'undying': addPopup(e.target, 'Ce qui ne meurt pas', 'buff'); break;
        case 'extraTurn': addPopup(e.target, 'Tour bonus !', 'buff'); break;
        case 'cleanse': addPopup(e.target, 'Purifié', 'buff'); break;
        case 'wave': setBanner({ text: `Vague ${e.wave} / ${s.totalWaves}`, side: 'wave' }); play('open'); force(); await wait(1100 / speedRef.current); setBanner(null); break;
      }
    }
    if (hit.size) { setHits(hit); play('tap'); }
    force();
    if (pause) await wait(620 / speedRef.current);
    setHits(new Set());
  };

  const doAction = async (a: Action) => {
    const actor = unitById(s, s.activeId!);
    const sk = actor.skills.find((x) => x.id === a.skillId)!;
    setBanner({ text: sk.name, side: actor.side });
    setActing(actor.id);
    force();
    await wait(400 / speedRef.current);
    performAction(s, a);
    await playEvents();
    setActing(null);
    setBanner(null);
  };

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const won = s.outcome === 'won';
    const dead = s.units.filter((u) => u.side === 'ally' && !u.alive).length;
    let res: BattleResult | null = null;
    mutate((d) => { res = applyStageResult(d, stageId, difficulty, won, dead, initial.allies.map((a) => a.heroUid!), Date.now()); });
    setResult(res);
    play(won ? 'claim' : 'error');
    setPhase(won && initial.firstTime && stage.after?.length ? 'outro' : 'result');
  }, [s, mutate, stageId, difficulty, initial, stage.after]);

  const run = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      while (alive.current && s.outcome === 'running') {
        if (!s.activeId) {
          beginTurn(s);
          await playEvents();
          if (s.outcome !== 'running' || !s.activeId) continue;
        }
        const actor = unitById(s, s.activeId);
        if (actor.side === 'ally' && !autoRef.current) {
          const first = availableSkills(actor)[0];
          setSelected(first ? first.id : null);
          setAwaiting(true);
          force();
          return;
        }
        await doAction(chooseAction(s, actor));
      }
      if (alive.current && s.outcome !== 'running') { await wait(500 / speedRef.current); finish(); }
    } finally { busy.current = false; }
  }, [s, finish]);

  useEffect(() => { if (phase === 'fight' && !finished.current) void run(); }, [phase, run]);
  useEffect(() => { if (auto && awaiting) { setAwaiting(false); void run(); } }, [auto, awaiting, run]);

  const active = s.activeId ? unitById(s, s.activeId) : null;
  const selSkill = active && selected ? active.skills.find((x) => x.id === selected) : undefined;
  const targetable = awaiting && active && selSkill ? new Set(validTargets(s, active, selSkill).map((u) => u.id)) : new Set<string>();

  const act = async (targetId?: string) => {
    if (!awaiting || !active || !selSkill) return;
    setAwaiting(false);
    await doAction({ skillId: selSkill.id, targetId });
    void run();
  };

  const onUnit = (u: Unit) => { if (targetable.has(u.id)) void act(u.id); };

  const toggleAuto = () => { const v = !auto; setAuto(v); updateSettings({ autoBattleDefault: v }); play('tap'); };
  const cycleSpeed = () => { const v = (speed === 3 ? 1 : speed + 1) as 1 | 2 | 3; setSpeed(v); updateSettings({ battleSpeed: v }); play('tap'); };

  const doQuit = () => { setQuit(false); s.outcome = 'lost'; s.activeId = null; alive.current = false; finish(); };

  const retry = () => {
    let ok = false;
    mutate((d) => { ok = payStage(d, stage, useGame.getState().now); });
    if (!ok) { toast('Énergie insuffisante.', 'error'); return; }
    replace({ name: 'battle', stageId, teamId, difficulty, seed: Date.now() });
  };
  const nextStage = chapter.stages[chapter.stages.indexOf(stage) + 1];

  const order = s.outcome === 'running' ? predictOrder(s, 7) : [];
  const side = (sd: 'ally' | 'enemy') => s.units.filter((u) => u.side === sd);
  const row = (sd: 'ally' | 'enemy', back: boolean) => side(sd).filter((u) => (back ? u.slot >= 3 : u.slot < 3)).sort((a, b) => a.slot - b.slot);

  const renderUnit = (u: Unit) => (
    <UnitView key={u.id} u={u} active={s.activeId === u.id} acting={acting === u.id} hit={hits.has(u.id)}
      targetable={targetable.has(u.id)} popups={popups[u.id] ?? []} onClick={() => onUnit(u)} />
  );

  return (
    <div className="battle">
      <BattleBackdrop region={chapter.backdrop} />
      <div className="battle-top">
        <div className="row between">
          <div>
            <div className="battle-stage">{stage.id} · {stage.name}</div>
            <div className="faint">Vague {s.wave} / {s.totalWaves}</div>
          </div>
          <button className="back-btn" aria-label="Abandonner" onClick={() => setQuit(true)}><Icon.menu /></button>
        </div>
        <div className="turn-order">
          {order.map((id, i) => {
            const u = s.units.find((x) => x.id === id);
            if (!u) return null;
            return <div key={i} className={`to-item ${u.side}`}>{u.kind === 'hero' ? <HeroArt heroId={u.refId} /> : <EnemyArt enemyId={u.refId} />}</div>;
          })}
        </div>
      </div>

      <div className="field enemy-field">
        <div className="frow back">{row('enemy', true).map(renderUnit)}</div>
        <div className="frow">{row('enemy', false).map(renderUnit)}</div>
      </div>

      {banner && <div className={`skill-banner ${banner.side}`} key={banner.text + banner.side}>{banner.text}</div>}

      <div className="field ally-field">
        <div className="frow">{row('ally', false).map(renderUnit)}</div>
        <div className="frow back">{row('ally', true).map(renderUnit)}</div>
      </div>

      <div className="battle-controls">
        {awaiting && active && selSkill ? (
          <div className="skill-info">
            <div className="row between">
              <span><b>{shortName(active.name)}</b> · {selSkill.name} <span className="faint">· {selSkill.cooldown ? `recharge ${effectiveCooldown(selSkill, active.skillLevels[selSkill.id] ?? 1)} t.` : 'chaque tour'}</span></span>
              {targetKind(selSkill) === 'none'
                ? <button className="btn small" style={{ minHeight: 28 }} onClick={() => act()}>Lancer</button>
                : <span className="hint-target">{targetKind(selSkill) === 'ally' ? '▸ un allié' : '▸ un ennemi'}</span>}
            </div>
            <div className="desc">{selSkill.description}</div>
          </div>
        ) : (
          <div className="skill-info idle">{s.outcome !== 'running' ? 'Combat terminé' : auto ? 'Combat automatique — touchez AUTO pour reprendre la main' : active?.side === 'enemy' || !active ? 'Tour de l’ennemi…' : '…'}</div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <button className={`ctrl ${auto ? 'on' : ''}`} onClick={toggleAuto}>AUTO</button>
          <button className="ctrl" onClick={cycleSpeed}>×{speed}</button>
          <div className="skills">
            {awaiting && active && active.skills.filter((x) => x.slot !== 'passive').map((sk, i) => {
              const cd = active.cooldowns[sk.id] ?? 0;
              return (
                <button key={sk.id} className={`skill-btn ${sk.slot} ${selected === sk.id ? 'sel' : ''}`} disabled={cd > 0}
                  onClick={() => { play('tap'); if (selected === sk.id && targetKind(sk) === 'none') void act(); else setSelected(sk.id); }}>
                  <span className="n">{sk.slot === 'ultimate' ? '★' : i + 1}</span>
                  {cd > 0 && <span className="cd">{cd}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {phase === 'intro' && <Dialogue lines={stage.before!} onDone={() => setPhase('fight')} />}
      {phase === 'outro' && <Dialogue lines={stage.after!} onDone={() => setPhase('result')} />}

      {phase === 'result' && result && (
        <div className="result-overlay">
          <div className={`result-title ${result.won ? 'win' : 'lose'}`}>{result.won ? 'VICTOIRE' : 'DÉFAITE'}</div>
          {result.won && (
            <div className="result-stars">
              {[1, 2, 3].map((n) => <span key={n} className={n <= result.stars ? 'on' : ''} style={{ animationDelay: `${0.3 + n * 0.2}s` }}><Icon.star size={46} color={n <= result.stars ? '#ffd36b' : '#3a3442'} /></span>)}
            </div>
          )}
          <div className="result-body">
            {result.won ? (
              <>
                {result.firstClear && <div className="chip active" style={{ margin: '0 auto 10px', display: 'flex', width: 'fit-content' }}>Première victoire</div>}
                {result.newHeroes.map((id) => (
                  <div key={id} className="new-hero">
                    <div style={{ width: 110 }}><HeroCard heroId={id} level={1} /></div>
                    <div><div className="faint">NOUVEL HÉRITIER</div><b style={{ fontSize: 17 }}>{HERO_BY_ID[id].name}</b><div className="muted">rejoint votre collection ! Ajoutez-le à une équipe dans l’écran Équipe.</div></div>
                  </div>
                ))}
                <RewardView reward={result.reward} />
                <div className="xp-list">
                  {result.heroXp.map((h) => {
                    const inst = useGame.getState().save!.heroes.find((x) => x.uid === h.uid);
                    return (
                      <div key={h.uid} className="xp-row">
                        <div className="xp-ava"><HeroArt heroId={h.heroId} /></div>
                        <div className="grow">
                          <div className="row between"><b>{HERO_BY_ID[h.heroId].name}</b><span className={h.levelsGained ? 'lvlup' : 'faint'}>{h.levelsGained ? `Niv. ${h.level} ▲` : h.capped ? 'Niveau max' : `Niv. ${h.level}`}</span></div>
                          <div className="progress"><div style={{ width: `${inst && !h.capped ? (inst.xp / heroXpToNext(inst.level)) * 100 : 100}%` }} /></div>
                        </div>
                        <span className="faint">+{h.xp} XP</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="hint">
                Les Effacés l’emportent cette fois. Pistes : rejouez les niveaux précédents pour gagner de l’expérience, placez un défenseur en première ligne et un soigneur en seconde ligne, ou jouez en manuel pour cibler le Chantre en priorité.
              </div>
            )}
            {result.accountLevelsGained > 0 && <div className="chip active" style={{ margin: '10px auto 0', display: 'flex', width: 'fit-content' }}>Niveau de compte {useGame.getState().save!.profile.level} ! +2 000 or, +30 énergie</div>}
          </div>
          <div className="result-actions">
            <button className="btn secondary grow" onClick={() => popTo('campaign')}>Campagne</button>
            <button className="btn secondary grow" onClick={retry}>{result.won ? 'Rejouer' : 'Réessayer'} <Icon.energy size={16} />{stage.energy}</button>
            {result.won && nextStage && <button className="btn grow" onClick={() => replace({ name: 'stage', stageId: nextStage.id })}>Suivant</button>}
          </div>
        </div>
      )}

      {quit && (
        <Modal onClose={() => setQuit(false)}>
          <h2>Abandonner ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>Le combat sera compté comme une défaite. L’énergie dépensée n’est pas rendue.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setQuit(false)}>Continuer</button>
            <button className="btn danger grow" onClick={doQuit}>Abandonner</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const shortName = (n: string) => n.replace(/^(Le|La|Les|L’|L')\s*/i, '').split(' ')[0];

function UnitView({ u, active, acting, hit, targetable, popups, onClick }: { u: Unit; active: boolean; acting: boolean; hit: boolean; targetable: boolean; popups: Popup[]; onClick: () => void }) {
  const sh = Math.min(1, shieldOf(u) / u.base.hp);
  return (
    <button className={`unit ${u.side} ${u.alive ? '' : 'dead'} ${active ? 'active' : ''} ${acting ? 'acting' : ''} ${hit ? 'hit' : ''} ${targetable ? 'targetable' : ''} ${u.isBoss ? 'boss' : ''}`} onClick={onClick}>
      <div className="u-art">{u.kind === 'hero' ? <HeroArt heroId={u.refId} /> : <EnemyArt enemyId={u.refId} />}<span className="u-lvl">{u.level}</span><span className="u-name">{shortName(u.name)}</span></div>
      <div className="u-bars">
        <div className="u-hp"><div style={{ width: `${hpPct(u) * 100}%` }} />{sh > 0 && <div className="u-sh" style={{ width: `${sh * 100}%` }} />}</div>
        <div className="u-tm"><div style={{ width: `${Math.min(100, u.tm / 10)}%` }} /></div>
      </div>
      <div className="u-status">
        {u.statuses.slice(0, 4).map((st) => <span key={st.uid} style={{ color: STATUS_INFO[st.status].color, borderColor: STATUS_INFO[st.status].color + '66' }}>{STATUS_INFO[st.status].short}{st.status !== 'shield' ? st.turns : ''}</span>)}
      </div>
      {popups.map((p) => <span key={p.id} className={`popup ${p.cls}`}>{p.text}</span>)}
    </button>
  );
}
