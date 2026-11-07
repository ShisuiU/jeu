import { useState } from 'react';
import { LORE } from '../../data/lore';
import { CHAPTERS } from '../../data/campaign';
import { FACTION_LIST } from '../../data/factions';
import { AFFINITIES } from '../../data/affinities';
import { ROLE_LIST } from '../../data/roles';
import { RARITY_LIST } from '../../data/rarities';
import { HEROES } from '../../data/heroes';
import { Panel, Screen } from '../components/common';
import { FactionEmblem } from '../art/FactionEmblem';

type Tab = 'story' | 'factions' | 'rules';

export function Codex() {
  const [tab, setTab] = useState<Tab>('story');
  return (
    <Screen title="Codex">
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={tab === 'story' ? 'on' : ''} onClick={() => setTab('story')}>Histoire</button>
        <button className={tab === 'factions' ? 'on' : ''} onClick={() => setTab('factions')}>Factions</button>
        <button className={tab === 'rules' ? 'on' : ''} onClick={() => setTab('rules')}>Règles</button>
      </div>
      {tab === 'story' && (
        <>
          {LORE.map((l) => (
            <Panel key={l.id} title={l.title}><div className="lore">{l.text.map((t, i) => <p key={i}>{t}</p>)}</div></Panel>
          ))}
          <Panel title="Chapitres de la campagne">
            {CHAPTERS.map((c) => <div key={c.n} className="stat-row"><span>Chapitre {c.n} · <b>{c.name}</b></span><span className="faint">{c.region}</span></div>)}
          </Panel>
        </>
      )}
      {tab === 'factions' && FACTION_LIST.map((f) => (
        <Panel key={f.id}>
          <div className="row" style={{ marginBottom: 8 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, display: 'grid', placeItems: 'center', background: `radial-gradient(circle, ${f.colors.primary}, #000)`, border: `1px solid ${f.colors.secondary}66` }}>
              <FactionEmblem id={f.id} size={36} />
            </div>
            <div className="grow"><h3 style={{ fontSize: 17, color: f.colors.glow }}>{f.name}</h3><div className="faint">{f.motto}</div></div>
          </div>
          <div className="lore"><p>{f.description}</p><p className="muted"><i>{f.ambiance}</i></p><p><b>Synergie :</b> {f.synergy}</p></div>
          <div className="faint">Héros : {HEROES.filter((h) => h.faction === f.id).map((h) => h.name).join(', ')}</div>
        </Panel>
      ))}
      {tab === 'rules' && (
        <>
          <Panel title="Affinités">
            <div className="lore"><p>Solaire ▸ Tellurique ▸ Lunaire ▸ Solaire. Une affinité avantagée inflige +30 % de dégâts ; désavantagée, −20 %. Le Néant est neutre.</p></div>
            {Object.values(AFFINITIES).map((a) => <div key={a.id} className="stat-row"><b style={{ color: a.color }}>{a.name}</b><span className="faint">{a.description}</span></div>)}
          </Panel>
          <Panel title="Combos">
            <div className="lore"><p>Certaines compétences frappent plus fort une cible déjà affaiblie (empoisonnée, gelée, DÉF réduite, provoquée…) : « Combo ! » s’affiche. L’<b>achèvement</b> ajoute +50 % de dégâts contre une cible sous 30 % de ses PV. D’autres compétences <b>retirent les bonus</b> d’un ennemi. Associe les héros qui posent un effet à ceux qui en profitent.</p></div>
          </Panel>
          <Panel title="Rôles">{ROLE_LIST.map((r) => <div key={r.id} className="stat-row"><b>{r.name}</b><span className="faint" style={{ maxWidth: '65%', textAlign: 'right' }}>{r.description}</span></div>)}</Panel>
          <Panel title="Raretés">{RARITY_LIST.map((r) => <div key={r.id} className="stat-row"><b style={{ color: r.color }}>{r.name}</b><span className="faint">Rang de départ {r.startRank} · stats ×{r.statMult}</span></div>)}</Panel>
        </>
      )}
    </Screen>
  );
}
