import type { GearSlot, SetId } from '../../data/equipment';

// ILLUSTRATIONS D'ÉQUIPEMENT — une par ensemble et par emplacement (src/assets/gear/gear-<ensemble>-<emplacement>.webp),
// peintes dans le style des héros. Chargées à la demande puis gardées hors ligne. Sans illustration : le symbole.
const files = import.meta.glob('/src/assets/gear/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/gear-([a-z]+)-([a-z]+)\.webp$/);
  if (m) ART[`${m[1]}-${m[2]}`] = url;
}

export const gearArtUrl = (set: SetId, slot: GearSlot): string | undefined => ART[`${set}-${slot}`];

export function GearArt({ set, slot, className = 'gc-art' }: { set: SetId; slot: GearSlot; className?: string }) {
  const url = gearArtUrl(set, slot);
  if (!url) return null;
  return <img className={`art-img ${className}`} src={url} alt="" draggable={false} loading="lazy" decoding="async" onLoad={(e) => e.currentTarget.classList.add('ok')} style={{ ['--ph' as string]: '#2a2134' }} />;
}
