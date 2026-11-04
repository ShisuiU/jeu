import { useState } from 'react';
import { useGame } from '../../state/store';
import { canClaimDaily } from '../../game/daily';
import { DailyBody } from './Daily';
import { useUI } from '../../state/ui';
import { MAIL, mailFlag } from '../../data/mail';
import { applyReward } from '../../game/rewards';
import { play } from '../../audio/sfx';
import { Panel, Screen } from '../components/common';
import { RewardView } from '../components/RewardView';

// COURRIER — un seul endroit pour les cadeaux : la récompense de connexion du jour et les messages.
export function Mail({ tab: initial }: { tab?: 'daily' | 'messages' }) {
  const save = useGame((s) => s.save)!;
  const now = useGame((s) => s.now);
  const mutate = useGame((s) => s.mutate);
  const toast = useUI((s) => s.toast);
  const [tab, setTab] = useState<'daily' | 'messages'>(initial ?? (canClaimDaily(save, now) || !unreadMail(save.flags) ? 'daily' : 'messages'));
  const unread = MAIL.filter((m) => !save.flags[mailFlag(m.id)]).length;
  return (
    <Screen title="Courrier">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>Connexion{canClaimDaily(save, now) && <span className="seg-count">1</span>}</button>
        <button className={tab === 'messages' ? 'on' : ''} onClick={() => setTab('messages')}>Messages{unread > 0 && <span className="seg-count">{unread}</span>}</button>
      </div>
      {tab === 'daily' && <DailyBody />}
      {tab === 'messages' && MAIL.map((m) => {
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
