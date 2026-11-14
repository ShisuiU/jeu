import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { CAMP_MAX_HOURS, CAMP_MIN_MS, campElapsed, campLoot, campMsToFull, campProgress, campRates, claimCamp } from '../../game/camp';
import { formatDuration } from '../../core/time';
import { play } from '../../audio/sfx';
import { Panel, Screen, fmt } from '../components/common';
import { RewardView } from '../components/RewardView';
import { Icon, ResourceIcon } from '../art/Icons';
import { RESOURCES } from '../../data/resources';

// CAMP DES HÉRITIERS — le butin d'absence : il s'accumule jusqu'à 12 h, même jeu fermé.
export function Camp() {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const elapsed = campElapsed(save, now);
  const loot = campLoot(save, now);
  const rates = campRates(save);
  const pct = Math.min(100, (elapsed / (CAMP_MAX_HOURS * 3600_000)) * 100);
  const toFull = campMsToFull(save, now);
  const ready = elapsed >= CAMP_MIN_MS && Object.keys(loot).length > 0;
  const claim = () => {
    let r: ReturnType<typeof claimCamp> = { ok: false, reason: '' };
    mutate((s) => { r = claimCamp(s, now); });
    if (r.ok) { play('claim'); toast('Butin du camp récupéré.', 'ok'); } else toast(r.reason, 'error');
  };
  const per = (k: keyof typeof rates, digits = 0) => (digits ? rates[k].toFixed(digits).replace('.', ',') : fmt(Math.round(rates[k])));
  return (
    <Screen title="Camp des Héritiers">
      <div className={`camp-fire ${pct >= 100 ? 'full' : ''}`} aria-hidden><span /><span /><span /></div>
      <p className="muted" style={{ textAlign: 'center', marginTop: 0 }}>
        Butin d’absence, jusqu’à <b>{CAMP_MAX_HOURS} h</b>, même jeu fermé.
      </p>
      <Panel title="Butin accumulé">
        <div className="progress" style={{ marginBottom: 6 }}><div style={{ width: `${pct}%` }} /></div>
        <div className="row between faint" style={{ marginBottom: 10 }}>
          <span>{formatDuration(elapsed)} / {CAMP_MAX_HOURS} h</span>
          <span>{toFull > 0 ? `Plein dans ${formatDuration(toFull)}` : 'Le camp est plein : récupère le butin !'}</span>
        </div>
        {Object.keys(loot).length ? <RewardView reward={loot} /> : <p className="muted" style={{ textAlign: 'center' }}>Le feu vient d’être rallumé. Reviens plus tard.</p>}
        <button className="btn" style={{ width: '100%', marginTop: 12 }} disabled={!ready} onClick={claim}>Récupérer</button>
      </Panel>
      <Panel title="Par heure">
        <div className="stat-row"><span className="row" style={{ gap: 6 }}><Icon.coin size={16} /> Or</span><b>{per('gold')}</b></div>
        <div className="stat-row"><span className="row" style={{ gap: 6 }}><ResourceIcon icon={RESOURCES.xpElixir.icon} color={RESOURCES.xpElixir.color} size={16} /> Élixirs d’expérience</span><b>{per('xpElixir', 2)}</b></div>
        <div className="stat-row"><span className="row" style={{ gap: 6 }}><ResourceIcon icon={RESOURCES.forgeOre.icon} color={RESOURCES.forgeOre.color} size={16} /> Minerai de forge</span><b>{per('forgeOre', 1)}</b></div>
        <p className="hint" style={{ marginBottom: 0 }}>Le butin grandit avec la campagne : {campProgress(save)} niveaux terminés sur 90.</p>
      </Panel>
    </Screen>
  );
}
