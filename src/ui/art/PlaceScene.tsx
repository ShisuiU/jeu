
// LIEUX DU JEU — Sanctuaire (héros) et Forge (équipement).
// Une illustration peut être déposée dans src/assets/places/<id>.webp : elle remplace
// automatiquement la scène vectorielle ci-dessous.
const files = import.meta.glob('/src/assets/places/*.{webp,png,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const PLACE_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const m = path.match(/places\/([^/.]+)\./);
  if (m) PLACE_ART[m[1]] = url;
}

export type PlaceId = 'sanctuary' | 'forge';

/** Illustration d'un lieu (sanctuary, forge, altar…), si elle existe. */
export function placeArt(id: string): string | undefined { return PLACE_ART[id]; }

export function PlaceAmbient({ place }: { place: PlaceId }) {
  const art = PLACE_ART[place];
  if (!art) return <div className="bg-ambient" />;
  return (
    <div className="place-ambient" aria-hidden>
      <img src={art} alt="" draggable={false} />
    </div>
  );
}
