import { act3Of } from '../../data/bossActs';
import { CHALLENGES, checkChallenge } from '../../data/challenges';
import { Coach } from '../components/Coach';
import { AffinityIcon } from '../art/Identity';
import type { AffinityId } from '../../data/types';
import { useEffect, useMemo, useState } from 'react';
import { simulateOdds } from '../../game/odds';
import { COUTURES } from '../../data/coutures';
import { useAccount } from '../../cloud/account';
import { canBorrow, markBorrowed } from '../../game/friends';
import type { UnitSetup } from '../../game/battle/types';
import type { FriendRow } from '../../cloud/friendsCloud';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { ENEMIES } from '../../data/enemies';
import { HERO_BY_ID } from '../../data/heroes';
import { AFFINITIES } from '../../data/affinities';
import { STAGE_BY_ID } from '../../data/campaign';
import { stageProgress } from '../../game/campaign';
import { heroTotalStats } from '../../game/heroStats';
import { powerOf } from '../../game/stats';
import { energyMax, msToNextEnergy } from '../../game/energy';
import { canStart, payMode, resolveMode, type BattleSpec } from '../../game/modes';
import { BG_MAX, BG_RUN_MS, canBackground, startBackground } from '../../game/background';
import { Modal } from '../components/common';
import { play } from '../../audio/sfx';
import { formatDuration } from '../../core/time';
import { InfoButton, Panel, Screen, fmt } from '../components/common';
import { RewardInline } from '../components/RewardView';
import { HeroCard } from '../components/HeroCard';
import { EnemyArt } from '../art/EnemyArt';
import { HeroArt } from '../art/HeroArt';
import { Icon } from '../art/Icons';
import { factionHeroes, factionTeam, setFactionTeam } from '../../game/factionDungeon';
import { FACTIONS } from '../../data/factions';
import { FactionEmblem } from '../art/FactionEmblem';

/** Écran de préparation commun à tous les modes : ennemis, récompenses, équipe, coût. */
export function Prep({ spec }: { spec: BattleSpec }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const setActiveTeam = useGame((s) => s.setActiveTeam);
  const { push, replace, toast } = useUI.getState();
  const info = resolveMode(save, spec);
  const start = canStart(save, spec);
  const [teamId, setTeamId] = useState(save.activeTeamId);
  const [bgOpen, setBgOpen] = useState(false);
  const [bgCount, setBgCount] = useState(10);
  const [bgStop, setBgStop] = useState(true);
  // Renfort d'un ami (campagne et donjons) : son meilleur héros prend une place libre, une fois par jour et par ami.
  const user = useAccount((st) => st.user);
  const [lenders, setLenders] = useState<FriendRow[]>(friendCache ?? []);
  const [guestOf, setGuestOf] = useState<string | null>(null);
  const bgOk = canBackground(save, spec);
  // Donjon des familles : équipe à part, seulement avec des héros de la famille du donjon.
  const fac = spec.mode === 'faction' ? spec.faction : null;
  const [facPick, setFacPick] = useState<string[] | null>(null);
  const team = fac ? factionTeam(save, fac) : save.teams.find((t) => t.id === teamId) ?? save.teams[0];
  const members = team.slots.map((u) => save.heroes.find((h) => h.uid === u));
  const power = members.reduce((a, h) => a + (h ? powerOf(heroTotalStats(save, h).total) : 0), 0);
  const count = members.filter(Boolean).length;
  const energyShort = info.cost.kind === 'energy' && save.energy.current < info.cost.amount;
  const newHeroes = spec.mode === 'campaign' && info.firstTime ? STAGE_BY_ID[spec.stageId].firstClear.heroes : undefined;
  const boss = info.waves.flat().some((w) => w.kind === 'enemy' && ENEMIES[w.refId]?.boss);

  // Pronostic : 6 combats simulés avec l'équipe choisie (pas pour les boss à paliers de dégâts).
  const odds = useMemo(() => (spec.mode === 'worldboss' || spec.mode === 'guildboss' || !count ? null : simulateOdds(save, team, info.waves, info.turnLimit)),
    [team.id, team.slots.join(','), JSON.stringify(spec), save.revision]); // eslint-disable-line react-hooks/exhaustive-deps
  const guestOk = (spec.mode === 'campaign' || spec.mode === 'dungeon') && !!user && count < 5;
  useEffect(() => {
    if (!guestOk || friendCache) return;
    let alive = true;
    import('../../cloud/friendsCloud').then((a) => a.listFriends()).then((rows) => {
      friendCache = rows.filter((r) => r.f.status === 'ok' && r.profile?.lend && HERO_BY_ID[r.profile.lend.refId]);
      if (alive) setLenders(friendCache);
    }).catch(() => {});
    return () => { alive = false; };
  }, [guestOk]);
  const guestRow = guestOf ? lenders.find((r) => r.uid === guestOf) : undefined;
  const go = () => {
    if (!count) { toast('Ton équipe est vide : ajoute des héros dans l’écran Équipe.', 'error'); return; }
    let r: { ok: boolean; reason?: string } = { ok: false };
    mutate((d) => { r = payMode(d, spec, now); });
    if (!r.ok) { toast(r.reason ?? 'Impossible.', 'error'); return; }
    if (!fac && team.id !== save.activeTeamId) setActiveTeam(team.id);
    const l = guestRow?.profile?.lend;
    const guest: UnitSetup | undefined = l ? { kind: 'hero', refId: l.refId, slot: 0, level: l.level, rank: l.rank, ascension: l.ascension, awaken: l.awaken, skillLevels: l.skillLevels, gear: l.gear } : undefined;
    if (guest && guestRow) mutate((d) => { markBorrowed(d, guestRow.uid, Date.now()); });
    replace({ name: 'battle', spec, teamId: team.id, seed: Date.now(), guest });
  };

  const doBackground = () => {
    let r: { ok: boolean; reason?: string } = { ok: false };
    mutate((d) => { r = startBackground(d, spec, team.id, bgCount, bgStop, Date.now()); });
    setBgOpen(false);
    if (!r.ok) { toast(r.reason ?? 'Impossible.', 'error'); return; }
    play('claim');
    toast(`${bgCount} combat${bgCount > 1 ? 's' : ''} lancé${bgCount > 1 ? 's' : ''} en arrière-plan : continue à jouer, ils se font tout seuls.`, 'ok');
  };

  // Ennemis regroupés : chaque type une seule fois (avec le nombre), le boss en premier.
  const foes = (() => {
    const m = new Map<string, { refId: string; isHero: boolean; level: number; n: number; boss: boolean }>();
    for (const w of info.waves) for (const e of w) {
      const isHero = e.kind === 'hero';
      const k = `${e.kind}:${e.refId}`;
      const cur = m.get(k);
      if (cur) { cur.n += 1; cur.level = Math.max(cur.level, e.level); }
      else m.set(k, { refId: e.refId, isHero, level: e.level, n: 1, boss: !isHero && !!ENEMIES[e.refId]?.boss });
    }
    return [...m.values()].sort((x, y) => Number(y.boss) - Number(x.boss));
  })();
  const ruleWhy = info.challenge ? checkChallenge(info.challenge, members.filter(Boolean).map((h) => HERO_BY_ID[h!.heroId])) : null;
  const blocked = !start.ok || energyShort || !count || !!ruleWhy;

  return (
    <Screen title={info.title}>
      <Coach id="prep_fight" target=".fight-btn" text="Voici les ennemis et la récompense. Lance le combat !" />
      <Coach id="battle_target" target=".aff-advice" when={Object.values(save.progress.campaign).some((p) => p.clears > 0)} text="Les affinités comptent : Solaire bat Tellurique, qui bat Lunaire, qui bat Solaire. Un héros avantagé (▲) frappe 30 % plus fort. Regarde ici combien ton équipe en a." />
      <div className="prep-sub"><span className="muted">{info.subtitle}</span></div>
      {(() => { const fs = new Set(members.filter(Boolean).map((h) => HERO_BY_ID[h!.heroId].faction)); const c = COUTURES.find((x) => fs.has(x.factions[0]) && fs.has(x.factions[1])); return c ? <div className="prep-couture">✦ Couture d’époque possible : <b>{save.flags[`couture_${c.id}`] ? c.name : '???'}</b> <span className="faint">({FACTIONS[c.factions[0]].short} + {FACTIONS[c.factions[1]].short}, au 3ᵉ tour de l’équipe)</span></div> : null; })()}
      {odds && (
        <div className={`prep-odds ${odds.tone}`} role="status">
          <b>{odds.label}</b>
          <span>{odds.wins}/{odds.runs} victoires simulées{odds.tone === 'bad' ? ' : renforce ton équipe' : ''}</span>
        </div>
      )}
      {info.challenge && (
        <div className={`prep-rule ${ruleWhy ? 'bad' : ''}`} role="status">
          <b>Règle du défi · {CHALLENGES[info.challenge].name}</b> : {CHALLENGES[info.challenge].text}
          <div className={ruleWhy ? 'neg' : 'pos'} style={{ marginTop: 3 }}>{ruleWhy ? ruleWhy : '✓ Ton équipe respecte la règle.'}</div>
        </div>
      )}
      {spec.mode === 'campaign' && <StarRules best={stageProgress(save, spec.difficulty, spec.stageId).stars} />}
      <AffinityAdvice waves={info.waves} team={members.filter(Boolean).map((h) => h!.heroId)} />

      <Panel title={spec.mode === 'arena' ? 'Équipe adverse' : `Ennemis · ${info.waves.length} vague${info.waves.length > 1 ? 's' : ''}`}>
        <div className="foe-row">
          {foes.map((f) => {
            const d = f.isHero ? HERO_BY_ID[f.refId] : ENEMIES[f.refId];
            return (
              <div key={f.refId} className={`foe ${f.boss ? 'boss' : ''}`} title={d.name}>
                <div className="foe-art">{f.isHero ? <HeroArt heroId={f.refId} /> : <EnemyArt enemyId={f.refId} />}<span className="u-lvl">{f.level}</span><span className="u-aff"><AffinityIcon id={d.affinity} size={13} /></span>{f.n > 1 && <span className="foe-n">×{f.n}</span>}</div>
                <div className="foe-name">{f.boss ? 'Boss' : d.name.split(/[ ,]/)[0]}</div>
              </div>
            );
          })}
        </div>
        {boss && spec.mode !== 'arena' && (() => {
          const b = foes.find((f) => f.boss); const a3 = b && !info.turnLimit ? act3Of(ENEMIES[b.refId].affinity) : null;
          return (
            <div className="prep-acts">
              <b>Boss en {a3 ? 3 : 2} actes</b> <span className="faint">· insensible à l’étourdissement et au gel</span>
              <ol>
                <li><b>Acte II</b>, sous 50 % de PV : il enrage (+30 % ATQ), se purifie et se protège.</li>
                {a3 && <li><b style={{ color: a3.color }}>Dernier acte · {a3.name}</b>, sous 25 % : il {a3.text}.</li>}
              </ol>
            </div>
          );
        })()}
      </Panel>

      {fac && (
        <Panel>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="row" style={{ gap: 6 }}><FactionEmblem id={fac} size={22} /><b>Héros {FACTIONS[fac].short === 'Akkar' ? 'd’Akkar' : `de ${FACTIONS[fac].short}`}</b></span>
            <span className="muted">Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(power)}</b></span>
          </div>
          <button className="mini-team prep-team-strip" onClick={() => setFacPick(team.slots.filter((u): u is string => !!u))} aria-label="Choisir les héros de la famille">
            {members.map((h, i) => (
              <div key={i} className="prep-slot">
                <div className="mini-slot">{h ? <HeroCard heroId={h.heroId} level={h.level} /> : <span className="faint">+</span>}</div>
                <span className={`prep-lead ${h && team.leader === h.uid ? 'on' : ''}`}>{h && team.leader === h.uid ? '♛ Chef' : ''}</span>
              </div>
            ))}
          </button>
          <p className="faint" style={{ margin: '6px 0 0' }}>{factionHeroes(save, fac).length ? 'Touche l’équipe pour choisir tes héros de cette famille (le premier choisi est le chef).' : 'Tu n’as encore aucun héros de cette famille : invoque-en pour entrer dans ce donjon.'}</p>
        </Panel>
      )}
      {!fac && <Panel>
        <div className="row between" style={{ marginBottom: 8 }}>
          {save.teams.length > 1 ? (
            <select className="prep-team" value={team.id} onChange={(e) => setTeamId(e.target.value)} aria-label="Équipe">
              {save.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          ) : <b>{team.name}</b>}
          <span className="muted">Puissance <b style={{ color: 'var(--gold-hi)' }}>{fmt(power)}</b></span>
        </div>
        <button className="mini-team prep-team-strip" onClick={() => push({ name: 'team' })} aria-label="Modifier l’équipe">
          {members.map((h, i) => (
            <div key={i} className="prep-slot">
              <div className="mini-slot">{h ? <HeroCard heroId={h.heroId} level={h.level} /> : <span className="faint">+</span>}</div>
              {/* Le chef est signalé sous sa carte : le portrait reste dégagé. */}
              <span className={`prep-lead ${h && team.leader === h.uid ? 'on' : ''}`}>{h && team.leader === h.uid ? '♛ Chef' : ''}</span>
            </div>
          ))}
        </button>
      </Panel>}

      {facPick && fac && (
        <Modal onClose={() => setFacPick(null)}>
          <h2>Héros {FACTIONS[fac].short === 'Akkar' ? 'd’Akkar' : `de ${FACTIONS[fac].short}`}</h2>
          <p className="faint" style={{ textAlign: 'center', marginTop: 0 }}>Jusqu’à 5 héros · le premier choisi est le chef · {facPick.length}/5</p>
          <div className="train-pick">
            {factionHeroes(save, fac).sort((a, b) => powerOf(heroTotalStats(save, b).total) - powerOf(heroTotalStats(save, a).total)).map((h) => {
              const i = facPick.indexOf(h.uid);
              return (
                <button key={h.uid} className={`tp-hero ${i >= 0 ? 'picked' : ''}`} onClick={() => setFacPick(i >= 0 ? facPick.filter((u) => u !== h.uid) : facPick.length < 5 ? [...facPick, h.uid] : facPick)}>
                  <span className="ts-art"><HeroArt heroId={h.heroId} /><span className="ts-lv">{h.level}</span>{i >= 0 && <span className="tp-order">{i === 0 ? '♛' : i + 1}</span>}</span>
                  <span className="tp-name">{HERO_BY_ID[h.heroId].name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
          <button className="btn block" style={{ marginTop: 12 }} onClick={() => { const pick = facPick; mutate((d) => setFactionTeam(d, fac, pick)); setFacPick(null); }}>Valider l’équipe</button>
        </Modal>
      )}

      {guestOk && lenders.length > 0 && (
        <Panel title="Renfort d’un ami">
          <div className="guest-pick">
            {lenders.map((r) => {
              const l = r.profile!.lend!; const used = !canBorrow(save, r.uid, now);
              return (
                <button key={r.uid} className={`guest-opt ${guestOf === r.uid ? 'on' : ''}`} disabled={used} onClick={() => setGuestOf(guestOf === r.uid ? null : r.uid)} aria-label={`Renfort : ${HERO_BY_ID[l.refId].name} de ${r.profile!.name}`}>
                  <div className="xp-ava"><HeroArt heroId={l.refId} /><span className="u-lvl">{l.level}</span></div>
                  <div className="faint">{used ? 'Déjà venu' : r.profile!.name}</div>
                </button>
              );
            })}
          </div>
          <p className="faint" style={{ margin: '6px 0 0' }}>{guestRow ? `${HERO_BY_ID[guestRow.profile!.lend!.refId].name} rejoint ton équipe pour ce combat.` : 'Choisis le héros d’un ami : il prend une place libre de ton équipe pour ce combat.'}</p>
        </Panel>
      )}
      <Panel title={info.rewardLabel}>
        <RewardInline reward={info.rewardPreview} />
        {newHeroes?.map((id) => <p key={id} className="hint" style={{ marginTop: 8 }}>Nouveau héros : <b>{HERO_BY_ID[id].name}</b></p>)}
        {info.notes.filter(Boolean).map((n, i) => <p key={i} className="faint" style={{ margin: '6px 0 0' }}>{n}</p>)}
      </Panel>

      {/* Barre d'action : toujours visible en bas, au-dessus de la navigation. */}
      <div className="prep-bar">
        {blocked && <div className="prep-why">{!count ? 'Équipe vide : touche l’équipe pour ajouter des héros.' : !start.ok ? start.reason : ruleWhy ? `Défi : ${ruleWhy}` : `Énergie ${save.energy.current}/${info.cost.amount} · +1 dans ${formatDuration(msToNextEnergy(save.energy, now, energyMax(save.profile.level)))}`}</div>}
        <div className="row" style={{ gap: 8 }}>
          {(spec.mode === 'campaign' || spec.mode === 'dungeon') && (
            <button className="btn secondary prep-sweep" disabled={!bgOk.ok || !count} onClick={() => setBgOpen(true)} title={bgOk.ok ? 'Combats automatiques pendant que tu joues ailleurs' : bgOk.reason} aria-label="Combats en arrière-plan">
              <Icon.loop size={16} /> <span className="lbl">Répéter</span>
            </button>
          )}
          <button className="btn grow fight-btn" disabled={blocked} onClick={go}>
            Combattre {info.cost.kind === 'energy' && <><Icon.energy size={18} /> {info.cost.amount}</>}{info.cost.kind === 'key' && '· 1 clé'}{info.cost.kind === 'ticket' && '· 1 ticket'}{info.cost.kind === 'try' && '· 1 essai'}<span className="shine" />
          </button>
        </div>
      </div>
      {bgOpen && (
        <Modal onClose={() => setBgOpen(false)}>
          <h2>Combats en arrière-plan</h2>
          <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
            Ton équipe rejoue ce niveau toute seule, un combat toutes les {BG_RUN_MS / 1000} secondes, pendant que tu fais autre chose, même jeu fermé.
            Vrais combats, mêmes récompenses. S’il manque de l’énergie, la série attend qu’elle revienne.
          </p>
          <div className="bg-count">
            <button className="btn secondary small" onClick={() => setBgCount(Math.max(1, bgCount - 1))} aria-label="Un combat de moins">−</button>
            <b>{bgCount}</b><span className="faint">combat{bgCount > 1 ? 's' : ''}</span>
            <button className="btn secondary small" onClick={() => setBgCount(Math.min(BG_MAX, bgCount + 1))} aria-label="Un combat de plus">+</button>
          </div>
          <div className="row" style={{ gap: 6, marginTop: 8 }}>
            {[5, 10, 20, BG_MAX].map((n) => <button key={n} className={`btn secondary small grow ${bgCount === n ? 'on' : ''}`} onClick={() => setBgCount(n)}>×{n}</button>)}
          </div>
          <label className="bg-stop"><input type="checkbox" checked={bgStop} onChange={(e) => setBgStop(e.target.checked)} /> S’arrêter à la première défaite</label>
          <p className="faint" style={{ textAlign: 'center', margin: '6px 0 10px' }}>
            {info.cost.kind === 'energy' ? <>Coût : {info.cost.amount} énergie par combat, soit {info.cost.amount * bgCount} en tout. </> : null}
            Durée : environ {Math.ceil((bgCount * BG_RUN_MS) / 60000)} min.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn secondary grow" onClick={() => setBgOpen(false)}>Annuler</button>
            <button className="btn grow" onClick={doBackground}>Lancer</button>
          </div>
        </Modal>
      )}
    </Screen>
  );
}

/** Ancienne route « stage » (campagne Normal). */
/** Amis qui prêtent un héros (chargés une fois par session). */
let friendCache: FriendRow[] | null = null;

export function Stage({ stageId }: { stageId: string }) {
  return <Prep spec={{ mode: 'campaign', stageId, difficulty: 'normal' }} />;
}

/** Conseil d'affinité : l'affinité ennemie la plus présente, et celle qui la bat. */
function AffinityAdvice({ waves, team }: { waves: { kind: string; refId: string }[][]; team: string[] }) {
  const count: Partial<Record<AffinityId, number>> = {};
  for (const w of waves) for (const e of w) {
    const a = (e.kind === 'hero' ? HERO_BY_ID[e.refId].affinity : ENEMIES[e.refId].affinity) as AffinityId;
    count[a] = (count[a] ?? 0) + 1;
  }
  const main = (Object.entries(count) as [AffinityId, number][]).filter(([a]) => a !== 'void').sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!main) return null;
  const counter = (Object.values(AFFINITIES).find((x) => x.strongAgainst === main))?.id as AffinityId | undefined;
  // Ce qui fait la différence : combien de tes héros frappent fort (▲) ou faiblement (▼) contre ces ennemis.
  const up = team.filter((id) => AFFINITIES[HERO_BY_ID[id].affinity].strongAgainst === main).length;
  const down = team.filter((id) => AFFINITIES[main].strongAgainst === HERO_BY_ID[id].affinity).length;
  return (
    <div className="aff-advice">
      <div>
        <span>Ennemis surtout <AffinityIcon id={main} size={16} /> <b style={{ color: AFFINITIES[main].color }}>{AFFINITIES[main].name}</b></span>
        {counter && <span> · conseillé <AffinityIcon id={counter} size={16} /> <b style={{ color: AFFINITIES[counter].color }}>{AFFINITIES[counter].name}</b></span>}
      </div>
      {team.length > 0 && (
        <div className="aff-team">
          Ton équipe : <b className="aff-up">{up} ▲</b> · <b className={down ? 'aff-down' : ''}>{down} ▼</b>
          <InfoButton title="Affinités">Solaire bat Tellurique, qui bat Lunaire, qui bat Solaire. Un héros avantagé (▲) inflige +30 % de dégâts à ces ennemis ; désavantagé (▼), −20 %. Le Néant est neutre.</InfoButton>
        </div>
      )}
    </div>
  );
}

/** Conditions des étoiles, affichées avant le combat (et le meilleur résultat déjà obtenu). */
function StarRules({ best }: { best: number }) {
  const rules = ['Victoire', '1 KO max', 'Aucun KO'];
  return (
    <div className="star-rules" aria-label={`Étoiles : meilleur résultat ${best} sur 3`}>
      {rules.map((r, i) => (
        <span key={i} className={`sr ${best > i ? 'got' : ''}`}>
          <span className="sr-stars">{Array.from({ length: i + 1 }, (_, k) => <Icon.star key={k} size={11} color={best > i ? '#ffd36b' : '#7a7266'} />)}</span>
          {r}
        </span>
      ))}
    </div>
  );
}
