// End-to-end checks for alexnorum.com. Builds nothing itself: run
// `npm run build` first, then `npm run e2e`. Serves dist/ on a local port,
// drives headless Chromium through both themes, and exits non-zero on failure.
//
// Movement in the RPG is input-deterministic: at ?rpg-speed=2 a 30ms key tap
// starts exactly one tile step, so positions are asserted with data-player-tile.

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4399;
const BASE = `http://localhost:${PORT}`;

let failures = 0;
function check(name, ok, extra = '') {
  if (ok) console.log(`  ok   ${name}`);
  else {
    failures++;
    console.log(`  FAIL ${name} ${extra}`);
  }
}

async function walk(page, key, times) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.down(key);
    await page.waitForTimeout(30);
    await page.keyboard.up(key);
    await page.waitForTimeout(170);
  }
}

async function tap(page, key) {
  await page.keyboard.down(key);
  await page.waitForTimeout(30);
  await page.keyboard.up(key);
  await page.waitForTimeout(120);
}

/** Press Enter through a dialog until it closes or a choice appears. */
async function advanceDialog(page, max = 12) {
  for (let i = 0; i < max; i++) {
    if (!(await page.locator('.rpgw-dialog').isVisible())) return;
    if (await page.locator('.rpgw-choices').isVisible()) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
}

/** Dismiss the one-time encounter intro and wait until the player can walk again. */
async function dismissIntro(page) {
  await page.waitForSelector('.rpgw-dialog', { timeout: 3000 }).catch(() => {});
  await advanceDialog(page);
  await page.waitForFunction(
    () => /ARROWS \/ WASD/.test(document.querySelector('.ow-help')?.textContent || ''),
    null,
    { timeout: 5000 }
  );
}

/** Interact with what the player is facing and advance until a window opens. */
async function openWindowAhead(page) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  for (let i = 0; i < 6 && !(await page.locator('.rpgw-window').isVisible()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
  }
}

const tile = (page) => page.getAttribute('.ow', 'data-player-tile');
const scene = (page) => page.getAttribute('.ow', 'data-scene');

async function teleport(page, sceneId) {
  await page.click('#ff7-menu-button');
  await page.click(`.ff7-menu-option[data-scene="${sceneId}"]`);
  await page.waitForTimeout(600);
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview server did not start');
}

const server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { stdio: 'ignore' });
try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  console.log('standard desktop light');
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    const rpgRequests = [];
    page.on('request', (r) => /Overworld|Battle/i.test(r.url()) && r.url().includes('_astro') && rpgRequests.push(r.url()));
    await page.goto(BASE, { waitUntil: 'networkidle' });

    check('hero h1', await page.locator('h1.display-type').isVisible());
    const eyebrows = await page.locator('section h2.eyebrow').allTextContents();
    const nums = eyebrows.map((t) => (t.trim().match(/^(\d\d) ·/) || [])[1]).filter(Boolean);
    check('sections are h2s numbered 01-06', JSON.stringify(nums) === JSON.stringify(['01', '02', '03', '04', '05', '06']), JSON.stringify(nums));
    check('5 what-i-do cards', (await page.locator('.card').count()) === 5);
    check('5 project cards', (await page.locator('.proj').count()) === 5);
    check('deprecated stamp', (await page.locator('.proj-status-deprecated').textContent()).trim() === 'Deprecated');
    check('pdx train links', (await page.locator('#projects a[href="https://pdxtrain.alexnorum.com"], #projects a[href="https://github.com/anorum/trainspotter"]').count()) === 2);
    check('sightread live link', (await page.locator('#projects a[href="https://sightread.alexnorum.com"]').count()) === 1);
    const bodyText = await page.evaluate(() => document.body.innerText);
    check('no em/en dashes in rendered text', !bodyText.includes('—') && !bodyText.includes('–'));
    check('legalzoom is past tense', !bodyText.includes('I run the team') && bodyText.includes('2023 - 2026'));
    check('creed present', /meet them where they are/i.test(bodyText));
    check('no job-status copy', !/open to staff|free agent/i.test(bodyText));
    check('no buzzwords', !/\b(leverage|synergy|passionate|thought leader|cutting-edge|world-class|empower|unlock|delve)\b/i.test(bodyText));
    check('analytics card present', /started (my career )?as an analyst/i.test(bodyText));
    check('new relic analyst arc', /lead data analyst/i.test(bodyText));
    check('standard visitors load zero RPG JS', rpgRequests.length === 0, rpgRequests.join(' '));

    const meta = await page.evaluate(() => ({
      og: document.querySelector('meta[property="og:image"]')?.content,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      jsonld: !!document.querySelector('script[type="application/ld+json"]'),
    }));
    check('open graph image set', /\/og\.png$/.test(meta.og || ''));
    check('canonical set', meta.canonical === 'https://alexnorum.com/');
    check('json-ld person schema', meta.jsonld);
    check('skip link present', (await page.locator('.skip-link').count()) === 1);

    // anchored sections must clear the sticky nav
    await page.click('nav a[href="#projects"]');
    await page.waitForTimeout(900);
    const top = await page.evaluate(() => document.getElementById('projects').getBoundingClientRect().top);
    const navH = await page.evaluate(() => document.querySelector('.site-nav').getBoundingClientRect().height);
    check('nav anchor clears sticky nav', top >= navH, `top ${Math.round(top)} nav ${navH}`);

    // reveal items must not carry page-wide inline delays
    const inlineDelays = await page.evaluate(() => [...document.querySelectorAll('.reveal-item')].filter((e) => e.style.getPropertyValue('--reveal-delay')).length);
    check('no inline reveal delays', inlineDelays === 0);

    // map: local geojson, all visited places painted (polygons + city-state markers)
    await page.locator('#travel').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelectorAll('.leaflet-overlay-pane path').length > 100, null, { timeout: 8000 });
    const painted = await page.evaluate(() => {
      const green = [...document.querySelectorAll('.leaflet-overlay-pane path')].filter((x) => (x.getAttribute('fill') || '').toLowerCase() === '#0d8a5f');
      return green.length;
    });
    check('12 visited places painted on map', painted === 12, `painted ${painted}`);
    check('no console errors', errors.length === 0, errors.join(' | ').slice(0, 300));
    await ctx.close();
  }

  console.log('standard mobile + 404');
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check('no horizontal scroll at 375px', !hScroll);
    const r = await page.goto(BASE + '/404.html');
    check('404 page renders', r.ok() && (await page.locator('h1').textContent()).includes('Nothing here'));
    await ctx.close();
  }

  console.log('rpg interiors');
  {
    // encounters off and intro seen: these checks walk fixed routes
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(() => { localStorage.setItem('site-theme', 'rpg'); localStorage.setItem('rpg-save', JSON.stringify({ v: 1, level: 5, exp: 0, gil: 0, inventory: { coffee: 2, runbook: 1 }, bossesBeaten: [], encounters: false, sound: false, seenIntro: true })); });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + '/?rpg-speed=2', { waitUntil: 'networkidle' });
    await page.waitForSelector('.ow', { timeout: 5000 });
    check('spawn 11,5 on world', (await tile(page)) === '11,5' && (await scene(page)) === 'world');

    await walk(page, 'ArrowRight', 3);
    check('walked right to 14,5', (await tile(page)) === '14,5', 'got ' + (await tile(page)));
    await walk(page, 'ArrowUp', 3);
    check('tree blocks at 14,4', (await tile(page)) === '14,4', 'got ' + (await tile(page)));

    // house: mirror window, mara dialog, exit through the door
    await teleport(page, 'house');
    check('teleported into house', (await scene(page)) === 'house' && (await tile(page)) === '5,6');
    await walk(page, 'ArrowLeft', 3);
    await walk(page, 'ArrowUp', 4);
    await tap(page, 'ArrowUp');
    check('mirror prompt', ((await page.locator('.ow-prompt-btn').textContent()) || '').includes('MIRROR'));
    await openWindowAhead(page);
    const statusText = await page.locator('.rpgw-window').innerText();
    check('status shows the real level', /LV \d+/.test(statusText) && !statusText.includes('LV 99'));
    check('status has party row, no guild', statusText.includes('PARTY') && !statusText.includes('FREE AGENT'));
    check('status shows gil and bosses', /GIL/.test(statusText) && /BOSSES/.test(statusText));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await walk(page, 'ArrowDown', 3);
    await walk(page, 'ArrowRight', 5);
    await tap(page, 'ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    check('mara dialog has speaker', (await page.locator('.rpgw-dialog').innerText()).includes('MARA'));
    await advanceDialog(page);
    check('mara offers to keep watch', await page.locator('.rpgw-choices').isVisible());
    await page.keyboard.press('Enter'); // KEEP WATCH
    await page.waitForTimeout(300);
    await advanceDialog(page);
    check('mara dialog ends', !(await page.locator('.rpgw-dialog').isVisible()));
    check('keep watch turns encounters off', (await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')).encounters)) === false);
    await walk(page, 'ArrowLeft', 2);
    await walk(page, 'ArrowDown', 2);
    check('leave prompt on mat', ((await page.locator('.ow-prompt-btn').textContent()) || '').includes('LEAVE'));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    check('back on world at house door', (await scene(page)) === 'world' && (await tile(page)) === '3,4');

    // hall: board window and receptionist choice
    await walk(page, 'ArrowRight', 7);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    check('inside hall', (await scene(page)) === 'hall');
    await walk(page, 'ArrowRight', 1);
    await walk(page, 'ArrowUp', 4);
    await tap(page, 'ArrowUp');
    await openWindowAhead(page);
    const questText = await page.locator('.rpgw-window').innerText();
    check('quest log shows head of data platform', /head of data platform/i.test(questText));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await walk(page, 'ArrowDown', 1);
    await walk(page, 'ArrowLeft', 3);
    await tap(page, 'ArrowLeft');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    let sawOpenToQuests = false;
    for (let i = 0; i < 8 && !(await page.locator('.rpgw-choices').isVisible()); i++) {
      if (/open to new quests/i.test(await page.locator('.rpgw-dialog').innerText())) sawOpenToQuests = true;
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
    }
    check('receptionist choice shown', await page.locator('.rpgw-choices').isVisible());
    check('receptionist has no job-status line', !sawOpenToQuests);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    check('choice opens quest log', await page.locator('.rpgw-window').isVisible());
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // tower: abilities window (no levels)
    await teleport(page, 'tower');
    await walk(page, 'ArrowRight', 3);
    await walk(page, 'ArrowUp', 3);
    await tap(page, 'ArrowUp');
    await openWindowAhead(page);
    const abilityText = await page.locator('.rpgw-window').innerText();
    check('abilities show PAVED ROAD and SENSE', abilityText.includes('PAVED ROAD') && abilityText.includes('SENSE'));
    check('no mastery percentages', !/\d+%/.test(abilityText));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // dojo: level-free materia
    await teleport(page, 'dojo');
    await walk(page, 'ArrowLeft', 3);
    await walk(page, 'ArrowUp', 4);
    await tap(page, 'ArrowUp');
    await openWindowAhead(page);
    const materiaText = await page.locator('.rpgw-window').innerText();
    check('core materia lists snowflake', /snowflake/i.test(materiaText));
    check('no levels in materia', !/LV\.?\s?\d|\d+%/.test(materiaText));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // shop: shopkeeper choice -> shop window
    await teleport(page, 'shop');
    await walk(page, 'ArrowRight', 1);
    await walk(page, 'ArrowUp', 3);
    await tap(page, 'ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await advanceDialog(page);
    check('shopkeeper choice shown', await page.locator('.rpgw-choices').isVisible());
    await page.keyboard.press('Enter'); // BROWSE WARES
    await page.waitForTimeout(300);
    check('5 shop items', (await page.locator('.rpgsh-item[data-project]').count()) === 5);
    check('broken mara-bot row', (await page.locator('.rpgsh-item.broken').count()) === 1);
    await page.click('.rpgsh-item[data-project="pdx-train"]');
    check('shop live link', (await page.locator('.rpgsh-links a[href="https://pdxtrain.alexnorum.com"]').count()) === 1);
    await page.click('.rpgsh-tab:has-text("BUY")');
    check('buy tab lists items with gil readout', (await page.locator('.rpgsh-item[data-item]').count()) === 4 && /GIL \d+/.test(await page.locator('[data-testid="shop-gil"]').innerText()));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // camp: crafts window
    await teleport(page, 'camp');
    await walk(page, 'ArrowUp', 2);
    await tap(page, 'ArrowUp');
    await openWindowAhead(page);
    const craftsText = await page.locator('.rpgw-window').innerText();
    check('crafts include piano and 3-woods', /piano/i.test(craftsText) && /3-woods/.test(craftsText));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // harbor: leaflet chart mounts inside the window
    await teleport(page, 'harbor');
    await walk(page, 'ArrowRight', 3);
    await walk(page, 'ArrowUp', 4);
    await tap(page, 'ArrowUp');
    await openWindowAhead(page);
    await page.waitForTimeout(1500);
    const mapBox = await page.locator('.rpgw-window .leaflet-container').boundingBox();
    check('leaflet map mounted with height', !!mapBox && mapBox.height > 100);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // arena: gatekeeper hands off to the battle section
    await teleport(page, 'world');
    await walk(page, 'ArrowDown', 4);
    await walk(page, 'ArrowRight', 7);
    check('at arena door 18,9', (await tile(page)) === '18,9', 'got ' + (await tile(page)));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    check('inside arena', (await scene(page)) === 'arena');
    await walk(page, 'ArrowUp', 3);
    await tap(page, 'ArrowUp');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await advanceDialog(page);
    check('gatekeeper lists bosses', (await page.locator('.rpgw-choice').count()) === 5);
    await page.keyboard.press('Enter'); // ON-PREM TITAN
    await page.waitForTimeout(400);
    check('boss battle renders in frame', (await page.locator('.ow-frame [data-testid="battle-view"]').count()) === 1);
    await page.waitForSelector('[data-testid="battle-view"][data-phase="select"]', { timeout: 8000 });
    check('turn strip has eight slots', (await page.locator('.rpgb-strip-slot').count()) === 8);
    check('no RUN against a boss', (await page.locator('.rpgb-cmd[data-cmd="RUN"]').count()) === 0);
    check('boss battle is flagged as boss', (await page.getAttribute('[data-testid="battle-view"]', 'data-kind')) === 'boss');
    check('menu clock is running', /\d:\d\d:\d\d/.test((await page.locator('#ff7-clock').textContent()) || ''));
    check('no rpg page errors', errors.length === 0, errors.join(' | ').slice(0, 300));
    await ctx.close();
  }

  console.log('random encounters');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(() => localStorage.setItem('site-theme', 'rpg'));
    const page = await ctx.newPage();
    await page.goto(BASE + '/?rpg-speed=2&rpg-seed=7', { waitUntil: 'networkidle' });
    await page.waitForSelector('.ow');
    check('encounter intro shown on first visit', await page.locator('.rpgw-dialog').isVisible());
    await advanceDialog(page);
    check('intro is recorded in the save', (await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')).seenIntro)) === true);
    const inBattle = async () => (await page.locator('[data-testid="battle-view"]').count()) > 0;

    let fought = false;
    for (let i = 0; i < 80 && !fought; i++) {
      await walk(page, i % 2 ? 'ArrowRight' : 'ArrowLeft', 1);
      fought = await inBattle();
    }
    check('random encounter triggers with seed 7', fought);
    await page.waitForSelector('[data-testid="battle-view"][data-phase="select"]', { timeout: 8000 });
    check('random battle is flagged as random', (await page.getAttribute('[data-testid="battle-view"]', 'data-kind')) === 'random');
    await page.click('.rpgb-cmd[data-cmd="RUN"]');
    // park the mouse off the menu: hover sets the cursor, and a stale pointer
    // would keep re-selecting whatever row sits under it in the next fight
    await page.mouse.move(0, 0);
    await page.waitForSelector('[data-testid="battle-view"][data-phase="fled"]', { timeout: 8000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    check('back to walking after fleeing', !(await inBattle()) && (await scene(page)) === 'world');

    await page.keyboard.press('e');
    await page.waitForTimeout(100);
    check('help line shows encounters off', /ENCOUNTERS OFF/.test(await page.locator('.ow-help').innerText()));
    let quiet = true;
    for (let i = 0; i < 60; i++) {
      await walk(page, i % 2 ? 'ArrowRight' : 'ArrowLeft', 1);
      if (await inBattle()) quiet = false;
    }
    check('no encounters while off', quiet);
    check('save persists the toggle', (await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')).encounters)) === false);

    await page.click('#ff7-menu-button');
    await page.click('.ff7-menu-option:has([data-encounters-label])');
    await page.waitForTimeout(200);
    check('menu toggle turns encounters on', (await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')).encounters)) === true);
    check('menu label mirrors the flag', /ENCOUNTERS: ON/.test(await page.locator('[data-encounters-label]').innerText()));

    // fight one out with plain attacks
    fought = false;
    for (let i = 0; i < 80 && !fought; i++) {
      await walk(page, i % 2 ? 'ArrowRight' : 'ArrowLeft', 1);
      fought = await inBattle();
    }
    check('second encounter triggers', fought);
    // the MENU clicks leave the pointer where the command window will render;
    // hover sets the cursor, so park it before driving the fight by keyboard
    await page.mouse.move(0, 0);
    let outcome = null;
    const deadline = Date.now() + 60000;
    while (Date.now() < deadline) {
      const phase = await page.getAttribute('[data-testid="battle-view"]', 'data-phase').catch(() => null);
      if (!phase) break;
      if (phase === 'victory' || phase === 'defeat' || phase === 'fled') { outcome = phase; break; }
      if (phase === 'select' || phase === 'target') { await page.keyboard.press('Enter'); await page.waitForTimeout(120); }
      else await page.waitForTimeout(150);
    }
    check('fight resolves', outcome === 'victory' || outcome === 'defeat', 'outcome ' + outcome);
    if (outcome === 'victory') {
      check('results show exp', /EXP/.test(await page.locator('.rpgb-result').innerText()));
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const after = await page.evaluate(() => JSON.parse(localStorage.getItem('rpg-save')));
      check('exp and gil saved after victory', after.exp > 0 && after.gil > 0);
    }
    await ctx.close();
  }

  console.log('rpg mobile touch');
  {
    const ctx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    await ctx.addInitScript(() => { localStorage.setItem('site-theme', 'rpg'); localStorage.setItem('rpg-save', JSON.stringify({ v: 1, level: 5, exp: 0, gil: 0, inventory: { coffee: 2, runbook: 1 }, bossesBeaten: [], encounters: false, sound: false, seenIntro: true })); });
    const page = await ctx.newPage();
    await page.goto(BASE + '/?rpg-speed=2', { waitUntil: 'networkidle' });
    await page.waitForSelector('.ow', { timeout: 5000 });
    check('d-pad visible on touch device', await page.locator('.ow-dpad').isVisible());
    const before = await tile(page);
    const btn = page.locator('.ow-dpad-btn[aria-label="Move right"]');
    await btn.dispatchEvent('pointerdown', { pointerId: 1 });
    await page.waitForTimeout(120);
    await btn.dispatchEvent('pointerup', { pointerId: 1 });
    await page.waitForTimeout(200);
    check('d-pad tap moves player', before !== (await tile(page)));
    await ctx.close();
  }

  console.log('rpg mobile battle layout');
  {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 664 },
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 3,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    await ctx.addInitScript(() => { localStorage.setItem('site-theme', 'rpg'); localStorage.setItem('rpg-save', JSON.stringify({ v: 1, level: 5, exp: 0, gil: 0, inventory: { coffee: 2, runbook: 1 }, bossesBeaten: [], encounters: false, sound: false, seenIntro: true })); });
    const page = await ctx.newPage();
    await page.goto(BASE + '/?rpg-speed=2', { waitUntil: 'networkidle' });
    await page.waitForSelector('.ow');
    await teleport(page, 'arena');
    const tapAt = async (sel) => { const bb = await page.locator(sel).first().boundingBox(); await page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); };
    for (let i = 0; i < 3; i++) { await tapAt('.ow-dpad-btn[aria-label="Move up"]'); await page.waitForTimeout(220); }
    await tapAt('.ow-dpad-btn[aria-label="Move up"]'); await page.waitForTimeout(150);
    for (let i = 0; i < 6 && !(await page.locator('.rpgw-choices').isVisible()); i++) { await tapAt('.ow-a-btn'); await page.waitForTimeout(250); }
    await tapAt('.ow-a-btn');
    await page.waitForSelector('[data-testid="battle-view"][data-phase="select"]', { timeout: 8000 });
    const field = await page.locator('.rpgb-field').boundingBox();
    const enemy = await page.locator('.rpgb-enemy-card').first().boundingBox();
    const cmd = await page.locator('.rpgb-cmd').first().boundingBox();
    check('mobile battle field has room for fighters', !!field && field.height >= 120, `field ${field && Math.round(field.height)}px`);
    check('mobile enemy card is visible', !!enemy && enemy.height >= 40, `enemy ${enemy && Math.round(enemy.height)}px`);
    check('mobile command rows are thumb-sized', !!cmd && cmd.height >= 40, `cmd ${cmd && Math.round(cmd.height)}px`);
    const noHScroll = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    check('mobile battle does not overflow horizontally', noHScroll);
    // choose ATTACK by tapping it, then tap the enemy card to confirm the target
    await tapAt('.rpgb-cmd'); await page.waitForTimeout(250);
    check('tapping a command reaches target phase', (await page.getAttribute('[data-testid="battle-view"]', 'data-phase')) === 'target');
    await tapAt('.rpgb-enemy-card'); await page.waitForTimeout(250);
    check('tapping the enemy confirms the target', (await page.getAttribute('[data-testid="battle-view"]', 'data-phase')) === 'resolving');
    await ctx.close();
  }

  console.log('reduced motion');
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { localStorage.setItem('site-theme', 'rpg'); localStorage.setItem('rpg-save', JSON.stringify({ v: 1, level: 5, exp: 0, gil: 0, inventory: { coffee: 2, runbook: 1 }, bossesBeaten: [], encounters: false, sound: false, seenIntro: true })); });
    const page = await ctx.newPage();
    await page.goto(BASE + '/?rpg-speed=2', { waitUntil: 'networkidle' });
    await page.waitForSelector('.ow', { timeout: 5000 });
    await walk(page, 'ArrowRight', 2);
    check('player moves under reduced motion', (await tile(page)) === '13,5', 'got ' + (await tile(page)));
    await ctx.close();
  }

  await browser.close();
} finally {
  server.kill();
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
