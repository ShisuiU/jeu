import { trackStat } from '../../state/stats';
import { factionTeam } from '../../game/factionDungeon';
import { defeatTips } from '../../game/tips';
import { riftSetups } from '../../game/rift';
import { COUTURE_BY_ID } from '../../data/coutures';
import { energyMax } from '../../game/energy';
import { AccountXp } from '../components/AccountXp';
import { Coach } from '../components/Coach';
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { createBattle, beginTurn, performAction, unitById, availableSkills, targetKind, validTargets,  predictOrder, autoLien, castLien, lienReady, LIEN_POWERS } from '../../game/battle/engine';
import { LIEN_MAX, LIEN_USES, type LienPower } from '../../game/battle/types';
import { chooseAction } from '../../game/battle/ai';
import { StatusIcon } from '../art/StatusIcon';
import { STATUS_INFO, type Action, type BattleState, type Unit, type UnitSetup } from '../../game/battle/types';
import { teamSetups } from '../../game/campaign';
import { applyMode, nextSpec, payMode, resolveMode, type BattleSpec, type ModeResult } from '../../game/modes';
import { play } from '../../audio/sfx';
import { playMusic } from '../../audio/music';
import { loadCloud } from '../../cloud/account';
import { playerTeamPower } from '../../game/arena';
import { ENEMIES } from '../../data/enemies';
import { playCast, playDeath, playDot, playFlip, playHeal, playImpact, playRevive, playShield, playStatus } from '../../audio/battleSfx';
import { skillFx, type SkillFx } from '../fx/skillFx';
import { AffinityIcon, affinityEdge } from '../art/Identity';
import { AFFINITIES } from '../../data/affinities';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import { Icon } from '../art/Icons';
import { BattleScene } from '../art/BattleBackdrop';
import { useStageFx } from '../battle/useStageFx';
import { stagePlace, type Place } from '../battle/layout';
import { previewTargets } from '../battle/targets';
import { FxLayer, type FxItem } from '../battle/FxLayer';
import { UnitView, type Popup } from '../battle/UnitView';
import { DamageRecap, EffectsLegend, SkillInfoBody, SLOT_TAG, UnitInfo } from '../battle/Panels';
import { ACT3 } from '../../data/bossActs';
import { Dialogue } from '../components/Dialogue';
import { Modal } from '../components/common';
import { RewardView } from '../components/RewardView';
import { HeroCard } from '../components/HeroCard';

type Phase = 'intro' | 'fight' | 'outro' | 'result';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Pause (v1.73.7) : tant que le menu pause est ouvert, le déroulé du combat attend.
let paused = false;
const wait = async (ms: number) => { await sleep(ms); while (paused) await sleep(120); };
let popSeq = 0;

export function Battle({ spec, teamId, seed, guest }: { spec: BattleSpec; teamId: string; seed: number; guest?: UnitSetup }) {
  const save = useGame((s) => s.save)!;
  const secondFight = Object.values(save.progress.campaign).some((p) => p.clears > 0);
  const mutate = useGame((s) => s.mutate);
  const updateSettings = useGame((s) => s.updateSettings);
  const { popTo, replace, toast } = useUI.getState();

  const [initial] = useState(() => {
    // Donjon des familles (v1.79.0) : l'équipe est celle de la famille du donjon.
    const team = spec.mode === 'faction' ? factionTeam(save, spec.faction) : spec.mode === 'rift' ? { id: 'rift', name: 'Équipe de la Faille', slots: save.rift.team.slice(0, 5).concat(Array(5).fill(null)).slice(0, 5), leader: save.rift.team[0] ?? null } : save.teams.find((t) => t.id === teamId) ?? save.teams[0];
    // Renfort d'un ami : son héros prend la première place libre de l'équipe.
    const own = teamSetups(save, team);
    const free = [0, 1, 2, 3, 4].find((i) => !own.some((a) => a.slot === i));
    const allies0 = guest && free != null ? [...own, { ...guest, slot: free }] : own;
    // Failles : reliques et PV conservés ; les héros tombés restent au repos.
    const allies = spec.mode === 'rift' ? riftSetups(save, allies0) : allies0;
    const info = resolveMode(save, spec);
    return { team, allies, info, battle: createBattle(allies, info.waves, { seed, leaderUid: team.leader, turnLimit: info.turnLimit }) };
  });
  const sRef = useRef<BattleState>(initial.battle);
  const s = sRef.current;
  const [, force] = useReducer((x: number) => x + 1, 0);
  const [phase, setPhase] = useState<Phase>(initial.info.before?.length ? 'intro' : 'fight');
  const [auto, setAuto] = useState(save.settings.autoBattleDefault);
  const [speed, setSpeed] = useState<1 | 2 | 3>(save.settings.battleSpeed);
  const [awaiting, setAwaiting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ text: string; side: string } | null>(null);
  const [bossIntro, setBossIntro] = useState<Unit | null>(null);
  const [bossAct, setAct] = useState(1); // acte du boss (v1.97.0) : teinte la scène
  const introDone = useRef(false);
  const [acting, setActing] = useState<string | null>(null);
  const [hits, setHits] = useState<Set<string>>(new Set());
  const [popups, setPopups] = useState<Record<string, Popup[]>>({});
  const [vfx, setVfx] = useState<Record<string, { id: number; cls: string; color: string }>>({});
  // Sensations : tremblement sur les gros coups, ralenti sur le coup fatal.
  const [shake, setShake] = useState<'' | 'soft' | 'hard'>('');
  const [waveCard, setWaveCard] = useState<{ n: number; total: number; boss: boolean } | null>(null);
  const [slowmo, setSlowmo] = useState(false);
  const doShake = (k: 'soft' | 'hard') => { if (save.settings.reducedMotion) return; setShake(k); setTimeout(() => setShake(''), k === 'hard' ? 420 : 260); };
  const [ult, setUlt] = useState<{ side: string; kind: 'hero' | 'enemy'; refId: string; skill: string; color: string } | null>(null);
  const [skipFx, setSkipFx] = useState(false);
  const [wave, setWave] = useState<{ side: 'ally' | 'enemy'; color: string; id: number } | null>(null);
  const [result, setResult] = useState<ModeResult | null>(null);
  const [quit, setQuit] = useState(false);
  const [legend, setLegend] = useState(false);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [heavyHits, setHeavyHits] = useState<Set<string>>(new Set());
  const measureRef = useRef<HTMLDivElement>(null);
  const [infoH, setInfoH] = useState(64);
  // Musique : la couleur de la région ; le thème du boss dès que sa vague arrive.
  const bossWave = initial.info.waves.findIndex((w) => w.some((e) => e.kind === 'enemy' && ENEMIES[e.refId]?.boss));
  useEffect(() => { if (save.settings.music) playMusic(bossWave === 0 ? 'boss' : 'battle', initial.info.region); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Entrée du boss (v1.95.0) : bandes de cinéma, titre, faiblesse ; le combat attend la fin de la présentation.
  const showBoss = async (boss: Unit) => {
    if (useGame.getState().save?.settings.reducedMotion || speedRef.current >= 3) return;
    setBossIntro(boss); play('rare');
    const c = center(boss.id); if (c) camTo(c, 1.14, 700);
    await sleep(1900 / Math.sqrt(speedRef.current));
    camTo(null, 1, 600); setBossIntro(null);
  };
  useLayoutEffect(() => {
    const el = measureRef.current; if (!el) return;
    let m = 0; el.querySelectorAll<HTMLElement>('.skill-info').forEach((x) => { m = Math.max(m, x.offsetHeight); });
    if (m) setInfoH(Math.min(m, 140));
  }, []);
  useEffect(() => {
    if (phase !== 'fight') return;
    try { if (!localStorage.getItem('aeonfall.tip.unitInfo')) { localStorage.setItem('aeonfall.tip.unitInfo', '1'); setTimeout(() => useUI.getState().toast(window.matchMedia?.('(pointer: fine)').matches ? 'Astuce : clic droit (ou clic maintenu) sur une carte pour voir ses effets.' : 'Astuce : garde le doigt appuyé sur une carte pour voir ses effets.'), 1500); } } catch { /* ignoré */ }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const autoRef = useRef(auto); autoRef.current = auto;
  // Cible prioritaire (v1.70.1) : en combat auto, toucher un ennemi le désigne ; l'équipe le vise dès qu'elle peut.
  const [focusId, setFocusId] = useState<string | null>(null);
  const focusRef = useRef(focusId); focusRef.current = focusId;
  const speedRef = useRef(speed); speedRef.current = speed;
  const alive = useRef(true);
  const busy = useRef(false);
  const finished = useRef(false);

  useEffect(() => () => { alive.current = false; paused = false; }, []);
  useEffect(() => { paused = quit; }, [quit]);
  // Boss dès la première vague : il fait son entrée avant le premier coup.
  useEffect(() => {
    if (phase !== 'fight' || introDone.current || bossWave !== 0) return;
    introDone.current = true;
    const boss = s.units.find((u) => u.side === 'enemy' && u.isBoss && u.alive); if (!boss) return;
    paused = true;
    void showBoss(boss).then(() => { paused = false; });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const addPopup = (unitId: string, text: string, cls: string) => {
    const id = ++popSeq;
    setPopups((p) => ({ ...p, [unitId]: [...(p[unitId] ?? []).slice(-3), { id, text, cls }] }));
    setTimeout(() => setPopups((p) => ({ ...p, [unitId]: (p[unitId] ?? []).filter((x) => x.id !== id) })), 1200);
  };

  const addVfx = (unitId: string, cls: string, color: string) => {
    if (useGame.getState().save?.settings.reducedMotion) return;
    const id = ++popSeq;
    setVfx((v) => ({ ...v, [unitId]: { id, cls, color } }));
    setTimeout(() => setVfx((v) => (v[unitId]?.id === id ? (({ [unitId]: _, ...rest }) => rest)(v) : v)), 750);
  };

  // ─── Couche d'effets (projectiles, pluies, rayons) positionnée sur les cartes ───
  const battleRef = useRef<HTMLDivElement>(null);
  const [fxItems, setFxItems] = useState<FxItem[]>([]);
  const { camRef, stageCanvas, stage, posOf, center, camTo, flashLight, lungeTo, knock, motionOn } = useStageFx(battleRef, speedRef, initial.info.region);
  const spawn = (item: Omit<FxItem, 'id'>) => {
    const id = ++popSeq;
    setFxItems((l) => [...l, { ...item, id }]);
    setTimeout(() => setFxItems((l) => l.filter((x) => x.id !== id)), item.dur + 60);
  };
  const fxFor = (unitId: string): SkillFx => { const u = unitById(s, unitId); const sk = u.skills.find((x) => x.slot === 'basic') ?? u.skills[0]; return skillFx(sk, u.affinity); };

  const playEvents = async (fx?: SkillFx, actorId?: string) => {
    const ev = s.events;
    const damaged = new Set(ev.filter((x) => x.kind === 'damage').map((x) => (x as { target: string }).target));
    const vfxBusy = (id: string) => damaged.has(id);
    s.events = [];
    if (!ev.length) return;
    const hit = new Set<string>();
    const heavy = new Set<string>();
    const soundOnce = new Set<string>();
    let pause = false;
    for (const e of ev) {
      switch (e.kind) {
        case 'damage': {
          const f = fx && e.source === actorId ? fx : fxFor(e.source);
          addVfx(e.target, `impact w-${f.weapon} e-${f.element}${e.crit ? ' crit' : ''}`, f.color);
          { const t = s.units.find((u) => u.id === e.target); knock(e.target, e.source, f.color, e.crit || (!!t && e.amount > t.base.hp * 0.25)); }
          { const t = s.units.find((u) => u.id === e.target); const big = !!t && e.amount > t.base.hp * 0.25; if (e.crit || big) doShake(e.crit && big ? 'hard' : 'soft'); }
          if (!soundOnce.has('hit:' + e.source)) { soundOnce.add('hit:' + e.source); playImpact(f, { crit: ev.some((x) => x.kind === 'damage' && x.source === e.source && x.crit), many: ev.filter((x) => x.kind === 'damage' && x.source === e.source).length > 1 }); }
          if (f.weapon === 'blunt' || e.crit) { heavy.add(e.target); flashLight(center(e.target), f.color, 0.5, 420); }
          hit.add(e.target); if (e.combo) addPopup(e.target, 'Combo !', 'buff'); addPopup(e.target, `${e.crit ? 'CRIT ' : ''}-${e.amount}${e.strong ? ' ▲' : e.weak ? ' ▼' : ''}`, `dmg ${e.crit ? 'crit' : ''} ${e.strong ? 'strong' : ''} ${e.weak ? 'weak' : ''}`); pause = true; break;
        }
        case 'dot': hit.add(e.target); addPopup(e.target, `-${e.amount}`, e.status === 'poison' ? 'poison' : 'burn'); addVfx(e.target, `impact w-none e-${e.status === 'poison' ? 'poison' : 'fire'} small`, e.status === 'poison' ? '#8be04e' : '#ff8a3a'); if (!soundOnce.has('dot' + e.status)) { soundOnce.add('dot' + e.status); playDot(e.status); } pause = true; break;
        case 'heal': if (e.amount > 0) { addPopup(e.target, `+${e.amount}`, 'heal'); { const p = center(e.target); if (p) stage.current?.motes(p, '#7bea8f', 16, 26, 0.06); } addVfx(e.target, 'healfx', '#7bea8f'); if (!soundOnce.has('heal')) { soundOnce.add('heal'); playHeal(); } } pause = true; break;
        case 'shield': addPopup(e.target, `+${e.amount}`, 'shieldp'); { const p = center(e.target); if (p) stage.current?.motes(p, '#aad7ff', 10, 26, 0.04); } addVfx(e.target, 'shieldfx', '#aad7ff'); if (!soundOnce.has('shield')) { soundOnce.add('shield'); playShield(); } break;
        // Effets : seuls les malus importants s'affichent en texte ; les bonus n'ont qu'un halo (les pastilles suffisent).
        case 'status': if (['stun', 'freeze', 'taunt'].includes(e.status)) addPopup(e.target, STATUS_INFO[e.status].name, 'debuff'); if (!vfxBusy(e.target)) addVfx(e.target, STATUS_INFO[e.status].debuff ? 'cursefx' : 'bufffx', STATUS_INFO[e.status].color); if (!soundOnce.has('st:' + e.status)) { soundOnce.add('st:' + e.status); playStatus(e.status, STATUS_INFO[e.status].debuff); } break;
        case 'resist': if (e.immune) addPopup(e.target, 'Immunisé', 'resist'); break;
        case 'skip': addPopup(e.target, STATUS_INFO[e.status].name, 'debuff'); pause = true; break;
        case 'death': {
          addPopup(e.target, 'K.O.', 'death'); playDeath(); pause = true;
          const dead = s.units.find((u) => u.id === e.target);
          // Dissolution : la carte blanchit puis s'éteint en poussière (violette pour les ennemis).
          if (motionOn()) {
            const p = center(e.target);
            if (p && stage.current) { stage.current.motes(p, dead?.side === 'enemy' ? '#b48cff' : '#cfc3a8', 40, 30, 0.08); stage.current.motes(p, '#ffffff', 8, 24, 0.05); }
            battleRef.current?.querySelector<HTMLElement>(`[data-uid="${e.target}"] .u-art`)?.animate([
              { filter: 'brightness(1)', transform: 'translateY(0px)', opacity: 1 },
              { filter: 'brightness(2.2) grayscale(0.6)', transform: 'translateY(-4px)', opacity: 1, offset: 0.2 },
              { filter: 'brightness(0.5) grayscale(1) blur(2px)', transform: 'translateY(-12px) scale(0.97)', opacity: 0.5 },
            ], { duration: 900 / speedRef.current, easing: 'ease-in' });
          }
          // Coup fatal : le dernier ennemi de la dernière vague tombe (surtout un boss) : ralenti et tremblement.
          if (dead && dead.side === 'enemy' && s.outcome === 'won' && !s.pendingWaves.length && !s.units.some((u) => u.side === 'enemy' && u.alive)) {
            doShake('hard');
            if (!save.settings.reducedMotion) { setSlowmo(true); setBanner({ text: dead.isBoss ? 'Coup fatal !' : 'Victoire !', side: 'ally' }); await wait(900); setSlowmo(false); }
          }
          break;
        }
        case 'revive': addVfx(e.target, 'revivefx', '#ffd36b'); { const p = center(e.target); if (p) stage.current?.motes(p, '#ffd36b', 30, 30, 0.07); } addPopup(e.target, 'Ressuscité !', 'heal'); playRevive(); pause = true; break;
        case 'undying': addPopup(e.target, 'Ce qui ne meurt pas', 'buff'); break;
        case 'extraTurn': addPopup(e.target, 'Tour bonus !', 'buff'); break;
        case 'cleanse': break;
        case 'dispel': addPopup(e.target, 'Bonus retirés', 'debuff'); addVfx(e.target, 'cursefx', '#c7b6ff'); break;
        case 'rage': addPopup(e.target, 'Enragé ! +30 % ATQ', 'debuff'); pause = true; break;
        case 'couture': {
          const def = COUTURE_BY_ID[e.id];
          setBanner({ text: `Couture d’époque · ${def?.name ?? ''}`, side: 'ally' });
          for (const t of s.units.filter((x) => x.side === 'enemy' && x.alive)) addVfx(t.id, 'cursefx', '#cf9dff');
          for (const id of [e.a, e.b]) { const c = center(id); if (c) stage.current?.burst(c, '#cf9dff', 30, 0.45); }
          doShake('hard'); play('rare'); pause = true;
          if (!useGame.getState().save?.flags[`couture_${e.id}`]) { mutate((d) => { d.flags[`couture_${e.id}`] = true; }); useUI.getState().toast(`Nouvelle couture découverte : ${def?.name} (Codex)`, 'ok'); }
          break;
        }
        case 'phase': {
          const bu = s.units.find((x) => x.id === e.target);
          if (e.act === 3 && e.power) {
            const pw = ACT3[e.power];
            setBanner({ text: `Dernier acte · ${pw.name} : ${bu?.name ?? 'le boss'} ${pw.text}`, side: 'enemy' }); setAct(3);
            flashLight(center(e.target), pw.color, 1, 1400); { const c = center(e.target); if (c) { stage.current?.burst(c, pw.color, 50, 0.55); stage.current?.ring(c, pw.color, 160, 900); } }
            addVfx(e.target, 'cursefx', pw.color); doShake('hard'); play('rare'); pause = true; break;
          }
          setBanner({ text: `Acte II · ${bu?.name ?? 'Le boss'} se déchaîne`, side: 'enemy' }); setAct(2); flashLight(center(e.target), '#ff3d6e', 1, 1200); addVfx(e.target, 'cursefx', '#ff3d6e'); doShake('hard'); play('rare'); pause = true; break; }
        case 'fracture': addPopup(e.target, 'Fracture ! Étourdi, +40 % de dégâts subis', 'buff'); flashLight(center(e.target), '#ffffff', 0.9, 800); addVfx(e.target, 'cursefx', '#ffffff'); doShake('hard'); { const c = center(e.target); if (c) stage.current?.burst(c, '#ffffff', 40, 0.5); } play('rare'); pause = true; break;
        case 'carapace':
          if (e.broken) { addPopup(e.target, 'Carapace brisée !', 'buff'); addVfx(e.target, 'cursefx', '#ffd36b'); pause = true; }
          else if (e.reformed) { addPopup(e.target, 'Carapace reformée', 'shieldp'); addVfx(e.target, 'shieldfx', '#c9b27a'); }
          break;
        case 'lien': {
          setBanner({ text: `Pouvoir du Lien · ${LIEN_POWERS[e.power].name}`, side: 'ally' });
          for (const a of s.units.filter((u) => u.side === 'ally' && u.alive)) addVfx(a.id, e.power === 'heal' ? 'healfx' : e.power === 'guard' ? 'shieldfx' : 'revivefx', e.power === 'heal' ? '#7bea8f' : e.power === 'guard' ? '#aad7ff' : '#ffd36b');
          play('claim'); pause = true; break;
        }
        case 'wave': {
          // Passage à la vague suivante : un vrai temps de séparation, et les nouveaux ennemis entrent en scène.
          const isBoss = bossWave >= 0 && e.wave - 1 === bossWave;
          if (bossWave >= 0 && e.wave - 1 >= bossWave && useGame.getState().save?.settings.music) playMusic('boss', initial.info.region);
          setBanner(null); setWaveCard({ n: e.wave, total: s.totalWaves, boss: isBoss }); play('open'); force();
          await wait(1700 / Math.min(2, speedRef.current));
          setWaveCard(null); force();
          if (isBoss) { const boss = s.units.find((u) => u.side === 'enemy' && u.isBoss && u.alive); if (boss) { introDone.current = true; await showBoss(boss); } }
          break;
        }
      }
    }
    if (hit.size) { setHits(hit); setHeavyHits(heavy); }
    force();
    // Hit-stop (v1.95.0) : sur un coup lourd, la scène se fige un instant, comme dans les jeux d'action.
    if (heavy.size && !useGame.getState().save?.settings.reducedMotion) { const el = battleRef.current; el?.classList.add('hitstop'); await sleep(speedRef.current >= 3 ? 40 : 75); el?.classList.remove('hitstop'); }
    if (pause) await wait(620 / speedRef.current);
    setHits(new Set());
    setHeavyHits(new Set());
  };

  const doAction = async (a: Action) => {
    const actor = unitById(s, s.activeId!);
    const sk = actor.skills.find((x) => x.id === a.skillId)!;
    const fx = skillFx(sk, actor.affinity);
    setBanner({ text: sk.name, side: actor.side });
    setActing(actor.id);
    const reduced = useGame.getState().save?.settings.reducedMotion;
    if (sk.slot === 'ultimate' && !reduced) { setUlt({ side: actor.side, kind: actor.kind, refId: actor.refId, skill: sk.name, color: fx.color }); play('rare'); }
    force();
    await wait((sk.slot === 'ultimate' && !reduced ? 850 : 300) / speedRef.current);
    setUlt(null);
    // Lancement : son + trajet jusqu'aux cibles (projectile, pluie, vague, rayon de soutien).
    playCast(fx);
    let travel = fx.motion === 'melee' ? 120 : 0;
    let comeBack: (() => Promise<void>) | null = null;
    if (!reduced) {
      const from = posOf(actor.id);
      const targets = previewTargets(s, actor, sk, a.targetId);
      const spd = speedRef.current;
      // Caméra : vers le milieu entre le lanceur et sa (première) cible ; plus près pour une ultime.
      const aim = targets.find((t) => t.id !== actor.id);
      const aimP = aim ? posOf(aim.id) : null;
      if (from) camTo(aimP ? { x: (from.x + aimP.x) / 2, y: (from.y + aimP.y) / 2 } : from, sk.slot === 'ultimate' ? 1.12 : 1.06);
      flashLight(from, fx.color, sk.slot === 'ultimate' ? 0.85 : sk.slot === 'basic' ? 0.35 : 0.55, sk.slot === 'ultimate' ? 900 : 560);
      if (fx.motion === 'melee' && from && aim && aim.side !== actor.side && aimP) { comeBack = await lungeTo(actor, from, aimP); travel = 0; }
      if (fx.motion === 'projectile' && from) {
        for (const t of targets) { const to = posOf(t.id); if (to) spawn({ kind: 'proj', fx, x0: from.x, y0: from.y, x1: to.x, y1: to.y, dur: 320 / spd }); }
        travel = 320;
      } else if (fx.motion === 'rain') {
        for (const t of targets) { const to = posOf(t.id); if (to) spawn({ kind: 'rain', fx, x0: to.x, y0: to.y - 140, x1: to.x, y1: to.y, dur: 420 / spd }); }
        travel = 380;
      } else if (fx.motion === 'aoe') {
        setWave({ side: actor.side === 'ally' ? 'enemy' : 'ally', color: fx.color, id: ++popSeq });
        for (const t of targets) { const to = posOf(t.id); if (to) spawn({ kind: 'burst', fx, x0: to.x, y0: to.y, x1: to.x, y1: to.y, dur: 380 / spd }); }
        travel = 300;
      } else if (fx.motion === 'support') {
        for (const t of targets) { const to = posOf(t.id); if (to) spawn({ kind: 'beam', fx, x0: to.x, y0: to.y, x1: to.x, y1: to.y, w: to.w, dur: 520 / spd }); }
        travel = 260;
      } else if (fx.motion === 'self' && from) {
        spawn({ kind: 'aura', fx, x0: from.x, y0: from.y, x1: from.x, y1: from.y, w: from.w, dur: 600 / spd });
        travel = 280;
      }
    }
    await wait(travel / speedRef.current);
    performAction(s, a);
    const shown = playEvents(fx, actor.id);
    if (comeBack) { await wait(170 / speedRef.current); await comeBack(); }
    await shown;
    camTo(null, 1, 520);
    setActing(null);
    setBanner(null);
  };

  // Écran de victoire (v1.89.0) : chaque étoile gagnée sonne en se posant, de plus en plus haut.
  useEffect(() => {
    if (phase !== 'result' || !result?.won || !(spec.mode === 'campaign' || spec.mode === 'faction')) return;
    const ids = Array.from({ length: result.stars }, (_, i) => window.setTimeout(() => playFlip(3 + i), (0.45 + (i + 1) * 0.2) * 1000));
    return () => ids.forEach(clearTimeout);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const won = s.outcome === 'won';
    const dead = s.units.filter((u) => u.side === 'ally' && !u.alive).length;
    const boss = s.units.find((u) => u.side === 'enemy' && u.isBoss);
    // Arène réelle : le combat s'inscrit dans le journal du défenseur (il verra qui l'a attaqué).
    const foe = spec.mode === 'arena' ? useGame.getState().save?.arena.opponents.find((x) => x.id === spec.opponentId) : undefined;
    // Boss de clan : les dégâts partent tout de suite au clan (sinon ils attendent dans la sauvegarde).
    if (spec.mode === 'guildboss') { const gid = useGame.getState().save?.guild.id; if (gid) setTimeout(() => { void import('../../cloud/guildCloud').then((a) => a.syncMe(gid)).catch(() => {}); }, 300); }
    if (foe?.real && foe.uid) { const me = useGame.getState().save!; void loadCloud().then((c) => c.postArenaLog(foe.uid!, me, won, playerTeamPower(me))).catch(() => {}); }
    let res: ModeResult | null = null;
    mutate((d) => {
      res = applyMode(d, spec, { won, alliesDead: dead, participants: initial.allies.map((a) => a.heroUid).filter((u): u is string => !!u), allyHp: Object.fromEntries(s.units.filter((u) => u.side === 'ally' && u.heroUid).map((u) => [u.heroUid!, u.alive ? Math.max(0, u.hp) / u.base.hp : 0])), bossDamage: boss ? { dealt: boss.base.hp - Math.max(0, boss.hp), max: boss.base.hp } : undefined }, Date.now());
    });
    setResult(res);
    trackStat({ kind: 'battle', mode: spec.mode, won, stage: spec.mode === 'campaign' && spec.difficulty === 'normal' ? spec.stageId : undefined, floor: spec.mode === 'tower' && !spec.challenge ? spec.floor : undefined });
    const ok = (res as ModeResult | null)?.won;
    play(ok ? 'claim' : 'error');
    setPhase(ok && initial.info.after?.length ? 'outro' : 'result');
  }, [s, mutate, spec, initial]);

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
        // Combat auto : le Lien agit de lui-même quand sa jauge est pleine.
        if (actor.side === 'ally' && autoRef.current) {
          const lp = autoLien(s);
          if (lp) { castLien(s, lp); await playEvents(); setBanner(null); if (s.outcome !== 'running' || !s.activeId) continue; }
        }
        if (actor.side === 'ally' && !autoRef.current) {
          const first = availableSkills(actor)[0];
          setSelected(first ? first.id : null);
          setAwaiting(true);
          force();
          return;
        }
        await doAction(chooseAction(s, actor, actor.side === 'ally' ? focusRef.current : null));
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

  const onUnit = (u: Unit) => {
    if (targetable.has(u.id)) { void act(u.id); return; }
    // Hors ciblage manuel : toucher un ennemi en fait la cible prioritaire (re-toucher l'annule).
    if (u.side !== 'enemy' || !u.alive || s.outcome !== 'running') return;
    play('tap');
    if (focusId === u.id) { setFocusId(null); toast('Cible prioritaire annulée.'); return; }
    setFocusId(u.id);
    toast(`Cible prioritaire : ${u.name}. ${auto ? 'L’équipe la vise dès qu’elle peut.' : 'En AUTO, l’équipe la visera.'}`);
  };
  // Pouvoir du Lien (le joueur agit lui-même) : ne consomme pas le tour du héros.
  const [lienOpen, setLienOpen] = useState(false);
  const castPower = async (p: LienPower) => {
    setLienOpen(false);
    if (!awaiting || !castLien(s, p)) return;
    setAwaiting(false);
    await playEvents(); setBanner(null);
    if (s.outcome !== 'running' || !s.activeId) { void run(); return; }
    setAwaiting(true); force();
  };
  const lienFull = awaiting && lienReady(s);
  useEffect(() => {
    if (!lienFull) return;
    try { if (!localStorage.getItem('aeonfall.tip.lien')) { localStorage.setItem('aeonfall.tip.lien', '1'); useUI.getState().toast('Ta jauge du Lien est pleine : touche-la pour aider toute l’équipe (sans perdre ton tour).'); } } catch { /* */ }
  }, [lienFull]);

  const toggleAuto = () => { const v = !auto; setAuto(v); updateSettings({ autoBattleDefault: v }); play('tap'); if (v && !save.flags.coach_battle_auto) mutate((s) => { s.flags.coach_battle_auto = true; }); };
  const cycleSpeed = () => { const v = (speed === 3 ? 1 : speed + 1) as 1 | 2 | 3; setSpeed(v); updateSettings({ battleSpeed: v }); play('tap'); };

  const doQuit = () => { setQuit(false); s.outcome = 'lost'; s.activeId = null; alive.current = false; finish(); };

  const retry = () => {
    let r: { ok: boolean; reason?: string } = { ok: false };
    mutate((d) => { r = payMode(d, spec, useGame.getState().now); });
    if (!r.ok) { toast(r.reason ?? 'Impossible.', 'error'); return; }
    replace({ name: 'battle', spec, teamId, seed: Date.now() }); // le renfort d'un ami ne vaut que pour un combat
  };
  const next = result?.won ? nextSpec(useGame.getState().save!, spec) : null;
  const backTo = (): Route['name'] => ({ campaign: 'campaign', dungeon: 'dungeons', tower: 'tower', worldboss: 'worldboss', arena: 'arena', guildboss: 'guild', challenge: 'events', faction: 'factionDungeon', rift: 'rifts' } as const)[spec.mode];
  const cost = initial.info.cost;

  const order = s.outcome === 'running' ? predictOrder(s, 7) : [];
  const side = (sd: 'ally' | 'enemy') => s.units.filter((u) => u.side === sd);

  const renderUnit = (u: Unit, place?: Place, i = 0) => (
    <UnitView key={u.id} u={u} place={place} order={i} vfx={vfx[u.id]} focus={focusId === u.id && u.alive} active={s.activeId === u.id} acting={acting === u.id} hit={hits.has(u.id)} heavy={heavyHits.has(u.id)}
      targetable={targetable.has(u.id)} popups={popups[u.id] ?? []} onClick={() => onUnit(u)} onInfo={() => setInfoId(u.id)}
      edge={awaiting && active && targetable.has(u.id) && u.side !== active.side ? affinityEdge(active.affinity, u.affinity) : undefined} />
  );

  return (
    <div ref={battleRef} className={`battle ${shake ? `shake ${shake}` : ''} ${slowmo ? 'slowmo' : ''}`}>
      <BattleScene region={initial.info.region} act={bossAct} />
      <div className="battle-top">
        <div className="row between">
          <div>
            <div className="battle-stage">{initial.info.title}</div>
            {s.totalWaves > 1 ? (
              <div className="wave-steps" aria-label={`Vague ${s.wave} sur ${s.totalWaves}`}>
                {Array.from({ length: s.totalWaves }, (_, i) => (
                  <span key={i} className={`ws ${i + 1 < s.wave ? 'done' : i + 1 === s.wave ? 'now' : ''} ${i === bossWave ? 'boss' : ''}`}>
                    {i + 1 < s.wave ? '✓ ' : ''}{i === bossWave ? 'Boss' : `Vague ${i + 1}`}
                  </span>
                ))}
              </div>
            ) : <div className="faint">Vague unique</div>}
            {s.turnLimit ? <div className="faint">Actions {Math.min(s.actionCount, s.turnLimit)}/{s.turnLimit}</div> : null}
          </div>
          <div className="row" style={{ gap: 6 }}>
            <button className="fx-legend-btn" aria-label="Légende des effets" onClick={() => { play('tap'); setLegend(true); }}><StatusIcon id="atkUp" size={14} /><StatusIcon id="poison" size={14} /><span>Effets</span></button>
            {phase === 'fight' && <button className="pause-btn" aria-label="Pause" onClick={() => { play('tap'); setQuit(true); }}><Icon.pause size={20} /></button>}
          </div>
        </div>
        <div className="turn-order">
          {order.map((id, i) => {
            const u = s.units.find((x) => x.id === id);
            if (!u) return null;
            return <div key={i} className={`to-item ${u.side}`}>{u.kind === 'hero' ? <HeroArt heroId={u.refId} /> : <EnemyArt enemyId={u.refId} />}</div>;
          })}
        </div>
      </div>

      {(() => {
        // Scène 2,5D (v1.82.0) : chaque unité a sa place au sol, en profondeur — héros devant en arc,
        // ennemis au loin (plus petits), boss plus grand ; plus la carte est proche, plus elle passe devant.
        const allies = side('ally').slice().sort((a, b) => a.slot - b.slot);
        const foes = side('enemy').slice().sort((a, b) => a.slot - b.slot);
        const placed = new Map<string, Place>();
        allies.forEach((u, i) => placed.set(u.id, stagePlace('ally', allies.length, i, false)));
        foes.forEach((u, i) => placed.set(u.id, stagePlace('enemy', foes.length, i, u.isBoss)));
        const act = s.activeId ? placed.get(s.activeId) : undefined;
        const actU = s.activeId ? s.units.find((u) => u.id === s.activeId) : undefined;
        return (
          <div className="cam25" ref={camRef}>
            <div className="stage25">
              <div className="rune25 foe" aria-hidden />
              <div className="rune25 ally" aria-hidden />
              {act && actU?.alive && phase === 'fight' && <div className={`turn-ring25 ${actU.side}`} style={{ left: `${act.x}%`, top: `${act.y}%`, ['--s' as string]: act.s }} aria-hidden />}
              <div key={`wave-${s.wave}`} className="stage-foes wave-in">
                {foes.map((u, i) => renderUnit(u, placed.get(u.id)!, i))}
              </div>
              {allies.map((u, i) => renderUnit(u, placed.get(u.id)!, i))}
            </div>
          </div>
        );
      })()}

      {ult && <div className={`ult-overlay ${ult.side}`} />}
      {/* Coupe cinématique de l'ultime (v1.89.0) : bande diagonale, illustration en parallaxe, nom de la compétence. Pas en ×3. */}
      {ult && speed < 3 && (
        <div className={`ult-cut ${ult.side}`} style={{ ['--uc' as string]: ult.color }} aria-hidden>
          <div className="uc-band"><div className="uc-art">{ult.kind === 'hero' ? <HeroArt heroId={ult.refId} kind="full" /> : <EnemyArt enemyId={ult.refId} />}</div></div>
          <div className="uc-name">{ult.skill}</div>
        </div>
      )}
      {wave && <div key={wave.id} className={`field-wave ${wave.side}`} style={{ ['--vc' as string]: wave.color }} onAnimationEnd={() => setWave(null)} />}
      {banner && !(ult && speed < 3) && <div className={`skill-banner ${banner.side} ${ult ? 'ult' : ''}`} key={banner.text + banner.side}>{banner.text}</div>}

      {waveCard && (
        <div className={`wave-card ${waveCard.boss ? 'boss' : ''}`} key={waveCard.n}>
          <div className="wc-done">✓ Vague {waveCard.n - 1} terminée</div>
          <div className="wc-title">{waveCard.boss ? 'Le boss arrive' : `Vague ${waveCard.n}`}</div>
          <div className="wc-sub">{waveCard.boss ? `Vague ${waveCard.n} / ${waveCard.total}` : `${waveCard.n} / ${waveCard.total} · nouveaux ennemis`}</div>
        </div>
      )}
      <FxLayer items={fxItems} />
      <canvas ref={stageCanvas} className="stage25-fx" aria-hidden />
      {/* Tutoriel du combat : une seule bulle au premier combat ; AUTO au combat suivant (les affinités sont expliquées à la préparation). Bulles en haut : l'équipe reste visible. */}
      <Coach id="battle_skill" place="top" target=".battle-controls .skills" when={awaiting && !auto && phase === 'fight'} text="C’est ton tour : choisis une compétence en bas, puis touche un ennemi." />
      <Coach id="battle_auto" place="top" target=".ctrl-col" when={secondFight && awaiting && !auto && phase === 'fight'} text="AUTO fait jouer l’équipe toute seule (touche un ennemi pour qu’elle le vise en priorité) ; ×1 / ×2 / ×3 accélère le combat." />

      <div className="battle-controls">
        {/* Hauteur de l'aide = plus longue description de l'équipe (mesurée une fois) : texte complet, sans saut d'écran. */}
        <div className="skill-measure" ref={measureRef} aria-hidden>
          {initial.battle.units.filter((u) => u.side === 'ally').flatMap((u) => u.skills.filter((x) => x.slot !== 'passive').map((sk) => (
            <div key={u.id + sk.id} className="skill-info"><SkillInfoBody unit={u} sk={sk} /></div>
          )))}
        </div>
        {lienOpen && lienFull && (
          <div className="lien-choices" role="dialog" aria-label="Pouvoir du Lien">
            {(Object.keys(LIEN_POWERS) as LienPower[]).map((p) => (
              <button key={p} className={`lien-choice ${p}`} onClick={() => void castPower(p)}>
                <b>{LIEN_POWERS[p].name}</b><span>{LIEN_POWERS[p].text}</span>
              </button>
            ))}
          </div>
        )}
        {/* En AUTO, ce bloc disparaît (plus de place pour le combat) ; il revient avec les compétences quand on reprend la main. */}
        {!auto && <div className={`skill-info ${awaiting && active && selSkill ? '' : 'idle'}`} style={{ height: infoH }}>
          {awaiting && active && selSkill ? <SkillInfoBody unit={active} sk={selSkill} onLaunch={targetKind(selSkill) === 'none' ? () => act() : undefined} />
            : <span>{finished.current ? '' : awaiting ? 'Choisis une compétence.' : 'Tour adverse…'}</span>}
        </div>}
        <div className="ctrl-row">
          <div className="ctrl-col">
            <button className={`ctrl ${auto ? 'on' : ''}`} onClick={toggleAuto}>AUTO</button>
            <button className="ctrl" onClick={cycleSpeed} aria-label={`Vitesse ×${speed}`}>×{speed}</button>
          </div>
          {s.lien >= 0 && (
            <button className={`lien-btn ${lienFull ? 'full' : ''}`} onClick={() => { play('tap'); if (lienFull) setLienOpen((v) => !v); else toast(s.lienUsed >= LIEN_USES ? 'Pouvoir du Lien : déjà utilisé 2 fois dans ce combat.' : 'Pouvoir du Lien : la jauge monte à chaque action de tes héros (+5 %) et à chaque ennemi vaincu (+5 %). À 100 %, touche-la pour choisir un pouvoir (soin, frappe ou rempart), 2 fois par combat.'); }}
              aria-label={`Pouvoir du Lien : ${Math.round((s.lien / LIEN_MAX) * 100)} %`} style={{ ['--lp' as string]: `${(s.lien / LIEN_MAX) * 360}deg` }}>
              <span className="lien-core">{s.lienUsed >= LIEN_USES ? '—' : lienFull ? 'LIEN' : <><small>Lien</small>{Math.round((s.lien / LIEN_MAX) * 100)}%</>}</span>
              <span className="lien-uses">{LIEN_USES - s.lienUsed}/{LIEN_USES}</span>
            </button>
          )}
          <div className="skills">
            {(awaiting && active ? active.skills.filter((x) => x.slot !== 'passive') : []).map((sk) => {
              const cd = active!.cooldowns[sk.id] ?? 0;
              return (
                <button key={sk.id} className={`skill-card ${sk.slot} ${selected === sk.id ? 'sel' : ''}`} disabled={cd > 0}
                  onClick={() => { play('tap'); if (selected === sk.id && targetKind(sk) === 'none') void act(); else setSelected(sk.id); }}>
                  <span className={`sk-tag ${cd > 0 ? 'cd' : ''}`}>{cd > 0 ? `Recharge ${cd} t.` : SLOT_TAG[sk.slot]}</span>
                  <span className="sk-name">{sk.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {phase === 'intro' && <Dialogue lines={initial.info.before!} onDone={() => setPhase('fight')} />}
      {phase === 'outro' && <Dialogue lines={initial.info.after!} onDone={() => setPhase('result')} />}

      {bossIntro && (
        <div className="boss-intro" aria-live="polite">
          <div className="bi-bar top" /><div className="bi-bar bottom" />
          <div className="bi-card">
            <div className="bi-kicker">Gardien</div>
            <div className="bi-name">{bossIntro.name}</div>
            <div className="bi-sub"><AffinityIcon id={bossIntro.affinity} size={15} /> {AFFINITIES[bossIntro.affinity].name}
              {(() => { const w = (Object.keys(AFFINITIES) as (keyof typeof AFFINITIES)[]).find((a) => AFFINITIES[a].strongAgainst === bossIntro.affinity); return w ? <> · faible face au <b style={{ color: AFFINITIES[w].color }}>{AFFINITIES[w].name}</b></> : null; })()}
            </div>
          </div>
        </div>
      )}
      {phase === 'result' && result && (
        <div className={`result-overlay ${result.won ? 'won' : 'lost'} ${skipFx ? 'skip' : ''}`} onClick={() => setSkipFx(true)}>
          <div className={`result-title ${result.won ? 'win' : 'lose'}`}>{spec.mode === 'worldboss' || spec.mode === 'guildboss' ? 'COMBAT TERMINÉ' : result.won ? 'VICTOIRE' : 'DÉFAITE'}</div>
          {result.lines.map((l, i) => <div key={i} className="chip active" style={{ margin: '6px auto', display: 'flex', width: 'fit-content', textAlign: 'center' }}>{l}</div>)}
          {result.won && (spec.mode === 'campaign' || spec.mode === 'faction') && (
            <div className="result-stars">
              {[1, 2, 3].map((n) => <span key={n} className={n <= result.stars ? 'on' : 'off'} style={{ animationDelay: `${0.3 + n * 0.2}s` }}><Icon.star size={46} color={n <= result.stars ? '#ffd36b' : '#3a3442'} /></span>)}
            </div>
          )}
          {result.won && (spec.mode === 'campaign' || spec.mode === 'faction') && result.stars < 3 && (
            <p className="faint result-why">{result.stars === 2 ? '1 héros KO : 2 étoiles. Aucun héros KO pour la 3ᵉ.' : 'Plusieurs héros KO : 1 étoile. Garde ton équipe en vie pour en gagner plus.'}</p>
          )}
          <div className="result-body">
            {result.won ? (
              <>
                {result.firstClear && <div className="chip active" style={{ margin: '0 auto 10px', display: 'flex', width: 'fit-content' }}>Première victoire</div>}
                {result.newHeroes.map((id) => (
                  <div key={id} className="new-hero">
                    <div style={{ width: 110 }}><HeroCard heroId={id} level={1} /></div>
                    <div><div className="faint">NOUVEL HÉRITIER</div><b style={{ fontSize: 17 }}>{HERO_BY_ID[id].name}</b><div className="muted">rejoint ta collection ! Ajoute-le à une équipe dans l’écran Équipe.</div></div>
                  </div>
                ))}
                <RewardView reward={{ ...result.reward, ...Object.fromEntries(Object.entries(result.loot).map(([k, v]) => [k, (result.reward[k as keyof typeof result.reward] ?? 0) + (v ?? 0)])) }} gear={result.gear} compact />
                <DamageRecap units={s.units} xp={result.heroXp} />
              </>
            ) : (
              <div className="hint">
                {spec.mode === 'arena' ? 'Choisis un adversaire plus accessible, ou renforce tes héros (niveau, équipement, rang).'
                  : spec.mode === 'worldboss' ? 'Aucun palier de dégâts atteint : renforce tes héros.'
                  : 'Pour l’emporter la prochaine fois :'}
                {spec.mode !== 'arena' && spec.mode !== 'worldboss' && (
                  <div className="defeat-tips">
                    {defeatTips(useGame.getState().save!, initial.team, initial.info.waves).map((t, i) => (
                      <div key={i} className="dt-row"><span>{t.text}</span><button className="btn small secondary" onClick={(e) => { e.stopPropagation(); replace(t.route); }}>{t.label}</button></div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!result.won && <DamageRecap units={s.units} />}
            {result.accountXp ? <AccountXp big level={useGame.getState().save!.profile.level} xp={useGame.getState().save!.profile.xp} gain={result.accountXp} /> : null}
            {result.accountLevelsGained > 0 && <div className="chip active" style={{ margin: '10px auto 0', display: 'flex', width: 'fit-content' }}>Niveau de compte {useGame.getState().save!.profile.level} ! +2 000 or, énergie rechargée ({energyMax(useGame.getState().save!.profile.level)} max)</div>}
          </div>
          <div className="result-actions">
            <button className="btn secondary grow" onClick={() => popTo(backTo())}>Retour</button>
            {spec.mode !== 'tower' && spec.mode !== 'challenge' && spec.mode !== 'rift' && (
              <button className="btn secondary grow" onClick={retry}>{result.won ? 'Rejouer' : 'Réessayer'} {cost.kind === 'energy' && <><Icon.energy size={16} />{cost.amount}</>}{cost.kind === 'key' && ' (1 clé)'}{cost.kind === 'ticket' && ' (1 ticket)'}{cost.kind === 'try' && ' (1 essai)'}</button>
            )}
            {(spec.mode === 'tower' || spec.mode === 'faction' || (spec.mode === 'challenge' && spec.trial != null)) && !result.won && <button className="btn secondary grow" onClick={retry}>Réessayer</button>}
            {next && <button className="btn grow" onClick={() => replace({ name: 'prep', spec: next })}>Suivant</button>}
          </div>
        </div>
      )}

      {infoId && (() => { const u = s.units.find((x) => x.id === infoId); return u ? <UnitInfo u={u} mechanics={s.mechanics} onClose={() => setInfoId(null)} /> : null; })()}
      {legend && <EffectsLegend onClose={() => setLegend(false)} />}
      {quit && (
        <Modal onClose={() => setQuit(false)}>
          <h2>Pause</h2>
          <button className="btn block" onClick={() => setQuit(false)}>Reprendre</button>
          <p className="faint" style={{ textAlign: 'center', margin: '14px 0 6px' }}>Abandonner = défaite, énergie non rendue.</p>
          <button className="btn danger block" onClick={doQuit}>Abandonner</button>
        </Modal>
      )}
    </div>
  );
}
