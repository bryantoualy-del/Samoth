import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = resolve(process.env.SAMOTH_TEST_ROOT || '.');
const engine = process.env.E2E_BROWSER === 'webkit' ? webkit : chromium;
const executablePath = process.env.E2E_CHROMIUM_EXECUTABLE;
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp' };
const server = createServer(async (request, response) => {
  const file = resolve(root, '.' + new URL(request.url, 'http://localhost').pathname.replace(/\/$/, '/index.html'));
  try {
    if (!file.startsWith(root + '/')) throw Error('Path outside test root');
    const data = await readFile(file);
    response.writeHead(200, { 'Content-Type':types[extname(file)] || 'application/octet-stream' }).end(data);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = 'http://127.0.0.1:' + server.address().port;
const folder = process.env.SAMOTH_SCREENSHOTS || 'artifacts/companion-v2';
const baseline = process.env.SAMOTH_CAPTURE_BASELINE === '1';
const layout = [
  ['ipad-landscape',1180,820], ['ipad-zoom-125',944,656],
  ['iphone-portrait',390,844], ['iphone-landscape',844,390]
];
const state = page => page.evaluate(() => window.__CompanionBridge.read());
const tab = (page,id) => page.locator(`[data-mobile-view="${id}"],[data-desktop-group="${id}"]`).filter({visible:true}).first().click();
const choose = (page,id) => page.locator('#combatSpell').selectOption(id);
const cast = page => page.locator('#combatCast').click();
const next = page => page.evaluate(() => window.__CompanionBridge.commands.nextTurn());
const confirm = (page,label) => page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();
let browser;
try {
  browser = await engine.launch(engine === chromium ? { executablePath, args:['--no-sandbox','--disable-dev-shm-usage'] } : {});
  await mkdir(folder,{recursive:true});
  for (const [profile,width,height] of layout) {
    const page = await browser.newPage({viewport:{width,height},hasTouch:true,deviceScaleFactor:1});
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.goto(url);
    await page.locator('#cc-turnbar-standard').waitFor({state:'attached'});
    const combat = await page.locator('#malachorCombat').boundingBox();
    if (!baseline && profile.startsWith('ipad')) {
      const launch = await page.locator('#combatCast').boundingBox();
      assert.ok(launch.y+launch.height <= height, profile+' combat launch above fold');
      assert.ok(combat.height <= 120, profile+' Malachor compact');
    }
    await page.screenshot({path:`${folder}/${engine.name()}-${profile}-combat.png`});
    await tab(page,'powers');
    await page.locator('.samoth-book-list').waitFor();
    if (!baseline) {
      assert.ok(await page.locator('#bookCastHome #combatCast').isVisible());
      const size=await page.evaluate(()=>({viewport:innerWidth,body:document.documentElement.scrollWidth}));
      assert.ok(size.body<=size.viewport+1,profile+' no page overflow');
      const paths=await page.locator('.samoth-book-list img').evaluateAll(imgs=>imgs.map(img=>img.getAttribute('src')));
      assert.equal(new Set(paths).size,paths.length,profile+' unique catalogue glyphs');
      assert.equal(paths.length,19);
    }
    await page.screenshot({path:`${folder}/${engine.name()}-${profile}-grimoire.png`});
    assert.deepEqual(errors,[]);
    console.log(engine.name(),profile,'Malachor height',Math.round(combat.height));
    await page.close();
  }
  if (!baseline) {
    const page = await browser.newPage({viewport:{width:1180,height:820}});
    await page.goto(url);
    await page.locator('#manual').fill('12');
    await cast(page);await confirm(page,'Touché');
    assert.ok((await state(page)).turnDamage>=7);
    assert.equal((await state(page)).malachorTriggerRound,0);
    await next(page);
    await page.locator('#manual').fill('8');
    await cast(page);await confirm(page,'Raté');
    assert.equal((await state(page)).turnDamage,0);
    await next(page);
    await tab(page,'powers');
    await page.locator('#samothSpellSearch').fill('desintegration');
    await page.locator('[data-samoth-book-select="disintegrate"]').click();
    assert.match(await page.locator('.samoth-book-detail a').getAttribute('href'),/aidedd\.org\/dnd\/sorts\.php\?vf=desintegration$/);
    await page.locator('#spellList [data-meta="empower"]').click();
    await page.locator('#combatCast').evaluate(button=>{button.click();button.click();});
    assert.equal((await state(page)).slots[6],0);
    assert.equal((await state(page)).sp,10);
    assert.equal((await state(page)).history.filter(entry=>entry.title==='Désintégration').length,1);
    await page.locator('.disintegration-fx').waitFor();
    assert.equal(await page.locator('#companion-result-focus').isVisible(),false);
    await tab(page,'combat');
    await page.locator('.disintegration-fx').waitFor({state:'detached'});
    await page.locator('#companion-result-focus').waitFor();
    assert.ok((await state(page)).turnDamage>=50);
    assert.equal(await page.locator('.cc-turn-action.is-used').count(),1);
    await page.locator('#malachorSave').selectOption('success');
    await page.locator('[data-malachor="push"]').click();
    assert.equal((await state(page)).malachorUses,2);
    assert.equal(await page.locator('.cc-turn-bonus.is-used').count(),1);
    await next(page);
    await page.locator('[data-malachor="thoughts"]').click();
    assert.equal((await state(page)).concentration,'Détection des pensées');
    await page.reload();
    await page.locator('.cc-turn-conc[data-rpg-economy-glow="concentration"]').waitFor();
    assert.equal((await state(page)).malachorStage,'awakened');
    assert.equal((await state(page)).malachorThoughts,0);
    assert.equal(await page.locator('#combatSpell').inputValue(),'disintegrate');
    await page.locator('.cc-turn-rest').first().click();await confirm(page,'Confirmer le repos court');
    assert.equal((await state(page)).slots[6],0);
    await page.locator('.cc-turn-rest').last().click();await confirm(page,'Confirmer le repos long');
    assert.equal((await state(page)).slots[6],1);
    assert.equal((await state(page)).malachorUses,3);
    await page.emulateMedia({reducedMotion:'reduce'});
    await choose(page,'disintegrate');
    await page.locator('[data-cast-field="disintegrationSave"]').selectOption('success');
    await cast(page);
    assert.equal(await page.locator('.disintegration-fx').count(),0);
    assert.match(await page.locator('#companion-result-focus').innerText(),/JdS DEX réussi/);
    assert.equal((await state(page)).turnDamage,0);
    await next(page);
    await page.evaluate(()=>{
      const s=window.__CompanionBridge.read();
      s.slots[6]=1;window.__CompanionBridge.healthRefresh();
      window.__saveRequests=[];
      window.RPGConnect={
        getStatus:()=>({controlled:true,target:{id:'test',name:'Cible de recette'}}),
        requestSave:payload=>{window.__saveRequests.push(payload);return true;}
      };
    });
    await choose(page,'rayon');await choose(page,'disintegrate');
    await page.locator('#combatCast').evaluate(button=>{button.click();button.click();});
    const requests=await page.evaluate(()=>window.__saveRequests);
    assert.equal(requests.length,1);
    assert.equal(requests[0].ability,'DEX');assert.equal(requests[0].halfOnSuccess,false);
    assert.equal((await state(page)).slots[6],0);
    assert.equal((await state(page)).malachorTriggerRound,0);
    await page.evaluate(()=>{
      const api=window.CompanionAPI;
      api.emitLocal('save:request',{saveId:'v2-save',spellLevel:6});
      api.emitLocal('save:result',{saveId:'v2-save',targetId:'test',resolutionId:'v2-result',effectiveDamage:60});
      api.emitLocal('save:result',{saveId:'v2-save',targetId:'test',resolutionId:'v2-result',effectiveDamage:60});
    });
    const resolved=await state(page);
    assert.equal(resolved.malachorTriggerRound,resolved.round);
    assert.equal(resolved.turnDamage,60,'effective network damage is credited once');
    await page.close();
    console.log(engine.name(),'Rayon, Désintégration, FX, métamagie, concentration, repos, Malachor et envoi RPG Connect simulé');
  }
} finally {
  await browser?.close();
  await new Promise(done=>server.close(done));
}
