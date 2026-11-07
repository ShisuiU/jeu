import { resetCoach } from '../components/Coach';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { Panel, Screen, Toggle } from '../components/common';
import { play } from '../../audio/sfx';
import { checkForUpdate, isStandalone } from '../../pwa';

export function Settings() {
  const save = useGame((s) => s.save)!;
  const update = useGame((s) => s.updateSettings);
  const toast = useUI((s) => s.toast);
  const st = save.settings;
  return (
    <Screen title="Paramètres">
      <Panel title="Son">
        <div className="setting-row">
          <div className="grow"><b>Effets sonores</b></div>
          <Toggle label="Effets sonores" on={st.sound} onChange={(v) => update({ sound: v })} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Volume</b></div>
          <input type="range" aria-label="Volume des effets sonores" min={0} max={1} step={0.05} value={st.volume} disabled={!st.sound} style={{ width: 140, accentColor: '#d9b36a' }}
            onChange={(e) => update({ volume: Number(e.target.value) })} onPointerUp={() => play('tap')} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Musique</b></div>
          <Toggle label="Musique" on={st.music} onChange={(v) => update({ music: v })} />
        </div>
        <div className="setting-row">
          <div className="grow"><b>Volume de la musique</b></div>
          <input type="range" aria-label="Volume de la musique" min={0} max={1} step={0.05} value={st.musicVolume} disabled={!st.music} style={{ width: 140, accentColor: '#d9b36a' }} onChange={(e) => update({ musicVolume: Number(e.target.value) })} />
        </div>
      </Panel>
      <Panel title="Jeu">
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
        {!isStandalone() && (
          <div className="hint" style={{ marginTop: 0 }}><b>Installe le jeu</b> : sur iPhone, dans Safari, touche <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b>. Il s’ouvrira en plein écran, marchera hors ligne, et Safari n’effacera plus tes données.</div>
        )}
        <div className="setting-row">
          <div className="grow"><b>Version</b><div className="faint">{__APP_VERSION__}</div></div>
          <button className="btn secondary small" onClick={async () => toast((await checkForUpdate()) ? 'Recherche de mise à jour lancée.' : 'Mises à jour indisponibles (hors ligne ou mode développement).')}>Mettre à jour</button>
        </div>
        <div className="setting-row">
          <div className="grow"><b>Guide de démarrage</b><div className="faint">Revoir les explications du début</div></div>
          <button className="btn secondary small" onClick={() => { useGame.getState().mutate((s) => { s.flags.guide_done = false; resetCoach(s); }); useUI.getState().tab('home'); }}>Revoir</button>
        </div>
      </Panel>
    </Screen>
  );
}
