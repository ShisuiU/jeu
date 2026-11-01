import { fnv1a } from '../core/hash';
import { migrateSave, SaveFormatError } from './migrations';
import type { SaveData } from './schema';

// Format d'export : texte « AEONFALL1:<base64(JSON)> ». Le JSON contient une empreinte pour détecter
// les copier-coller tronqués. Le texte peut être stocké dans Notes, envoyé par mail, mis dans iCloud Drive…

const PREFIX = 'AEONFALL1:';

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function exportSave(save: SaveData): string {
  const data = JSON.stringify(save);
  const envelope = JSON.stringify({ app: 'aeonfall', exportedAt: Date.now(), checksum: fnv1a(data), data });
  return PREFIX + toBase64(envelope);
}

export function importSave(text: string): SaveData {
  const t = text.trim().replace(/\s+/g, '');
  if (!t.startsWith(PREFIX)) throw new SaveFormatError('Ce texte n’est pas une sauvegarde Aeonfall.');
  let env: any;
  try { env = JSON.parse(fromBase64(t.slice(PREFIX.length))); } catch {
    throw new SaveFormatError('Sauvegarde incomplète ou endommagée (copie tronquée ?).');
  }
  if (env?.app !== 'aeonfall' || typeof env.data !== 'string') throw new SaveFormatError('Format inconnu.');
  if (fnv1a(env.data) !== env.checksum) throw new SaveFormatError('Empreinte invalide : la sauvegarde a été modifiée ou abîmée.');
  return migrateSave(JSON.parse(env.data));
}

export function exportFileName(save: SaveData): string {
  const d = new Date(save.updatedAt);
  const p = (n: number) => String(n).padStart(2, '0');
  return `aeonfall-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.aeonsave.txt`;
}
