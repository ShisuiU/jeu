import { useGame } from '../../state/store';
import { useUI } from '../../state/ui';
import { MAIL, mailFlag } from '../../data/mail';
import { applyReward } from '../../game/rewards';
import { play } from '../../audio/sfx';
import { Panel, Screen } from '../components/common';
import { RewardView } from '../components/RewardView';

export function Mail() {
  const save = useGame((s) => s.save)!;
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  return (
    <Screen title="Courrier">
      {MAIL.map((m) => {
        const claimed = !!save.flags[mailFlag(m.id)];
        return (
          <Panel key={m.id} title={m.title}>
            <div className="faint">De : {m.from}</div>
            <p className="lore">{m.text}</p>
            <RewardView reward={m.reward} />
            <button className="btn block" style={{ marginTop: 12 }} disabled={claimed} onClick={() => {
              mutate((s) => { if (!s.flags[mailFlag(m.id)]) { applyReward(s, m.reward); s.flags[mailFlag(m.id)] = true; } });
              play('claim'); toast('Récompense récupérée.', 'ok');
            }}>{claimed ? 'Déjà récupéré' : 'Récupérer'}</button>
          </Panel>
        );
      })}
    </Screen>
  );
}

export const unreadMail = (flags: Record<string, boolean>) => MAIL.some((m) => !flags[mailFlag(m.id)]);
