import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createNewSave, SAVE_VERSION } from '../src/save/schema';
import { migrateSave, SaveFormatError } from '../src/save/migrations';
import { exportSave, importSave } from '../src/save/exportImport';
import { listBackups, pack, readMain, unpack, writeBackup, writeMain } from '../src/save/db';
import { claimDaily, canClaimDaily } from '../src/game/daily';
import { STARTER_HEROES } from '../src/data/heroes';

describe('sauvegarde', () => {
  it('nouvelle partie cohérente', () => {
    const s = createNewSave(1000);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.heroes.map((h) => h.heroId)).toEqual(STARTER_HEROES);
    expect(s.teams[0].slots.filter(Boolean)).toHaveLength(4);
    expect(s.teams[0].leader).toBe(s.heroes[0].uid);
  });

  it('export → import conserve toute la progression', () => {
    const s = createNewSave(1000);
    s.resources.gold = 123456;
    s.heroes[0].level = 17;
    s.progress.campaign['1-1'] = { stars: 3, clears: 4 };
    const back = importSave(exportSave(s));
    expect(back).toEqual(s);
  });

  it('refuse une sauvegarde modifiée ou tronquée', () => {
    const txt = exportSave(createNewSave());
    expect(() => importSave(txt.slice(0, txt.length - 20))).toThrow(SaveFormatError);
    expect(() => importSave('bonjour')).toThrow(SaveFormatError);
  });

  it('complète les champs manquants et nettoie les références invalides', () => {
    const s: any = createNewSave(1000);
    delete s.settings;
    delete s.progress.tower;
    s.heroes.push({ ...s.heroes[0], uid: 'ghost', heroId: 'inexistant' });
    s.teams[0].slots[4] = 'ghost';
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.settings.sound).toBe(true);
    expect(m.progress.tower.floor).toBe(0);
    expect(m.heroes.some((h) => h.uid === 'ghost')).toBe(false);
    expect(m.teams[0].slots[4]).toBeNull();
  });

  it('conserve les champs optionnels renseignés (ex. dernière connexion)', () => {
    const s = createNewSave(1000);
    s.daily.lastLoginDay = '2026-11-01';
    s.teams[1].leader = null;
    const m = migrateSave(JSON.parse(JSON.stringify(s)));
    expect(m.daily.lastLoginDay).toBe('2026-11-01');
    expect(m).toEqual(s);
  });

  it('refuse une sauvegarde d’une version future', () => {
    const s: any = createNewSave();
    s.version = SAVE_VERSION + 1;
    expect(() => migrateSave(s)).toThrow(/plus récente/);
  });

  it('détecte la corruption via l’empreinte', () => {
    const rec = pack('main', createNewSave());
    expect(unpack(rec)).not.toBeNull();
    expect(unpack({ ...rec, json: rec.json.replace('Héritier', 'Tricheur') })).toBeNull();
  });

  it('IndexedDB : écriture/lecture et rotation des copies de secours', async () => {
    const s = createNewSave(5000);
    await writeMain(s);
    const { idb } = await readMain();
    expect(unpack(idb)).toEqual(s);
    for (let i = 0; i < 9; i++) await writeBackup({ ...s, updatedAt: 6000 + i }, 'test', 6);
    const b = await listBackups();
    expect(b).toHaveLength(6);
    expect(b[0].savedAt).toBe(6008);
  });
});

describe('récompense quotidienne', () => {
  it('une seule fois par jour, même en reculant l’heure', () => {
    const s = createNewSave(0);
    const day1 = new Date(2026, 10, 1, 12).getTime();
    expect(canClaimDaily(s, day1)).toBe(true);
    const gold = s.resources.gold;
    expect(claimDaily(s, day1)).not.toBeNull();
    expect(s.resources.gold).toBe(gold + 5000);
    expect(claimDaily(s, day1 + 3600_000)).toBeNull();
    expect(claimDaily(s, day1 + 24 * 3600_000)).not.toBeNull();
    expect(s.daily.cycleIndex).toBe(2);
  });
});
