import diamondUrl from '../../assets/kit/diamond.webp';
// Icônes vectorielles du jeu (aucune dépendance externe, nettes sur écran Retina).
type P = { size?: number; color?: string };

const S = ({ size = 22, children, vb = '0 0 24 24' }: { size?: number; children: React.ReactNode; vb?: string }) => (
  <svg viewBox={vb} width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);

/** Petites icônes des statistiques (fiche du héros). */
export const StatIcon: Record<string, (p: P) => JSX.Element> = {
  hp: (p) => <S {...p}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></S>,
  atk: (p) => <S {...p}><path d="M14 4h6v6L9 21l-3-3z" /><path d="m5 14 5 5M3 21l3-3" /></S>,
  def: (p) => <S {...p}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" /></S>,
  spd: (p) => <S {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6z" /></S>,
  critRate: (p) => <S {...p}><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></S>,
  critDmg: (p) => <S {...p}><path d="m12 2 2.2 6.3L21 9l-5.2 4.2L17.6 20 12 16.3 6.4 20l1.8-6.8L3 9l6.8-.7z" /></S>,
  acc: (p) => <S {...p}><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" /></S>,
  res: (p) => <S {...p}><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" /><path d="M8 12h8M12 8v8" /></S>,
};

export const Icon = {
  home: (p: P) => <S {...p}><path d="M3 11 12 3l9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></S>,
  heroes: (p: P) => <S {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-4 3.4-6 6.5-6s5.7 2 6.5 6" /><circle cx="17" cy="7" r="2.6" /><path d="M16 12.5c3 0 5 1.6 5.6 5" /></S>,
  team: (p: P) => <S {...p}><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6z" /><path d="m9 12 2 2 4-4" /></S>,
  bag: (p: P) => <S {...p}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></S>,
  menu: (p: P) => <S {...p}><path d="M4 6h16M4 12h16M4 18h16" /></S>,
  pause: (p: P) => <S {...p}><path d="M9 5v14M15 5v14" /></S>,
  back: (p: P) => <S {...p}><path d="M15 5 8 12l7 7" /></S>,
  gift: (p: P) => <S {...p}><rect x="3" y="9" width="18" height="12" rx="1.5" /><path d="M12 9v12M3 13h18" /><path d="M12 9C9 9 7 7.5 7.5 5.5S11 5 12 9c1-4 4-5.5 4.5-3.5S15 9 12 9z" /></S>,
  scroll: (p: P) => <S {...p}><path d="M7 3h11a2 2 0 0 1 0 4H7" /><path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7" /><path d="M9 11h7M9 15h5" /></S>,
  book: (p: P) => <S {...p}><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 19.5V4.5M9 7h7" /></S>,
  gear: (p: P) => <S {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></S>,
  save: (p: P) => <S {...p}><path d="M5 3h11l3 3v15H5z" /><path d="M8 3v5h7V3M8 21v-7h8v7" /></S>,
  lock: (p: P) => <S {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>,
  unlock: (p: P) => <S {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></S>,
  wheel: (p: P) => <S {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.4" /><path d="M12 3v6.6M12 14.4V21M3 12h6.6M14.4 12H21M5.6 5.6l4.7 4.7M13.7 13.7l4.7 4.7M18.4 5.6l-4.7 4.7M10.3 13.7l-4.7 4.7" /></S>,
  loop: (p: P) => <S {...p}><path d="M4 12a8 8 0 0 1 13.7-5.6L20 9" /><path d="M20 3v6h-6" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15" /><path d="M4 21v-6h6" /></S>,
  sword: (p: P) => <S {...p}><path d="M14.5 3H21v6.5L10 20.5 3.5 14z" /><path d="m7 17-3 3M5 13l6 6" /></S>,
  portal: (p: P) => <S {...p}><ellipse cx="12" cy="12" rx="6" ry="9" /><ellipse cx="12" cy="12" rx="2.5" ry="5" /><path d="M12 1v2M12 21v2M3 12H1M23 12h-2" /></S>,
  dungeon: (p: P) => <S {...p}><path d="M3 21V9l9-6 9 6v12" /><path d="M9 21v-6a3 3 0 0 1 6 0v6" /><path d="M3 21h18" /></S>,
  tower: (p: P) => <S {...p}><path d="M7 21V8l-2-2V3h3v2h2V3h4v2h2V3h3v3l-2 2v13" /><path d="M10 21v-4h4v4M4 21h16M10 11h4" /></S>,
  arena: (p: P) => <S {...p}><path d="m4 4 7 7M20 4l-7 7M4 4v4M4 4h4M20 4v4M20 4h-4" /><path d="m9 14-5 5 1 1 5-5M15 14l5 5-1 1-5-5" /></S>,
  skull: (p: P) => <S {...p}><path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v3h10v-3c1.5-1 3-3 3-6a8 8 0 0 0-8-8z" /><circle cx="9" cy="10" r="1.6" /><circle cx="15" cy="10" r="1.6" /><path d="M10 19v2M14 19v2" /></S>,
  helmet: (p: P) => <S {...p}><path d="M4 14a8 8 0 0 1 16 0v4h-6v-4h-4v4H4z" /><path d="M12 6V3" /></S>,
  armor: (p: P) => <S {...p}><path d="M8 3 4 6v6l2 1v8h12v-8l2-1V6l-4-3-4 3z" /><path d="M12 6v15" /></S>,
  gloves: (p: P) => <S {...p}><path d="M7 21v-6L5 10V6a1.5 1.5 0 0 1 3 0v3V4a1.5 1.5 0 0 1 3 0v5V3.5a1.5 1.5 0 0 1 3 0V9V5a1.5 1.5 0 0 1 3 0v8l-2 2v6z" /></S>,
  boots: (p: P) => <S {...p}><path d="M7 3h6v10l6 3a2 2 0 0 1 1 2v3H5v-6l2-2z" /><path d="M5 18h15" /></S>,
  ring: (p: P) => <S {...p}><circle cx="12" cy="15" r="6" /><path d="m9 6 3-3 3 3-3 3z" /></S>,
  gem: (p: P) => <S {...p}><path d="M6 3h12l4 6-10 12L2 9z" /><path d="M2 9h20M12 21 8 9l4-6 4 6z" /></S>,
  calendar: (p: P) => <S {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /><path d="m12 13 1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 15.3l2-.3z" /></S>,
  mail: (p: P) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></S>,
  filter: (p: P) => <S {...p}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></S>,
  temple: (p: P) => <S {...p}><path d="M3 9 12 3l9 6" /><path d="M4 9h16" /><path d="M6 9v9M10 9v9M14 9v9M18 9v9" /><path d="M3 21h18M4 18h16" /></S>,
  forge: (p: P) => <S {...p}><path d="M3 10h13l2-3h3v4l-3 2H6z" /><path d="M8 13v3l-3 5h14l-3-5v-3" /></S>,
  star: ({ size = 12, color = '#ffd36b' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z" fill={color} stroke="#3a2a0a" strokeWidth="1" /></svg>,
  // ─── Ressources (en couleur) ───
  diamond: ({ size = 22 }: P) => <img className="diamond-ic" src={diamondUrl} width={size} height={size} alt="" draggable={false} />,
  energy: ({ size = 22 }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="#5fe0ff" stroke="#0b4d63" strokeWidth="1.2" strokeLinejoin="round" /></svg>,
  coin: ({ size = 22 }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><circle cx="12" cy="12" r="9.5" fill="#e8b43e" stroke="#7a5512" strokeWidth="1.2" /><circle cx="12" cy="12" r="6.5" fill="none" stroke="#fff0b8" strokeWidth="1.2" opacity="0.7" /><path d="M12 8v8M9.5 10h5" stroke="#7a5512" strokeWidth="1.6" strokeLinecap="round" /></svg>,
  crystal: ({ size = 22, color = '#7fe7ff' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M12 2 19 8l-7 14L5 8z" fill={color} stroke="#0d3f52" strokeWidth="1.2" strokeLinejoin="round" /><path d="M5 8h14M12 2l-3 6 3 14 3-14z" fill="none" stroke="#e8fbff" strokeWidth="0.9" opacity="0.8" /></svg>,
  shard: ({ size = 22, color = '#3d8bff' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M9 2 16 5 20 13 13 22 6 17 4 8z" fill={color} stroke="#000" strokeOpacity="0.5" strokeWidth="1.2" strokeLinejoin="round" /><path d="M9 2 11 12 4 8M11 12l9 1M11 12l2 10" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.9" fill="none" /></svg>,
  flask: ({ size = 22, color = '#9bdc6a' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M9 2h6M10 2v6L4.5 18.5A2.3 2.3 0 0 0 6.5 22h11a2.3 2.3 0 0 0 2-3.5L14 8V2" fill="none" stroke="#ddd" strokeWidth="1.4" /><path d="M7 14h10l2.5 4.5a2.3 2.3 0 0 1-2 3.5h-11a2.3 2.3 0 0 1-2-3.5z" fill={color} /></svg>,
  potion: ({ size = 22, color = '#7fbf4d' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M10 2h4v5a7 7 0 1 1-4 0z" fill={color} stroke="#eee" strokeWidth="1.3" /><path d="M9 2h6" stroke="#c08a5a" strokeWidth="2.4" /><circle cx="10" cy="15" r="1.6" fill="#fff" opacity="0.6" /></svg>,
  sigil: ({ size = 22, color = '#ffd48a' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><circle cx="12" cy="12" r="9.5" fill="#3a2a10" stroke={color} strokeWidth="1.6" /><path d="m12 5 2 5h5l-4 3 1.5 5L12 15l-4.5 3L9 13 5 10h5z" fill={color} /></svg>,
  ore: ({ size = 22, color = '#c08a5a' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M3 16 7 7l7-3 7 7-2 8-9 2z" fill="#4a3d36" stroke="#222" strokeWidth="1.2" /><path d="M8 10l3 2-1 4M14 8l2 4 3 1" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></svg>,
  mscroll: ({ size = 22, color = '#e0b2ff' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M6 4h11a3 3 0 0 1 0 6H8v8a2 2 0 1 1-4 0V7a3 3 0 0 1 2-3z" fill="#efe3c8" stroke="#5a4628" strokeWidth="1.2" /><path d="M8 10h9v7a3 3 0 0 1-3 3H6a2 2 0 0 0 2-2z" fill="#e2d2ae" stroke="#5a4628" strokeWidth="1.2" /><circle cx="13" cy="14.5" r="2.4" fill={color} stroke="#4a2a5a" strokeWidth="1" /></svg>,
  essence: ({ size = 22, color = '#ff9bb5' }: P) => <svg viewBox="0 0 24 24" width={size} height={size}><path d="M12 2c3 5 7 7 7 12a7 7 0 0 1-14 0c0-5 4-7 7-12z" fill={color} stroke="#5a1430" strokeWidth="1.2" /><path d="M12 9c1.5 2.5 3 3.5 3 6" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" fill="none" /></svg>,
};

// Illustrations des ressources (src/assets/res/res-<ressource>.webp) : utilisées dans les grandes vignettes
// (sac, récompenses, Marché) ; les petites icônes dans le texte gardent le symbole, plus lisible à cette taille.
import shardCommonImg from '../../assets/kit/shard_common.webp';
import shardAeonImg from '../../assets/kit/shard_aeon.webp';
import shardEpicImg from '../../assets/kit/shard_epic.webp';
import shardRiftImg from '../../assets/kit/shard_rift.webp';
const RES_FILES = import.meta.glob('/src/assets/res/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const RES_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(RES_FILES)) { const m = path.match(/res-([a-zA-Z]+)\.webp$/); if (m) RES_ART[m[1]] = url; }
// Éclats (v1.101.1) : UNE seule texture partout, celle des cristaux de l'Autel (petites icônes comprises).
RES_ART.shardDim = shardCommonImg; RES_ART.shardAeon = shardAeonImg; RES_ART.shardEpic = shardEpicImg; RES_ART.shardEvent = shardRiftImg;
const SHARD_BY_COLOR: Record<string, string> = { '#a9b0b8': 'shardDim', '#3d8bff': 'shardAeon', '#a64dff': 'shardEpic', '#ff3d6e': 'shardEvent' };
const SHARDS = new Set(['shardDim', 'shardAeon', 'shardEpic', 'shardEvent']);
export const resArtUrl = (id: string) => RES_ART[id];

export function ResourceIcon({ icon, color, size, res }: { icon: string; color?: string; size?: number; res?: string }) {
  // Un éclat est reconnu même quand l'appelant ne donne que l'icône et la couleur.
  const shard = res && SHARDS.has(res) ? res : icon === 'shard' && color ? SHARD_BY_COLOR[color.toLowerCase()] : undefined;
  if (shard) return <img className="art-img res-shard" src={RES_ART[shard]} alt="" width={size ?? 22} height={size ?? 22} draggable={false} decoding="async" />;
  const url = res && (size ?? 22) >= 26 ? RES_ART[res] : undefined;
  if (url) return <img className="art-img res-art" src={url} alt="" width={size} height={size} draggable={false} loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add('ok')} style={{ ['--ph' as string]: color ?? '#2a2134' }} />;
  const f = (Icon as Record<string, (p: P) => JSX.Element>)[icon] ?? Icon.crystal;
  return f({ size, color });
}
