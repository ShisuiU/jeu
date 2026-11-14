// PARCOURS DE FUMÉE (v1.102.1) — ouvre le jeu publié en local (vite preview) dans un vrai navigateur et visite
// tous les écrans avec une partie avancée : aucun écran ne doit planter (« Un imprévu dans la Fracture… »)
// ni lever d'erreur. Lancé par la vérification GitHub avant chaque fusion : un écran cassé bloque la mise en ligne.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4179;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const stop = (code) => { server.kill(); process.exit(code); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];

try {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { try { up = (await fetch(`http://localhost:${PORT}/`)).ok; } catch { await wait(500); } }
  if (!up) throw new Error('le serveur local ne démarre pas');
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })).newPage();
  page.on('pageerror', (e) => failures.push(`erreur : ${e.message}`));
  await page.goto(`http://localhost:${PORT}/?qa`);
  await page.waitForFunction(() => !!window.__game?.getState().save, null, { timeout: 30000 });
  // Partie avancée : tous les modes ouverts, tutoriels passés, ressources et équipement.
  await page.evaluate(() => {
    const g = window.__game.getState();
    g.mutate((d) => {
      d.flags.guide_done = true; d.flags.tutorial_done = true;
      for (const f of ['guild', 'camp', 'expeditions', 'events', 'market', 'dungeons', 'worldboss', 'arena', 'tower']) d.flags[`unl_${f}`] = true;
      for (const k of Object.keys(d.resources)) if (k !== 'crystals') d.resources[k] = 5000;
      d.progress.tower.floor = 20; d.profile.name = 'Fumée';
    });
  });
  await page.addLocatorHandler(page.locator('.coach-bubble'), async () => { await page.locator('.coach-bubble button').last().click(); });
  await page.waitForSelector('text=TOUCHER POUR COMMENCER'); await page.click('.title-screen'); await wait(900);
  for (let k = 0; k < 6; k++) { if (!(await page.$('.modal'))) break; await page.locator('.modal-x').first().click().catch(() => {}); await wait(250); }
  const uid = await page.evaluate(() => window.__game.getState().save.heroes[0].uid);
  const heroId = await page.evaluate(() => window.__game.getState().save.heroes[0].heroId);
  const routes = ['home', 'collection', 'team', 'inventory', 'menu', 'daily', 'settings', 'saves', 'codex', 'campaign', 'summon', 'gear', 'mail',
    'combats', 'dungeons', 'tower', 'worldboss', 'arena', 'missions', 'events', 'expeditions', 'market', 'camp', 'buildings', 'factionDungeon',
    'wheel', 'profile', 'guild', 'ranks', 'friends', 'rifts'].map((name) => ({ name }));
  routes.push({ name: 'hero', heroId, uid }, { name: 'sanctuary', uid }, { name: 'prep', spec: { mode: 'tower', floor: 21 } });
  for (const r of routes) {
    await page.evaluate((r) => { const u = window.__ui.getState(); u.tab('home'); if (r.name !== 'home') u.push(r); }, r);
    await wait(500);
    if (await page.locator('text=Un imprévu dans la Fracture').count()) failures.push(`écran en erreur : ${r.name}`);
    for (const id of ['gold', 'shardEpic', 'potionMinor']) { await page.evaluate((id) => window.__ui.getState().openSources(id), id); await wait(60); await page.evaluate(() => window.__ui.getState().closeSources()); }
  }
  // Un combat complet (Tour, automatique, ×3) jusqu'à l'écran de résultat.
  await page.evaluate(() => { window.__game.getState().mutate((d) => { d.settings.autoBattleDefault = true; d.settings.battleSpeed = 3; d.settings.reducedMotion = true; }); const u = window.__ui.getState(); u.tab('home'); u.push({ name: 'battle', spec: { mode: 'tower', floor: 1 }, teamId: window.__game.getState().save.activeTeamId, seed: 1 }); });
  let done = false;
  for (let i = 0; i < 120 && !done; i++) { await wait(500); done = (await page.locator('text=Victoire').count()) + (await page.locator('text=Défaite').count()) > 0; }
  if (!done) { failures.push('le combat ne se termine pas'); await page.screenshot({ path: 'smoke-fail.png' }).catch(() => {}); }
  if (await page.locator('text=Un imprévu dans la Fracture').count()) failures.push('écran en erreur : combat');
  await browser.close();
} catch (e) {
  failures.push(`parcours interrompu : ${e instanceof Error ? e.message : e}`);
}
if (failures.length) { console.error('PARCOURS DE FUMÉE : ÉCHEC\n' + failures.map((f) => ' - ' + f).join('\n')); stop(1); }
console.log('Parcours de fumée : 34 écrans et un combat, aucun plantage.');
stop(0);
