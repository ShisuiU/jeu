import type { SkillDef, StatusId } from '../../data/types';
import { BUFFS, DEBUFFS } from '../../game/battle/types';
import { StatusIcon } from './StatusIcon';

// Icônes peintes (SpriteCook, v1.118.0) : une par famille, découpées d'une même planche ; le tracé au trait reste en secours.
const ART = import.meta.glob('/src/assets/skills/sk_*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PAINTED: Partial<Record<string, string>> = Object.fromEntries(Object.entries(ART).map(([k, v]) => [k.match(/sk_([a-z]+)\.webp$/)![1], v]));

// ICÔNE DE COMPÉTENCE (v1.115.0) — dessinée d'après ce que fait la compétence, pas peinte à la main :
// frappe unique, frappes multiples, frappe de zone, soin, bouclier, renforcement, affaiblissement, résurrection.
// Le joueur lit la fonction d'un coup d'œil ; un petit symbole d'effet (poison, brûlure…) s'ajoute dans le coin.

type Kind = 'strike' | 'multi' | 'aoe' | 'heal' | 'shield' | 'buff' | 'debuff' | 'revive' | 'tempo';

export function skillKind(sk: SkillDef): { kind: Kind; status?: StatusId } {
  const ef = sk.effects;
  const dmg = ef.find((e) => e.kind === 'damage');
  const st = ef.find((e) => e.kind === 'status');
  const status = st && st.kind === 'status' ? st.status : undefined;
  if (ef.some((e) => e.kind === 'revive')) return { kind: 'revive' };
  if (dmg && dmg.kind === 'damage') {
    const aoe = dmg.target === 'allEnemies' || dmg.target === 'randomEnemies';
    return { kind: aoe ? 'aoe' : (dmg.hits ?? 1) > 1 ? 'multi' : 'strike', status };
  }
  if (ef.some((e) => e.kind === 'heal')) return { kind: 'heal', status };
  if (ef.some((e) => e.kind === 'shield')) return { kind: 'shield', status: status === 'shield' ? undefined : status };
  if (status && DEBUFFS.includes(status)) return { kind: 'debuff', status };
  if (status && BUFFS.includes(status)) return { kind: 'buff', status };
  return { kind: 'tempo' };
}

const PATHS: Record<Kind, JSX.Element> = {
  strike: <path d="M17.5 2.5H21.5V6.5L10 18l-2 .5.5-2zM5 15.5l3.5 3.5M3 21l3.2-3.2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity={0.25} />,
  multi: <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" fill="none"><path d="M4 18 18 4M8 20 20 8M2.5 13.5 13.5 2.5" /></g>,
  aoe: <g fill="currentColor"><path d="m12 1.5 1.8 6.2L20 6l-4.2 4.8L22 12l-6.2 1.2L20 18l-6.2-1.7L12 22.5l-1.8-6.2L4 18l4.2-4.8L2 12l6.2-1.2L4 6l6.2 1.7z" fillOpacity={0.9} /><circle cx="12" cy="12" r="3" fill="rgba(10,8,14,0.6)" /></g>,
  heal: <><path d="M12 21s-8-5-8-11.2A4.6 4.6 0 0 1 12 6.8a4.6 4.6 0 0 1 8 3c0 6.2-8 11.2-8 11.2z" fill="currentColor" /><path d="M12 9.5v7M8.5 13h7" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" /></>,
  shield: <><path d="M12 2 4 5.2v6c0 5.2 3.4 9 8 11 4.6-2 8-5.8 8-11v-6z" fill="currentColor" /><path d="M12 5.2v14" stroke="rgba(255,255,255,0.6)" strokeWidth={1.5} /></>,
  buff: <g fill="currentColor"><path d="M12 2 20 11h-5v11H9V11H4z" /></g>,
  debuff: <g fill="currentColor"><path d="M12 22 4 13h5V2h6v11h5z" /></g>,
  revive: <><path d="M12 2.5a4.2 4.2 0 0 1 0 8.4 4.2 4.2 0 0 1 0-8.4z" fill="currentColor" /><path d="M4.5 11.5h15v2.8h-15zM10.6 13h2.8v9h-2.8z" fill="currentColor" /></>,
  tempo: <g fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 8.5V13l3 2M9.5 2.5h5" /></g>,
};

export function SkillGlyph({ sk, color, size = 30 }: { sk: SkillDef; color: string; size?: number }) {
  const { kind, status } = skillKind(sk);
  return (
    <span className={`sk-glyph k-${kind} s-${sk.slot}`} style={{ ['--gc' as string]: color, width: size, height: size }} aria-hidden>
      {PAINTED[kind] ? <img className="sk-glyph-art" src={PAINTED[kind]} alt="" width={size * 0.78} height={size * 0.78} draggable={false} /> : <svg viewBox="0 0 24 24" width={size * 0.62} height={size * 0.62}>{PATHS[kind]}</svg>}
      {status && <span className="sk-glyph-st"><StatusIcon id={status} size={Math.round(size * 0.38)} /></span>}
    </span>
  );
}
