import { COUTURES } from '../../data/coutures';
import { FACTIONS } from '../../data/factions';
import { useGame } from '../../state/store';
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
  const flags = useGame((st) => st.save?.flags ?? {});
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
          <Panel title="Coutures d’époque">
            <div className="lore"><p>Deux héros de familles différentes dans la même équipe peuvent déclencher, une fois par combat (au 3ᵉ tour de l’équipe), une attaque cousue qui frappe tous les ennemis. Chaque couture découverte s’inscrit ici.</p></div>
            {COUTURES.map((c) => { const known = !!flags[`couture_${c.id}`]; return (
              <div key={c.id} className={`codex-couture ${known ? '' : 'unknown'}`}><b>✦ {known ? c.name : '???'}</b><span className="faint">{FACTIONS[c.factions[0]].name} + {FACTIONS[c.factions[1]].name}{known ? ` · ${c.text}` : ''}</span></div>
            ); })}
          </Panel>
          <Panel title="Affinités">
            <div className="lore"><p>Solaire ▸ Tellurique ▸ Lunaire ▸ Solaire. Une affinité avantagée inflige +30 % de dégâts ; désavantagée, −20 %. Le Néant est neutre.</p></div>
            {Object.values(AFFINITIES).map((a) => <div key={a.id} className="stat-row"><b style={{ color: a.color }}>{a.name}</b><span className="faint">{a.description}</span></div>)}
          </Panel>
          <Panel title="Pouvoir du Lien">
            <div className="lore"><p>Toi, le Lien, tu agis aussi en combat. Ta jauge (le cercle doré près des compétences) se remplit à chaque action de tes héros et à chaque ennemi vaincu. Pleine, touche-la, au tour d’un héros et sans lui faire perdre son tour, pour choisir : <b>Souffle de vie</b> (soin de 20 % et effets néfastes retirés), <b>Frappe des Héritiers</b> (toute l’équipe frappe l’ennemi le plus affaibli) ou <b>Rempart</b> (bouclier et élan). Deux fois par combat au plus. En combat automatique, il agit tout seul.</p></div>
          </Panel>
          <Panel title="Boss">
            <div className="lore"><p><b>Carapace</b> (boss à partir du niveau 20) : −30 % de dégâts, chaque coup retire une charge (le nombre doré sur la carte). Brisée, le boss perd 30 % de DÉF pendant 2 tours : c’est le moment de frapper fort. Elle se reforme 8 tours plus tard ; les attaques à plusieurs coups et de zone la brisent vite.</p><p><b>Rage</b> : sous la moitié de ses PV, un boss gagne +30 % d’ATQ (« Enragé »). Garde un soin ou le Rempart du Lien pour ce moment.</p></div>
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
