import { Coach } from '../components/Coach';
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import type { SkillDef } from '../../data/types';
import { useGame } from '../../state/store';
import { useUI, type Route } from '../../state/ui';
import { HERO_BY_ID } from '../../data/heroes';
import { HERO_LINES } from '../../data/heroLines';
import { createBattle, beginTurn, performAction, unitById, availableSkills, targetKind, validTargets, hpPct, shieldOf, predictOrder, autoLien, castLien, lienReady, LIEN_POWERS } from '../../game/battle/engine';
import { LIEN_MAX, LIEN_USES, type LienPower } from '../../game/battle/types';
import { groupStatuses, statusDescription, statusValueText } from '../../game/battle/statusText';
import { chooseAction } from '../../game/battle/ai';
import { STATUS_INFO, type Action, type BattleState, type Unit, type UnitSetup } from '../../game/battle/types';
import { effectiveCooldown } from '../../game/battle/skillMods';
import { teamSetups } from '../../game/campaign';
import { applyMode, nextSpec, payMode, resolveMode, type BattleSpec, type ModeResult } from '../../game/modes';
import { heroXpToNext } from '../../game/progression';
import { play } from '../../audio/sfx';
import { playMusic } from '../../audio/music';
import { loadCloud } from '../../cloud/account';
import { playerTeamPower } from '../../game/arena';
import { ENEMIES } from '../../data/enemies';
import { playCast, playDeath, playDot, playHeal, playImpact, playRevive, playShield, playStatus } from '../../audio/battleSfx';
import { skillFx, type SkillFx } from '../fx/skillFx';
import { AffinityIcon, affinityEdge } from '../art/Identity';
import { AFFINITIES } from '../../data/affinities';
import { HeroArt } from '../art/HeroArt';
import { EnemyArt } from '../art/EnemyArt';
import { Icon } from '../art/Icons';
import { BattleBackdrop } from '../art/BattleBackdrop';
import { Dialogue } from '../components/Dialogue';
import { Modal } from '../components/common';
import { RewardView } from '../components/RewardView';
import { HeroCard } from '../components/HeroCard';
import { GearCard } from '../components/GearCard';

type Phase = 'intro' | 'fight' | 'outro' | 'result';
interface Popup { id: number; text: string; cls: string }
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let popSeq = 0;

export function Battle({ spec, teamId, seed, guest }: { spec: BattleSpec; teamId: string; seed: number; guest?: UnitSetup }) {
  const save = useGame((s) => s.save)!;
  const secondFight = Object.values(save.progress.campaign).some((p) => p.clears > 0);
  const mutate = useGame((s) => s.mutate);
  const updateSettings = useGame((s) => s.updateSettings);
  const { popTo, replace, toast } = useUI.getState();

  const [initial] = useState(() => {
    const team = save.teams.find((t) => t.id === teamId) ?? save.teams[0];
    // Renfort d'un ami : son héros prend la première place libre de l'équipe.
    const own = teamSetups(save, team);
    const free = [0, 1, 2, 3, 4].find((i) => !own.some((a) => a.slot === i));
    const allies = guest && free != null ? [...own, { ...guest, slot: free }] : own;
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
  const [acting, setActing] = useState<string | null>(null);
  const [hits, setHits] = useState<Set<string>>(new Set());
  const [popups, setPopups] = useState<Record<string, Popup[]>>({});
  const [vfx, setVfx] = useState<Record<string, { id: number; cls: string; color: string }>>({});
  const [flash, setFlash] = useState(false);
  // Sensations : tremblement sur les gros coups, ralenti sur le coup fatal.
  const [shake, setShake] = useState<'' | 'soft' | 'hard'>('');
  const [slowmo, setSlowmo] = useState(false);
  const doShake = (k: 'soft' | 'hard') => { if (save.settings.reducedMotion) return; setShake(k); setTimeout(() => setShake(''), k === 'hard' ? 420 : 260); };
  const [ult, setUlt] = useState<string | null>(null);
  const [wave, setWave] = useState<{ side: 'ally' | 'enemy'; color: string; id: number } | null>(null);
  const [result, setResult] = useState<ModeResult | null>(null);
  const [quit, setQuit] = useState(false);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [heavyHits, setHeavyHits] = useState<Set<string>>(new Set());
  const measureRef = useRef<HTMLDivElement>(null);
  const [infoH, setInfoH] = useState(64);
  // Musique : la couleur de la région ; le thème du boss dès que sa vague arrive.
  const bossWave = initial.info.waves.findIndex((w) => w.some((e) => e.kind === 'enemy' && ENEMIES[e.refId]?.boss));
  useEffect(() => { if (save.settings.music) playMusic(bossWave === 0 ? 'boss' : 'battle', initial.info.region); }, []); // eslint-disable-line react-hooks/exhaustive-deps
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

  const addVfx = (unitId: string, cls: string, color: string) => {
    if (useGame.getState().save?.settings.reducedMotion) return;
    const id = ++popSeq;
    setVfx((v) => ({ ...v, [unitId]: { id, cls, color } }));
    setTimeout(() => setVfx((v) => (v[unitId]?.id === id ? (({ [unitId]: _, ...rest }) => rest)(v) : v)), 750);
  };

  // ─── Couche d'effets (projectiles, pluies, rayons) positionnée sur les cartes ───
  const battleRef = useRef<HTMLDivElement>(null);
  const [fxItems, setFxItems] = useState<FxItem[]>([]);
  const posOf = (id: string) => {
    const host = battleRef.current?.getBoundingClientRect();
    const el = battleRef.current?.querySelector(`[data-uid="${id}"] .u-art`)?.getBoundingClientRect();
    if (!host || !el) return null;
    return { x: el.left - host.left + el.width / 2, y: el.top - host.top + el.height / 2, w: el.width, top: el.top - host.top };
  };
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
          if (e.crit) { setFlash(true); setTimeout(() => setFlash(false), 140); }
          { const t = s.units.find((u) => u.id === e.target); const big = !!t && e.amount > t.base.hp * 0.25; if (e.crit || big) doShake(e.crit && big ? 'hard' : 'soft'); }
          if (!soundOnce.has('hit:' + e.source)) { soundOnce.add('hit:' + e.source); playImpact(f, { crit: ev.some((x) => x.kind === 'damage' && x.source === e.source && x.crit), many: ev.filter((x) => x.kind === 'damage' && x.source === e.source).length > 1 }); }
          if (f.weapon === 'blunt' || e.crit) heavy.add(e.target);
          hit.add(e.target); if (e.combo) addPopup(e.target, 'Combo !', 'buff'); addPopup(e.target, `${e.crit ? 'CRIT ' : ''}-${e.amount}${e.strong ? ' ▲' : e.weak ? ' ▼' : ''}`, `dmg ${e.crit ? 'crit' : ''} ${e.strong ? 'strong' : ''} ${e.weak ? 'weak' : ''}`); pause = true; break;
        }
        case 'dot': hit.add(e.target); addPopup(e.target, `-${e.amount}`, e.status === 'poison' ? 'poison' : 'burn'); addVfx(e.target, `impact w-none e-${e.status === 'poison' ? 'poison' : 'fire'} small`, e.status === 'poison' ? '#8be04e' : '#ff8a3a'); if (!soundOnce.has('dot' + e.status)) { soundOnce.add('dot' + e.status); playDot(e.status); } pause = true; break;
        case 'heal': if (e.amount > 0) { addPopup(e.target, `+${e.amount}`, 'heal'); addVfx(e.target, 'healfx', '#7bea8f'); if (!soundOnce.has('heal')) { soundOnce.add('heal'); playHeal(); } } pause = true; break;
        case 'shield': addPopup(e.target, `+${e.amount}`, 'shieldp'); addVfx(e.target, 'shieldfx', '#aad7ff'); if (!soundOnce.has('shield')) { soundOnce.add('shield'); playShield(); } break;
        // Effets : seuls les malus importants s'affichent en texte ; les bonus n'ont qu'un halo (les pastilles suffisent).
        case 'status': if (['stun', 'freeze', 'taunt'].includes(e.status)) addPopup(e.target, STATUS_INFO[e.status].name, 'debuff'); if (!vfxBusy(e.target)) addVfx(e.target, STATUS_INFO[e.status].debuff ? 'cursefx' : 'bufffx', STATUS_INFO[e.status].color); if (!soundOnce.has('st:' + e.status)) { soundOnce.add('st:' + e.status); playStatus(e.status, STATUS_INFO[e.status].debuff); } break;
        case 'resist': if (e.immune) addPopup(e.target, 'Immunisé', 'resist'); break;
        case 'skip': addPopup(e.target, STATUS_INFO[e.status].name, 'debuff'); pause = true; break;
        case 'death': {
          addPopup(e.target, 'K.O.', 'death'); playDeath(); pause = true;
          const dead = s.units.find((u) => u.id === e.target);
          // Coup fatal : le dernier ennemi de la dernière vague tombe (surtout un boss) : ralenti et tremblement.
          if (dead && dead.side === 'enemy' && s.outcome === 'won' && !s.pendingWaves.length && !s.units.some((u) => u.side === 'enemy' && u.alive)) {
            doShake('hard');
            if (!save.settings.reducedMotion) { setSlowmo(true); setBanner({ text: dead.isBoss ? 'Coup fatal !' : 'Victoire !', side: 'ally' }); await wait(900); setSlowmo(false); }
          }
          break;
        }
        case 'revive': addVfx(e.target, 'revivefx', '#ffd36b'); addPopup(e.target, 'Ressuscité !', 'heal'); playRevive(); pause = true; break;
        case 'undying': addPopup(e.target, 'Ce qui ne meurt pas', 'buff'); break;
        case 'extraTurn': addPopup(e.target, 'Tour bonus !', 'buff'); break;
        case 'cleanse': break;
        case 'dispel': addPopup(e.target, 'Bonus retirés', 'debuff'); addVfx(e.target, 'cursefx', '#c7b6ff'); break;
        case 'rage': addPopup(e.target, 'Enragé ! +30 % ATQ', 'debuff'); pause = true; break;
        case 'carapace':
          if (e.broken) { addPopup(e.target, 'Carapace brisée !', 'buff'); addVfx(e.target, 'cursefx', '#ffd36b'); pause = true; }
          else if (e.reformed) { addPopup(e.target, 'Carapace reformée', 'shieldp'); addVfx(e.target, 'shieldfx', '#c9b27a'); }
          break;
        case 'lien': {
          setBanner({ text: `Pouvoir du Lien · ${LIEN_POWERS[e.power].name}`, side: 'ally' });
          for (const a of s.units.filter((u) => u.side === 'ally' && u.alive)) addVfx(a.id, e.power === 'heal' ? 'healfx' : e.power === 'guard' ? 'shieldfx' : 'revivefx', e.power === 'heal' ? '#7bea8f' : e.power === 'guard' ? '#aad7ff' : '#ffd36b');
          play('claim'); pause = true; break;
        }
        case 'wave': if (bossWave >= 0 && e.wave - 1 >= bossWave && useGame.getState().save?.settings.music) playMusic('boss', initial.info.region); setBanner({ text: `Vague ${e.wave} / ${s.totalWaves}`, side: 'wave' }); play('open'); force(); await wait(1100 / speedRef.current); setBanner(null); break;
      }
    }
    if (hit.size) { setHits(hit); setHeavyHits(heavy); }
    force();
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
    if (sk.slot === 'ultimate' && !reduced) { setUlt(actor.side); play('rare'); }
    force();
    await wait((sk.slot === 'ultimate' && !reduced ? 850 : 300) / speedRef.current);
    setUlt(null);
    // Lancement : son + trajet jusqu'aux cibles (projectile, pluie, vague, rayon de soutien).
    playCast(fx);
    let travel = fx.motion === 'melee' ? 120 : 0;
    if (!reduced) {
      const from = posOf(actor.id);
      const targets = previewTargets(s, actor, sk, a.targetId);
      const spd = speedRef.current;
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
    await playEvents(fx, actor.id);
    setActing(null);
    setBanner(null);
  };

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
      res = applyMode(d, spec, { won, alliesDead: dead, participants: initial.allies.map((a) => a.heroUid).filter((u): u is string => !!u), bossDamage: boss ? { dealt: boss.base.hp - Math.max(0, boss.hp), max: boss.base.hp } : undefined }, Date.now());
    });
    setResult(res);
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
  const backTo = (): Route['name'] => ({ campaign: 'campaign', dungeon: 'dungeons', tower: 'tower', worldboss: 'worldboss', arena: 'arena', guildboss: 'guild', challenge: 'events' } as const)[spec.mode];
  const cost = initial.info.cost;

  const order = s.outcome === 'running' ? predictOrder(s, 7) : [];
  const side = (sd: 'ally' | 'enemy') => s.units.filter((u) => u.side === sd);
  const row = (sd: 'ally' | 'enemy', back: boolean) => side(sd).filter((u) => (back ? u.slot >= 3 : u.slot < 3)).sort((a, b) => a.slot - b.slot);

  const renderUnit = (u: Unit) => (
    <UnitView key={u.id} u={u} vfx={vfx[u.id]} active={s.activeId === u.id} acting={acting === u.id} hit={hits.has(u.id)} heavy={heavyHits.has(u.id)}
      targetable={targetable.has(u.id)} popups={popups[u.id] ?? []} onClick={() => onUnit(u)} onInfo={() => setInfoId(u.id)}
      edge={awaiting && active && targetable.has(u.id) && u.side !== active.side ? affinityEdge(active.affinity, u.affinity) : undefined} />
  );

  return (
    <div ref={battleRef} className={`battle ${flash ? 'flash' : ''} ${shake ? `shake ${shake}` : ''} ${slowmo ? 'slowmo' : ''}`}>
      <BattleBackdrop region={initial.info.region} />
      <div className="battle-top">
        <div className="row between">
          <div>
            <div className="battle-stage">{initial.info.title}</div>
            <div className="faint">Vague {s.wave} / {s.totalWaves}{s.turnLimit ? ` · Actions ${Math.min(s.actionCount, s.turnLimit)}/${s.turnLimit}` : ''}</div>
          </div>
          {phase === 'fight' && <button className="back-btn" aria-label="Abandonner" onClick={() => setQuit(true)}><Icon.menu /></button>}
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
        // Taille des cartes selon le nombre réel de rangées (2 à 4) : jamais de chevauchement.
        const eb = row('enemy', true), ef = row('enemy', false), af = row('ally', false), ab = row('ally', true);
        const eRows = (eb.length ? 1 : 0) + (ef.length ? 1 : 0) || 1;
        const aRows = (ab.length ? 1 : 0) + (af.length ? 1 : 0) || 1;
        const bossBonus = side('enemy').some((u) => u.isBoss) ? 0.25 : 0;
        return (
          <div className="fields" style={{ ['--rows' as string]: eRows + aRows + bossBonus }}>
            <div className="field enemy-field" style={{ flexGrow: eRows + bossBonus }}>
              {eb.length > 0 && <div className="frow back">{eb.map(renderUnit)}</div>}
              {ef.length > 0 && <div className="frow">{ef.map(renderUnit)}</div>}
            </div>
            <div className="field ally-field" style={{ flexGrow: aRows }}>
              {af.length > 0 && <div className="frow">{af.map(renderUnit)}</div>}
              {ab.length > 0 && <div className="frow back">{ab.map(renderUnit)}</div>}
            </div>
          </div>
        );
      })()}

      {ult && <div className={`ult-overlay ${ult}`} />}
      {wave && <div key={wave.id} className={`field-wave ${wave.side}`} style={{ ['--vc' as string]: wave.color }} onAnimationEnd={() => setWave(null)} />}
      {banner && <div className={`skill-banner ${banner.side} ${ult ? 'ult' : ''}`} key={banner.text + banner.side}>{banner.text}</div>}

      <FxLayer items={fxItems} />
      {/* Tutoriel du combat : une seule bulle au premier combat ; AUTO au combat suivant (les affinités sont expliquées à la préparation). Bulles en haut : l'équipe reste visible. */}
      <Coach id="battle_skill" place="top" target=".battle-controls .skills" when={awaiting && !auto && phase === 'fight'} text="C’est ton tour : choisis une compétence en bas, puis touche un ennemi." />
      <Coach id="battle_auto" place="top" target=".ctrl-col" when={secondFight && awaiting && !auto && phase === 'fight'} text="AUTO fait jouer l’équipe toute seule ; ×1 / ×2 / ×3 accélère le combat." />

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
        <div className={`skill-info ${awaiting && active && selSkill ? '' : 'idle'}`} style={{ height: infoH }}>
          {awaiting && active && selSkill ? <SkillInfoBody unit={active} sk={selSkill} onLaunch={targetKind(selSkill) === 'none' ? () => act() : undefined} />
            : <span>{finished.current ? '' : auto ? 'Combat automatique : touche AUTO pour reprendre la main.' : awaiting ? 'Choisis une compétence.' : 'Tour adverse…'}</span>}
        </div>
        <div className="ctrl-row">
          <div className="ctrl-col">
            <button className={`ctrl ${auto ? 'on' : ''}`} onClick={toggleAuto}>AUTO</button>
            <button className="ctrl" onClick={cycleSpeed} aria-label={`Vitesse ×${speed}`}>×{speed}</button>
          </div>
          {s.lien >= 0 && (
            <button className={`lien-btn ${lienFull ? 'full' : ''}`} disabled={!lienFull} onClick={() => { play('tap'); setLienOpen((v) => !v); }}
              aria-label={`Pouvoir du Lien : ${Math.round((s.lien / LIEN_MAX) * 100)} %`} style={{ ['--lp' as string]: `${(s.lien / LIEN_MAX) * 360}deg` }}>
              <span className="lien-core">{s.lienUsed >= LIEN_USES ? '—' : lienFull ? 'LIEN' : `${Math.round((s.lien / LIEN_MAX) * 100)}%`}</span>
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

      {phase === 'result' && result && (
        <div className="result-overlay">
          <div className={`result-title ${result.won ? 'win' : 'lose'}`}>{spec.mode === 'worldboss' || spec.mode === 'guildboss' ? 'COMBAT TERMINÉ' : result.won ? 'VICTOIRE' : 'DÉFAITE'}</div>
          {result.won && (() => {
            // Un héros encore debout dit un mot (choisi selon le combat, toujours le même pour ce combat).
            const alive = s.units.filter((u) => u.side === 'ally' && u.alive && u.kind === 'hero' && HERO_LINES[u.refId]);
            if (!alive.length) return null;
            const u = alive[(s.units.length * 7 + alive.length) % alive.length];
            const lines = HERO_LINES[u.refId];
            return <div className="result-voice">« {lines[(u.hp + s.units.length) % lines.length | 0]} »<span>{HERO_BY_ID[u.refId]?.name.split(/[ ,]/)[0]}</span></div>;
          })()}
          {result.lines.map((l, i) => <div key={i} className="chip active" style={{ margin: '6px auto', display: 'flex', width: 'fit-content', textAlign: 'center' }}>{l}</div>)}
          {result.won && spec.mode === 'campaign' && (
            <div className="result-stars">
              {[1, 2, 3].map((n) => <span key={n} className={n <= result.stars ? 'on' : ''} style={{ animationDelay: `${0.3 + n * 0.2}s` }}><Icon.star size={46} color={n <= result.stars ? '#ffd36b' : '#3a3442'} /></span>)}
            </div>
          )}
          {result.won && spec.mode === 'campaign' && result.stars < 3 && (
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
                <RewardView reward={{ ...result.reward, ...Object.fromEntries(Object.entries(result.loot).map(([k, v]) => [k, (result.reward[k as keyof typeof result.reward] ?? 0) + (v ?? 0)])) }} />
                {result.gear.length > 0 && (
                  <div className="row" style={{ justifyContent: 'center', gap: 10, marginTop: 10 }}>
                    {result.gear.map((g) => <div key={g.uid} style={{ width: 70 }}><GearCard g={g} /></div>)}
                    <span className="faint">Nouvel équipement !</span>
                  </div>
                )}
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
                {spec.mode === 'arena' ? 'L’équipe adverse l’emporte cette fois. Choisis un adversaire plus accessible ou renforce tes héros (niveau, équipement, rang).'
                  : spec.mode === 'worldboss' ? 'Aucun palier de dégâts atteint. Renforce tes héros pour infliger plus de dégâts avant la fin du temps imparti.'
                  : 'Les ennemis l’emportent cette fois. Pistes : rejoue des combats plus simples pour gagner de l’expérience, utilise les élixirs et l’équipement, place un défenseur en première ligne et un soigneur en seconde ligne.'}
              </div>
            )}
            {result.accountLevelsGained > 0 && <div className="chip active" style={{ margin: '10px auto 0', display: 'flex', width: 'fit-content' }}>Niveau de compte {useGame.getState().save!.profile.level} ! +2 000 or, +30 énergie</div>}
          </div>
          <div className="result-actions">
            <button className="btn secondary grow" onClick={() => popTo(backTo())}>Retour</button>
            {spec.mode !== 'tower' && spec.mode !== 'challenge' && (
              <button className="btn secondary grow" onClick={retry}>{result.won ? 'Rejouer' : 'Réessayer'} {cost.kind === 'energy' && <><Icon.energy size={16} />{cost.amount}</>}{cost.kind === 'key' && ' (1 clé)'}{cost.kind === 'ticket' && ' (1 ticket)'}{cost.kind === 'try' && ' (1 essai)'}</button>
            )}
            {(spec.mode === 'tower' || (spec.mode === 'challenge' && spec.trial != null)) && !result.won && <button className="btn secondary grow" onClick={retry}>Réessayer</button>}
            {next && <button className="btn grow" onClick={() => replace({ name: 'prep', spec: next })}>Suivant</button>}
          </div>
        </div>
      )}

      {infoId && (() => {
        const u = s.units.find((x) => x.id === infoId);
        if (!u) return null;
        const list = [...u.statuses].sort((a, b) => Number(STATUS_INFO[b.status].debuff) - Number(STATUS_INFO[a.status].debuff));
        return (
          <div className="unit-info-backdrop" onClick={() => setInfoId(null)}>
            <div className={`unit-info ${u.side}`} role="dialog" aria-label={u.name}>
              <div className="ui-head"><b>{u.name}</b><span className="faint">Niv. {u.level}</span></div>
              <div className="ui-aff"><AffinityIcon id={u.affinity} size={16} /> {AFFINITIES[u.affinity].name}{AFFINITIES[u.affinity].strongAgainst ? ` · fort contre ${AFFINITIES[AFFINITIES[u.affinity].strongAgainst!].name}` : ' · neutre'}</div>
              <div className="ui-hp"><span>PV</span><b>{Math.max(0, Math.round(u.hp))} / {Math.round(u.base.hp)}</b></div>
              <div className="ui-stats"><span>ATQ <b>{Math.round(u.base.atk)}</b></span><span>DÉF <b>{Math.round(u.base.def)}</b></span><span>VIT <b>{Math.round(u.base.spd)}</b></span></div>
              {u.isBoss && (u.flags.carapaceMax > 0 || s.mechanics) && (
                <div className="ui-boss">
                  {u.flags.carapaceMax > 0 && <div><b>Carapace</b> {u.flags.carapace > 0 ? `· ${u.flags.carapace} charge${u.flags.carapace > 1 ? 's' : ''}` : '· brisée'} : −30 % de dégâts, chaque coup retire une charge. Brisée, le boss perd 30 % de DÉF pendant 2 tours ; elle se reforme 8 tours plus tard. Les attaques à plusieurs coups la brisent vite.</div>}
                  <div><b>{u.flags.enraged ? 'Enragé' : 'Rage'}</b> : sous la moitié de ses PV, le boss gagne +30 % d’ATQ.</div>
                </div>
              )}
              {list.length === 0 ? <p className="faint" style={{ margin: '8px 0 0' }}>Aucun effet en cours.</p> : (
                <div className="ui-status">
                  {groupStatuses(list).sort((a, b) => Number(STATUS_INFO[b.id].debuff) - Number(STATUS_INFO[a.id].debuff)).map((g) => (
                    <div key={g.id} className="ui-st">
                      <span className="ui-dot" style={{ background: STATUS_INFO[g.id].color }} />
                      <span className="grow"><b className={STATUS_INFO[g.id].debuff ? 'neg' : 'pos'}>{STATUS_INFO[g.id].name}{statusValueText(g, u.isBoss) ? ` ${statusValueText(g, u.isBoss)}` : ''}</b><br /><span className="faint">{statusDescription(g, u.isBoss)}</span></span>
                      <span className="faint">{g.turns} tour{g.turns > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="faint" style={{ margin: '10px 0 0', textAlign: 'center' }}>Touche pour fermer</p>
            </div>
          </div>
        );
      })()}

      {quit && (
        <Modal onClose={() => setQuit(false)}>
          <h2>Abandonner ?</h2>
          <p className="muted" style={{ textAlign: 'center' }}>Compté comme une défaite. L’énergie n’est pas rendue.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setQuit(false)}>Continuer</button>
            <button className="btn danger grow" onClick={doQuit}>Abandonner</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

type FxItem = { id: number; kind: 'proj' | 'rain' | 'burst' | 'beam' | 'aura'; fx: SkillFx; x0: number; y0: number; x1: number; y1: number; w?: number; dur: number };

/** Cibles prévues d'une compétence, pour lancer l'animation avant le calcul (sans tirage aléatoire). */
function previewTargets(s: BattleState, actor: Unit, sk: SkillDef, targetId?: string): Unit[] {
  const main = sk.effects.find((e) => e.kind === 'damage') ?? sk.effects.find((e) => e.kind === 'heal' || e.kind === 'shield' || e.kind === 'revive') ?? sk.effects[0];
  if (!main) return [actor];
  const foes = s.units.filter((u) => u.alive && u.side !== actor.side);
  const friends = s.units.filter((u) => u.alive && u.side === actor.side);
  const picked = targetId ? s.units.find((u) => u.id === targetId && u.alive) : undefined;
  switch (main.target) {
    case 'enemy': return [picked && picked.side !== actor.side ? picked : foes[0]].filter(Boolean) as Unit[];
    case 'allEnemies': return foes;
    case 'randomEnemies': return foes.slice(0, 1);
    case 'ally': return [picked && picked.side === actor.side ? picked : actor];
    case 'allAllies': return friends;
    case 'lowestAlly': return [...friends].sort((a, b) => a.hp / a.base.hp - b.hp / b.base.hp).slice(0, 1);
    default: return [actor];
  }
}

function FxLayer({ items }: { items: FxItem[] }) {
  return (
    <div className="fx-layer" aria-hidden>
      {items.map((it) => {
        const dx = it.x1 - it.x0, dy = it.y1 - it.y0;
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const style = { left: it.x0, top: it.y0, ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px`, ['--ang' as string]: `${ang}deg`,
          ['--len' as string]: `${Math.hypot(dx, dy)}px`, ['--c' as string]: it.fx.color, ['--w' as string]: `${it.w ?? 70}px`, animationDuration: `${it.dur}ms` } as React.CSSProperties;
        const cls = `fx-${it.kind} w-${it.fx.weapon} e-${it.fx.element}`;
        if (it.kind === 'rain') return <span key={it.id} className={cls} style={style}>{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDuration: `${it.dur}ms`, animationDelay: `${i * it.dur * 0.12}ms`, left: `${(i - 1.5) * 12}px` }} />)}</span>;
        return <span key={it.id} className={cls} style={style}><i /></span>;
      })}
    </div>
  );
}

const SLOT_TAG = { basic: 'Base', special: 'Spéciale', ultimate: 'Ultime', passive: 'Passif' } as const;

function SkillInfoBody({ unit, sk, onLaunch }: { unit: Unit; sk: SkillDef; onLaunch?: () => void }) {
  const tk = targetKind(sk);
  return (
    <>
      <div className="si-head">
        <span><b>{shortName(unit.name)}</b> · {sk.name}</span>
        {onLaunch ? <button className="btn small" style={{ minHeight: 28 }} onClick={onLaunch}>Lancer</button>
          : <span className="hint-target">{tk === 'ally' ? '▸ un allié' : tk === 'none' ? '▸ automatique' : '▸ un ennemi'}</span>}
      </div>
      <div className="si-meta">{SLOT_TAG[sk.slot]} · {sk.cooldown ? `recharge ${effectiveCooldown(sk, unit.skillLevels[sk.id] ?? 1)} tours` : 'utilisable à chaque tour'}</div>
      <div className="desc">{sk.description}</div>
    </>
  );
}

const shortName = (n: string) => n.replace(/^(Le|La|Les|L’|L')\s*/i, '').split(' ')[0];

function UnitView({ u, vfx, active, acting, hit, heavy, targetable, popups, onClick, onInfo, edge }: { u: Unit; vfx?: { id: number; cls: string; color: string }; active: boolean; acting: boolean; hit: boolean; heavy?: boolean; targetable: boolean; popups: Popup[]; onClick: () => void; onInfo: () => void; edge?: -1 | 0 | 1 }) {
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
    <button className={`unit ${u.side} ${u.alive ? '' : 'dead'} ${active ? 'active' : ''} ${acting ? 'acting' : ''} ${hit ? 'hit' : ''} ${targetable ? 'targetable' : ''} ${u.isBoss ? 'boss' : ''} ${heavy ? 'heavy' : ''} ${stCls}`} data-uid={u.id}
      onClick={() => { if (longDone.current) { longDone.current = false; return; } onClick(); }}
      onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
      onContextMenu={(e) => { e.preventDefault(); if (e.nativeEvent instanceof MouseEvent && (e.nativeEvent as PointerEvent).pointerType !== 'touch') { window.clearTimeout(timer.current); onInfo(); } }}>
      <div className="u-art">{u.kind === 'hero' ? <HeroArt heroId={u.refId} /> : <EnemyArt enemyId={u.refId} />}<span className="u-lvl">{u.level}</span><span className="u-aff"><AffinityIcon id={u.affinity} size={15} /></span><span className="u-name">{shortName(u.name)}</span>
        {stCls && <span className="u-stfx" aria-hidden><i /><i /><i /></span>}

      </div>
      <div className="u-bars">
        <div className="u-hp"><div style={{ width: `${hpPct(u) * 100}%` }} />{sh > 0 && <div className="u-sh" style={{ width: `${sh * 100}%` }} />}</div>
        <div className="u-tm"><div style={{ width: `${Math.min(100, u.tm / 10)}%` }} /></div>
      </div>
      <EffectChips u={u} />
      {stCls.includes('st-stun') && <span className="u-stars" aria-hidden>✦ ✦ ✦</span>}
      {u.alive && u.flags.carapaceMax > 0 && <span className={`u-cara ${u.flags.carapace ? '' : 'broken'}`} title="Carapace">{u.flags.carapace || '✕'}</span>}
      {u.alive && u.isBoss && u.flags.enraged > 0 && <span className="u-rage" title="Enragé">ENRAGÉ</span>}
      {edge === 1 && <span className="u-edge up">▲ +30 %</span>}
      {edge === -1 && <span className="u-edge down">▼ −20 %</span>}
      {vfx && <span key={vfx.id} className={`vfx ${vfx.cls}`} style={{ ['--vc' as string]: vfx.color }}><i /><i /><i /></span>}
      {popups.map((p) => <span key={p.id} className={`popup ${p.cls}`}>{p.text}</span>)}
    </button>
  );
}

/** Effets en cours, listés sous la carte avec leur valeur : néfastes d'abord (rouge), puis bénéfiques (vert), et les tours restants. */
function EffectChips({ u }: { u: Unit }) {
  if (!u.alive || !u.statuses.length) return <div className="u-fx" aria-hidden />;
  const list = groupStatuses(u.statuses).sort((a, b) => Number(STATUS_INFO[b.id].debuff) - Number(STATUS_INFO[a.id].debuff));
  const shown = list.slice(0, 4);
  return (
    <div className="u-fx" aria-label={list.map((g) => `${STATUS_INFO[g.id].name} ${statusValueText(g, u.isBoss)}, ${g.turns} tour${g.turns > 1 ? 's' : ''}`).join(' ; ')}>
      {shown.map((g) => {
        const v = statusValueText(g, u.isBoss);
        return (
          <span key={g.id} className={`fx-chip ${STATUS_INFO[g.id].debuff ? 'neg' : 'pos'}`} style={{ ['--fc' as string]: STATUS_INFO[g.id].color }} title={`${STATUS_INFO[g.id].name} · ${statusDescription(g, u.isBoss)} · ${g.turns} tour${g.turns > 1 ? 's' : ''}`}>
            {STATUS_INFO[g.id].short}{v && <i>{v.replace(' %', '%')}</i>}<b>{g.turns}</b>
          </span>
        );
      })}
      {list.length > shown.length && <span className="fx-chip more">+{list.length - shown.length}</span>}
    </div>
  );
}
