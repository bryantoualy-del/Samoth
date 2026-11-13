import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';

const root=process.cwd();
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const file=resolve(root,'.'+url.pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(root+'/'))throw Error('Out-of-root path');
  const data=await readFile(file);
  res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(file)]||'application/octet-stream');
  res.end(data);
 }catch{res.writeHead(404).end()}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const base='http://127.0.0.1:'+server.address().port;
const browserType=process.env.E2E_BROWSER==='webkit'?webkit:chromium;
let browser;
try{
 browser=await browserType.launch(browserType===webkit?{}:{executablePath:process.env.E2E_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 for(const width of [390,1180]){
  const page=await browser.newPage({viewport:{width,height:820}});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base);
  await page.waitForFunction(()=>window.__CompanionBridge?.id==='samoth');
  const initial=await page.evaluate(()=>{const s=window.__CompanionBridge.read();return{max:s.maxHp,hp:s.hp,slot6:s.slots?.[6],sp:s.sp,hitDice:s.hitDice,malachor:s.malachorStage}});
  assert.equal(initial.max,78,'Samoth level 11 has 78 maximum hit points');
  assert.equal(initial.hp,78,'fresh level 11 Samoth starts at full health');
  assert.equal(initial.slot6,1,'one level 6 spell slot');
  assert.equal(initial.sp,11,'eleven sorcery points');
  assert.equal(initial.hitDice,11,'eleven hit dice');
  assert.equal(initial.malachor,'dormant','Malachor starts dormant');

  await page.evaluate(()=>{
   const s=structuredClone(window.__CompanionBridge.read());
   s.hp=34;s.sp=5;s.slots[6]=0;s.notes='level11-e2e-preserved';
   localStorage.setItem('samoth-companion-v3',JSON.stringify(s));
  });
  await page.reload();await page.waitForFunction(()=>window.__CompanionBridge?.id==='samoth');
  const restored=await page.evaluate(()=>{const s=window.__CompanionBridge.read();return{hp:s.hp,max:s.maxHp,sp:s.sp,slot6:s.slots?.[6],notes:s.notes}});
  assert.equal(restored.max,78);
  assert.equal(restored.hp,34,'HP changes survive reload');
  assert.equal(restored.sp,5,'sorcery points survive reload');
  assert.equal(restored.slot6,0,'spent level 6 spell slot must not regenerate on reload');
  assert.equal(restored.notes,'level11-e2e-preserved');
  assert.deepEqual(errors,[],'no browser runtime errors');
  await page.close();
  const legacy=await browser.newPage({viewport:{width,height:820}});
  await legacy.goto(base);
  await legacy.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('samoth-v3',JSON.stringify({
      schema:3,hp:32,slots:{1:1,2:0,3:0,4:0,5:0},
      spCore:0,staff:0,round:3
    }));
  });
  await legacy.reload();await legacy.waitForFunction(()=>window.__CompanionBridge?.id==='samoth');
  const fromLegacy=await legacy.evaluate(()=>{const s=window.__CompanionBridge.read();return{hp:s.hp,max:s.maxHp,sp:s.sp,staff:s.staff,slot6:s.slots?.[6]}});
  assert.equal(fromLegacy.hp,38,'legacy level 10 damage is conserved when gaining 6 HP');
  assert.equal(fromLegacy.max,78);
  assert.equal(fromLegacy.sp,1,'legacy depleted sorcery points gain only the level-up point');
  assert.equal(fromLegacy.staff,2,'legacy depleted staff gains only the level-up charges');
  assert.equal(fromLegacy.slot6,1,'legacy character receives one level 6 slot');
  await legacy.close();
 }
 console.log('Samoth level 11 browser smoke passed',process.env.E2E_BROWSER||'chromium');
}finally{await browser?.close();await new Promise(ok=>server.close(ok))}
