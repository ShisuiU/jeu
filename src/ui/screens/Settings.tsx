import { resetCoach } from '../components/Coach';
import { viewportInfo } from '../../viewport';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { Panel, Screen, Toggle } from '../components/common';
import { play } from '../../audio/sfx';
import { checkForUpdate, isStandalone } from '../../pwa';

export function Settings() {
  const save = useGame((s) => s.save)!;
  const update = useGame((s) => s.updateSettings);
  const setProfile = useGame((s) => s.setProfile);
  const toast = useUI((s) => s.toast);
  const st = save.settings;
  return (
    <Screen title="Paramètres">
      <Panel title="Profil">
        <label className="faint">Nom de l’Héritier</label>
        <input className="text-input" aria-label="Nom de l’Héritier" style={{ marginTop: 6 }} defaultValue={save.profile.name} maxLength={18}
          onBlur={(e) => { if (e.target.value.trim() && e.target.value !== save.profile.name) { setProfile({ name: e.target.value }); toast('Nom enregistré.', 'ok'); } }} />
      </Panel>
      <Panel title="Apparence">
        <div className="setting-row">
          <div className="grow"><b>Visuel</b><div className="faint">« Classique » remet l’ancien visuel, à l’identique.</div></div>
          <div className="seg" style={{ width: 170 }}>
            <button className={st.theme !== 'classic' ? 'on' : ''} onClick={() => update({ theme: 'v2' })}>Nouveau</button>
            <button className={st.theme === 'classic' ? 'on' : ''} onClick={() => update({ theme: 'classic' })}>Classique</button>
          </div>
        </div>
      </Panel>
      <Panel title="Son et affichage">
        <div className="setting-row">
          <div className="grow"><b>Effets sonores</b><div className="faint">Sons d’interface synthétisés</div></div>
          <Toggle label="Effets sonores" on={st.sound} onChange={(v) => update({ sound: v })} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Volume</b></div>
          <input type="range" aria-label="Volume des effets sonores" min={0} max={1} step={0.05} value={st.volume} disabled={!st.sound} style={{ width: 140, accentColor: '#d9b36a' }}
            onChange={(e) => update({ volume: Number(e.target.value) })} onPointerUp={() => play('tap')} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Musique d’ambiance</b><div className="faint">Générée en direct, fonctionne hors ligne</div></div>
          <Toggle label="Musique" on={st.music} onChange={(v) => update({ music: v })} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Volume de la musique</b></div>
          <input type="range" aria-label="Volume de la musique" min={0} max={1} step={0.05} value={st.musicVolume} disabled={!st.music} style={{ width: 140, accentColor: '#d9b36a' }} onChange={(e) => update({ musicVolume: Number(e.target.value) })} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Vitesse de combat par défaut</b></div>
          <div className="seg" style={{ width: 140 }}>{([1, 2, 3] as const).map((v) => <button key={v} className={st.battleSpeed === v ? 'on' : ''} onClick={() => update({ battleSpeed: v })}>×{v}</button>)}</div>
        </div>
        <div className="setting-row">
          <div className="grow"><b>Combat automatique par défaut</b></div>
          <Toggle label="Combat automatique" on={st.autoBattleDefault} onChange={(v) => update({ autoBattleDefault: v })} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Animations réduites</b><div className="faint">Économise la batterie, réduit les mouvements</div></div>
          <Toggle label="Animations réduites" on={st.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
        </div>
      </Panel>
      <Panel title="Application">
        <div className="setting-row">
          <div className="grow"><b>Mode</b><div className="faint">{isStandalone() ? 'Installée sur l’écran d’accueil ✓' : 'Navigateur. Installez le jeu pour une meilleure expérience.'}</div></div>
        </div>
        {!isStandalone() && (
          <div className="hint">Sur iPhone : dans Safari, touchez <b>Partager</b> (carré avec flèche) puis <b>« Sur l’écran d’accueil »</b>. Le jeu s’ouvrira en plein écran et fonctionnera hors ligne. Une fois installé, vos données ne sont plus effacées automatiquement par Safari.</div>
        )}
        <div className="setting-row">
          <div className="grow"><b>Version</b><div className="faint">{__APP_VERSION__} · sauvegarde v{save.version}</div></div>
          <button className="btn secondary small" onClick={async () => toast((await checkForUpdate()) ? 'Recherche de mise à jour lancée.' : 'Mises à jour indisponibles (hors ligne ou mode développement).')}>Mettre à jour</button>
        </div>
        <div className="setting-row">
          <div className="grow"><b>Guide de démarrage</b><div className="faint">Revoir les explications du début</div></div>
          <button className="btn secondary small" onClick={() => { useGame.getState().mutate((s) => { s.flags.guide_done = false; resetCoach(s); }); useUI.getState().tab('home'); }}>Revoir</button>
        </div>
        {save.time.rollbackCount > 0 && <div className="faint">Reculs d’horloge détectés : {save.time.rollbackCount}</div>}
        <div className="faint" style={{ marginTop: 8 }}>
          {(() => { const v = viewportInfo(); return `Écran ${v.screenH} · zone ${v.innerH} · haut ${v.top} · bas ${v.bottom} · ${v.app ? 'app' : 'navigateur'}${v.reserved ? ' · bas réservé' : ''}`; })()}
        </div>
      </Panel>
    </Screen>
  );
}
