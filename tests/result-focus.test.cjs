const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'companion-result-card.js'),'utf8');
const ctx={module:{exports:{}}};vm.runInNewContext(source,ctx);
const {read}=ctx.module.exports;
test('damage magnitude and type remain announced, not applied',()=>{assert.equal(read('22 dégâts contondants').damage,22);assert.equal(read('Dégâts : 31 · 18 tranchants').damage,31);assert.equal(read('32 feu bruts').damage,32)});
test('mixed typed damage sums separately stated components',()=>{assert.equal(read('22 contondants + 8 radiants').damage,30);assert.equal(read('11 PV temporaires').heal,null)});
test('healing never confused with damage',()=>{const v=read('Soins reçus : +12 PV');assert.equal(v.heal,12);assert.equal(v.damage,null);assert.equal(read('Khar-Vek : 18 PV').heal,18)});
test('d20 total extracted instead of natural d20',()=>{assert.equal(read('Jet : 18 + 9 = 27 · Touché').roll,27);assert.equal(read('attaque 18+9 = 27').roll,27)});
test('potential semantics and irrelevant messages',()=>{assert.equal(read('Dégâts potentiels : 25').potential,true);assert.equal(read('Pas de ressource disponible').hasValue,false)});
test('presentation links are isolated from journal code',()=>{const h=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(h,/companion-result-card\.js\?v=[\w-]+/);assert.match(h,/companion-result-card\.css\?v=[\w-]+/);assert.match(h,/CompanionResultFocusConfig/);});


test('temporary DOM card displays amounts and closes without editing any history',()=>{
 let mutation,reveal;
 class Node{
  constructor(){this.children=[];this.textContent='';this.hidden=false;this.parentElement=null;this.className='';}
  append(...nodes){this.children.push(...nodes)}
  appendChild(node){this.children.push(node);return node}
  replaceChildren(...nodes){this.children=[...nodes]}
  setAttribute(){}
  closest(){return null}
 }
 const sourceNode=new Node();sourceNode.textContent='Prêt';sourceNode.parentElement=new Node();
 const title=new Node();title.textContent='Frappe';
 const body=new Node();
 const doc={readyState:'complete',body,querySelector:selector=>selector==='#source'?sourceNode:selector==='#title'?title:null,createElement:()=>new Node(),addEventListener(){}};
 const w={document:doc,CompanionResultFocusConfig:{name:'Essai',sources:['#source'],labels:['#title']},setTimeout:(callback)=>{reveal=callback;return 1},clearTimeout:()=>{}};
 vm.runInNewContext(source,{window:w,document:doc,Date,MutationObserver:class{constructor(callback){mutation=callback}observe(){}}});
 sourceNode.textContent='Jet : 18 + 9 = 27 · 22 dégâts';mutation();
 assert.equal(body.children.length,1);const popup=body.children[0];
 assert.equal(popup.hidden,true);reveal();assert.equal(popup.hidden,false);
 const blocks=popup.children[2].children;
 assert.equal(blocks.length,2);assert.equal(blocks[0].children[1].textContent,'27');assert.equal(blocks[1].children[1].textContent,'22');
 w.CompanionResultFocus.hide();assert.equal(popup.hidden,true);
});

test('universal typed damage palette and bilingual normalization',()=>{
 const {semanticColors,normalizeType}=ctx.module.exports;
 assert.equal(semanticColors.fire,'#FF6538');
 assert.equal(semanticColors.healing,'#34D399');
 assert.equal(semanticColors.temporary,'#38BDF8');
 assert.equal(semanticColors.attack,'#E5B963');
 assert.equal(normalizeType('nécrotiques'),'necrotic');
 assert.equal(normalizeType('contondants'),'bludgeoning');
 assert.equal(normalizeType('lightning'),'lightning');
 const mixed=read('22 contondants + 8 radiants');
 assert.equal(mixed.parts.length,2);
 assert.equal(mixed.parts[0].amount,22);
 assert.equal(mixed.parts[0].type,'bludgeoning');
});
test('temporary HP remains distinct from healing and social roll is excluded',()=>{
 const {isSocial}=ctx.module.exports;
 const temporary=read('11 PV temporaires');
 assert.equal(temporary.temp,11);
 assert.equal(temporary.heal,null);
 assert.equal(isSocial('Persuasion'),true);
 assert.equal(isSocial('Jet social'),true);
 assert.equal(isSocial('Sauvegarde Constitution'),false);
});
test('results never infer a past d20 roll from click history',()=>{
 assert.doesNotMatch(source,/previousRoll|captureRoll/);
});

test('structured actual dice, typed mixed damage, one display per event, social exemption',()=>{
 class Node {
  constructor(){this.children=[];this.textContent='';this.hidden=false;this.parentElement=null;this.className='';this.style={setProperty(){}};this.classList={add(){}};}
  append(...n){this.children.push(...n)}
  appendChild(n){this.children.push(n);return n}
  replaceChildren(...n){this.children=[...n]}
  setAttribute(){}
  closest(){return null}
 }
 const root=new Node(),doc={readyState:'complete',body:root,querySelector:()=>null,createElement:()=>new Node(),addEventListener(){}};
 const w={document:doc,CompanionResultFocusConfig:{name:'Test',sources:['#missing']},setTimeout:()=>1,clearTimeout:()=>{}};
 vm.runInNewContext(source,{window:w,document:doc,Date,MutationObserver:class{}});
 const api=w.CompanionResultFocus;
 const action={eventId:'attack-001',title:'PyroMerlin',attack:{dice:[9],bonus:4,total:13},
  damages:[{type:'contondants',formula:'1d10',dice:[8],bonus:7,amount:15},{type:'feu',formula:'2d8',dice:[8,9],amount:17}]};
 assert.equal(api.showStructured(action),true);
 const card=root.children[0],items=card.children[2].children;
 assert.equal(items.length,3);
 assert.equal(items[0].children[1].textContent,'13');
 assert.match(items[0].children[2].textContent,/\[9\]/);
 assert.equal(items[1].children[1].textContent,'15');
 assert.match(items[2].children[2].textContent,/\[8, 9\]/);
 assert.equal(api.showStructured(action),false);
 assert.equal(api.showStructured({...action,eventId:'social-002',domain:'social'}),false);
 assert.equal(card.children[2].children.length,3);
 assert.equal(api.showStructured({eventId:'heal-003',title:'Khar-Vek',heals:[{kind:'healing',formula:'3d8',dice:[5,6,8],bonus:5,amount:24},{kind:'temporary',amount:11}]}),true);
 assert.equal(card.children[2].children[0].children[1].textContent,'24');
 assert.equal(card.children[2].children[1].children[1].textContent,'11');
});

test('later ribbon observer cannot overwrite structured result for the same action',()=>{
 let mutation;
 class Node {
  constructor(){this.children=[];this.textContent='';this.parentElement=null;this.hidden=false;this.className='';this.style={setProperty(){}};this.classList={add(){}};}
  append(...nodes){this.children.push(...nodes)}
  appendChild(node){this.children.push(node);return node}
  replaceChildren(...nodes){this.children=[...nodes]}
  setAttribute(){}
  closest(){return null}
 }
 const root=new Node(),sourceNode=new Node(),titleNode=new Node();
 sourceNode.textContent='Initial';sourceNode.parentElement=new Node();titleNode.textContent='Action';
 const doc={readyState:'complete',body:root,createElement:()=>new Node(),addEventListener(){},querySelector:selector=>selector==='#raw'?sourceNode:selector==='#title'?titleNode:null};
 const w={document:doc,CompanionResultFocusConfig:{sources:['#raw'],labels:['#title']},setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(source,{window:w,Date,MutationObserver:class{constructor(cb){mutation=cb}observe(){}}});
 sourceNode.textContent='24 PV récupérés';
 assert.equal(w.CompanionResultFocus.showStructured({eventId:'heal-123',title:'Khar-Vek',heals:[{kind:'healing',amount:24,formula:'3d8',dice:[5,6,8],bonus:5}]}),true);
 mutation(); // MutationObserver callback arrives after the structured render.
 const card=root.children[0];
 assert.equal(card.children[2].children[0].children[1].textContent,'24');
 assert.equal(card.children[2].children[0].children[2].textContent,'3d8 · [5, 6, 8] · Bonus +5');
 sourceNode.textContent='Jet : 9 + 4 = 13';
 mutation(); // Different action without structured payload still has legacy fallback.
 assert.equal(card.children[2].children[0].children[1].textContent,'13');
});

test('Samoth heals display actual dice after accepted resolution',()=>{const s=fs.readFileSync(path.join(root,'companion.js'),'utf8');new vm.Script(s);assert.match(s,/originalDice:empowered\?before:null/);assert.match(s,/eventId:crypto\.randomUUID\(\),title:s\.name,heals:/);assert.match(s,/if\(structuredResult\)\{[\s\S]*?window\.CompanionResultFocus\?\.showStructured/);});

test('Samoth spell attacks preserve d20, blessing and real elemental dice',()=>{
 const s=fs.readFileSync(path.join(root,'companion.js'),'utf8');
 new vm.Script(s,{filename:'companion.js'});
 assert.match(s,/attack\.blessRoll=bless/);
 assert.match(s,/rolls:ar\.rolls,mode:ar\.mode/);
 assert.match(s,/dice:d\.dice,formula:\(n\*\(r\.nat===20\?2:1\)\)/);
 assert.match(s,/extra:r\.blessRoll,total:r\.nat\+r\.bonus\+r\.blessRoll/);
 assert.match(s,/title:s\.name\+' · cible '\+\(i\+1\)\+' — RATÉ'/);
});

test('Samoth saving throws and automatic spells preserve typed dice',()=>{const s=fs.readFileSync(path.join(root,'companion.js'),'utf8');new vm.Script(s);assert.match(s,/structuredResult=\{eventId:crypto\.randomUUID\(\),title:s\.name\+' — sauvegarde '/);assert.match(s,/formula:'4d6',bonus:3/);assert.match(s,/title:s\.name\+' — toucher automatique'/);});


test('V1.4: structured result stays visible until explicit close and uses no emoji damage glyphs',()=>{
 assert.doesNotMatch(source,/setTimeout\(hide,\s*8500\)/);
 assert.doesNotMatch(source,/[🔥❄⚡💥🧪☠✨🧠🔮🪨🗡]/u);
 const {normalizeType,semanticColors}=ctx.module.exports;
 for(const [label,type] of [['feu','fire'],['froid','cold'],['foudre','lightning'],['tonnerre','thunder'],['acide','acid'],['poison','poison'],['nécrotiques','necrotic'],['radiants','radiant'],['psychiques','psychic'],['force','force'],['contondants','bludgeoning'],['perforants','piercing'],['tranchants','slashing']]){
  assert.equal(normalizeType(label),type);
  assert.match(semanticColors[type],/^#[0-9A-Fa-f]{6}$/);
 }
});


test('configuration toggles are excluded from result observer',()=>{assert.match(source,/configuration&&\!resolved/);assert.match(source,/cogneur lourd/);assert.match(source,/great weapon master/);});


test('PASSIVE TOGGLE: Cogneur lourd does not render a result, actual dice do, journal untouched',()=>{
 let mutation;
 class FakeNode {
  constructor(){this.children=[];this.textContent='';this.hidden=false;this.parentElement=null;this.className='';this.style={setProperty(){}};this.classList={add(){}};}
  append(...nodes){this.children.push(...nodes)}
  appendChild(node){this.children.push(node);return node}
  replaceChildren(...nodes){this.children=[...nodes]}
  setAttribute(){}
  closest(){return null}
 }
 const sourceNode=new FakeNode(),titleNode=new FakeNode(),page=new FakeNode();
 sourceNode.textContent='Prêt';sourceNode.parentElement=new FakeNode();titleNode.textContent='Cogneur lourd';
 const doc={readyState:'complete',body:page,querySelector:s=>s==='#source'?sourceNode:s==='#title'?titleNode:null,createElement:()=>new FakeNode(),addEventListener(){}};
 const win={document:doc,CompanionResultFocusConfig:{sources:['#source'],labels:['#title']},setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(source,{window:win,Date,MutationObserver:class{constructor(cb){mutation=cb}observe(){}}});
 titleNode.textContent='RAGE ACTIVÉE';
 sourceNode.textContent='Résistance C/P/T · +3 dégâts de Rage · avantage FOR';
 mutation();
 assert.equal(page.children.length,0,'rage toggle is configuration, not damage');
 titleNode.textContent='Cible à 0 PV';
 sourceNode.textContent='Attaque bonus débloquée : cible à 0 PV';
 mutation();
 assert.equal(page.children.length,0,'target at zero HP is not a healing action');
 titleNode.textContent='Cogneur lourd';
 sourceNode.textContent='Cogneur lourd activé : -5 au toucher, +10 dégâts';
 mutation();
 assert.equal(page.children.length,0,'a passive toggle must not create any combat card');
 titleNode.textContent='Attaque à deux mains';
 sourceNode.textContent='Jet : 12 + 7 = 19 · 21 dégâts';
 mutation();
 assert.equal(page.children.length,1,'a real roll must produce one card');
 assert.equal(page.children[0].hidden,true,'damage result must wait for the FX lead-in');
 assert.equal(page.children[0].children[2].children[0].children[1].textContent,'19');
 titleNode.textContent='Cogneur lourd';
 sourceNode.textContent='Cogneur lourd désactivé : -5 au toucher, +10 dégâts';
 mutation();
 assert.equal(page.children.length,1,'toggle must not create a second result card');
});

test('abbreviated temporary HP is not healing',()=>{const parsed=read('Écorce du Serment : 20 PV temp · échardes 1d6');assert.equal(parsed.temp,20);assert.equal(parsed.heal,null)});

test('all D&D skill results, including Histoire, are excluded from the combat popup',()=>{
 const {isSocial}=ctx.module.exports;
 for(const skill of ['Histoire','Athlétisme','Acrobaties','Discrétion','Escamotage','Arcanes','Investigation','Nature','Religion','Dressage','Intuition','Médecine','Perception','Survie','Intimidation','Persuasion','Représentation','Tromperie']){
   assert.equal(isSocial(skill),true,skill);
 }
 assert.equal(isSocial('Trait de feu'),false);
});

test('Samoth N6: Encounter save refusal restores spell slot and sorcery points before commit',()=>{
 const source=fs.readFileSync(path.join(root,'companion.js'),'utf8');
 assert.match(source,/id:'disintegrate',name:'Désintégration',lv:6/);
 assert.match(source,/MAX=\{1:4,2:3,3:3,4:3,5:2,6:1\}/);
 const start=source.indexOf('if(networkSavePayload&&!sendEncounterSave(networkSavePayload)){');
 const end=source.indexOf("if(s.lv>=1&&['attack','save','storm','automatic']",start);
 assert.ok(start>0&&end>start,'failure branch precedes spell commit');
 const branch=source.slice(start,end);
 const fn=vm.runInNewContext('(function(networkSavePayload,sendEncounterSave,state,before,persist,render,message){'+branch+'return true;})');
 const state={slots:{6:0},sp:8,eco:{action:true},malachorTriggerRound:3,uncommitted:true};
 const before={slots:{6:1},sp:11,eco:{action:false},malachorTriggerRound:0};
 let saves=0,renders=0,msg='';
 const result=fn({source:'Désintégration'},()=>false,state,before,()=>saves++,()=>renders++,m=>msg=m);
 assert.equal(result,undefined);
 assert.deepEqual(JSON.parse(JSON.stringify(state)),before);
 assert.equal(saves,1);assert.equal(renders,1);
 assert.match(msg,/ressources restaurées/);
 const accepted={slots:{6:0},sp:8},okay=fn({source:'Désintégration'},()=>true,accepted,before,()=>{},()=>{},()=>{});
 assert.equal(okay,true);assert.equal(accepted.slots[6],0);
});

test('Samoth legacy level 10 import preserves missing HP and expended resources',()=>{
 const source=fs.readFileSync(path.join(root,'companion.js'),'utf8');
 assert.match(source,/next\.hp=Math\.max\(0,Math\.min\(78,old\.hp>0\?old\.hp\+6:0\)\)/);
 assert.match(source,/next\.sp=Math\.max\(0,Math\.min\(11,Number\(old\.spCore\?\?10\)\+1\)\)/);
 assert.match(source,/next\.staff=Math\.max\(0,Math\.min\(10,Number\(old\.staff\?\?8\)\+2\)\)/);
 const hp=(old)=>Math.max(0,Math.min(78,old>0?old+6:0));
 assert.equal(hp(72),78);assert.equal(hp(32),38);assert.equal(hp(0),0);
 const sp=(old)=>Math.max(0,Math.min(11,Number(old??10)+1));
 assert.equal(sp(10),11);assert.equal(sp(0),1);
 const staff=(old)=>Math.max(0,Math.min(10,Number(old??8)+2));
 assert.equal(staff(8),10);assert.equal(staff(0),2);
});
