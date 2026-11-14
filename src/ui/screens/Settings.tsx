import { resetCoach } from '../components/Coach';
import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { Panel, Screen, Toggle } from '../components/common';
import { play } from '../../audio/sfx';
import { checkForUpdate, isStandalone } from '../../pwa';
import { useState } from 'react';
import { useAccount } from '../../cloud/account';
import { localPush, pushOn, pushSupport } from '../../cloud/pushLocal';
import type { PushPrefs } from '../../game/notify';

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
        <div className="setting-row">
          <div className="grow"><b>Statistiques anonymes</b><div className="faint">Aide à équilibrer le jeu. Aucune donnée personnelle.</div></div>
          <Toggle label="Statistiques anonymes" on={st.shareStats} onChange={(v) => update({ shareStats: v })} />
        </div>
      </Panel>
      <NotifyPanel />
      <Panel title="Application">
        {!isStandalone() && (
          <div className="hint" style={{ marginTop: 0 }}><b>Installe le jeu</b> : dans Safari, <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b>. Plein écran, hors ligne, et tes données restent à l’abri.</div>
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

// NOTIFICATIONS — camp plein, énergie au maximum, cadeau d'un ami. Jamais la nuit.
const PREFS: { k: keyof PushPrefs; label: string }[] = [
  { k: 'camp', label: 'Camp plein' },
  { k: 'energy', label: 'Énergie au maximum' },
  { k: 'gifts', label: 'Cadeau d’un ami' },
];
function NotifyPanel() {
  const user = useAccount((s) => s.user);
  const toast = useUI((s) => s.toast);
  const push = useUI((s) => s.push);
  const [on, setOn] = useState(pushOn());
  const [prefs, setPrefs] = useState(localPush().prefs);
  const [busy, setBusy] = useState(false);
  const support = pushSupport();
  const api = () => import('../../cloud/pushCloud');
  const toggle = async (v: boolean) => {
    setBusy(true);
    try {
      if (v) {
        // L'autorisation est demandée tout de suite, pendant l'appui (l'iPhone l'exige).
        const perm = Notification.requestPermission();
        await (await api()).enablePush(useGame.getState().save!, perm);
        setOn(true); toast('Notifications activées.', 'ok');
      } else { await (await api()).disablePush(); setOn(false); toast('Notifications coupées.'); }
    } catch (e) { setOn(pushOn()); toast(e instanceof Error && (e as { code?: string }).code === 'push' ? e.message : 'Activation impossible pour le moment (connexion ?).', 'error'); }
    finally { setBusy(false); }
  };
  const setPref = (k: keyof PushPrefs, v: boolean) => { const n = { ...prefs, [k]: v }; setPrefs(n); void api().then((m) => m.setPushPrefs(n)).catch(() => {}); };
  return (
    <Panel title="Notifications">
      {support === 'ios-install' ? (
        <p className="hint" style={{ margin: 0 }}>Sur iPhone, les notifications marchent quand le jeu est <b>installé</b> : dans Safari, touche <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b>, et ouvre le jeu depuis son icône.</p>
      ) : support === 'no' ? (
        <p className="faint" style={{ margin: 0 }}>Ce navigateur ne gère pas les notifications.</p>
      ) : !user ? (
        <div className="setting-row">
          <div className="grow"><b>Notifications</b><div className="faint">Il faut un compte pour en recevoir</div></div>
          <button className="btn secondary small" onClick={() => push({ name: 'saves' })}>Compte</button>
        </div>
      ) : (
        <>
          <div className="setting-row">
            <div className="grow"><b>Notifications</b><div className="faint">Te prévient quand le jeu est fermé. Jamais la nuit (22 h – 8 h).</div></div>
            <Toggle label="Notifications" on={on} disabled={busy} onChange={(v) => void toggle(v)} />
          </div>
          {on && PREFS.map((p) => (
            <div key={p.k} className="setting-row">
              <div className="grow">{p.label}</div>
              <Toggle label={p.label} on={prefs[p.k]} onChange={(v) => setPref(p.k, v)} />
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}
