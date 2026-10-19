const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function rules(){const ctx=vm.createContext({});vm.runInContext(fs.readFileSync('samoth-feat-rules.js','utf8'),ctx);return ctx.SamothFeatRules;}
test('v3 correction is idempotent and preserves live and undo state',()=>{
 const r=rules(),s={hp:29,tempHp:7,slots:{1:2},sp:6,wings:2,cureFree:0,history:[{title:'old'}],notes:'Notes',items:[{name:'Bâton'}],intensified:true,featEnabled:true,featSp:2,meta:'heighten',undo:{hp:32,sp:5,wings:3,meta:'twin'}};
 const original=structuredClone(s);r.migrate(s);for(const k of ['hp','tempHp','slots','sp','wings','cureFree','history','notes','items'])assert.deepEqual(s[k],original[k]);
 assert.equal(s.intensified,false);assert.equal(s.featSp,0);assert.equal(s.meta,'none');assert.equal(s.undo.meta,'twin');assert.equal(s.undo.sp,5);assert.equal(s.level8Feat,'fizban:feat:gift-of-the-metallic-dragon');assert.deepEqual([...s.classMetamagic],['quick','twin','empower']);const once=JSON.stringify(s);r.migrate(s);assert.equal(JSON.stringify(s),once);assert.equal(JSON.stringify(r.migrate(JSON.parse(once))),once);
 assert.equal(r.healingModifier(s),3);assert.equal(r.healingModifier({...s,draconicHealingAbility:'int'}),1);assert.equal(r.proficiency(),4);
});
function reactions(){const s={eco:{reaction:false},wings:4,slots:{1:2}},descriptors=new Map(),ctx=vm.createContext({console,document:{addEventListener(){}},RPGDialogs:{confirm:async()=>true}});ctx.window=ctx;
 vm.runInContext(fs.readFileSync('samoth-feat-rules.js','utf8'),ctx);
 ctx.__CompanionBridge={read:()=>s,healthRefresh(){}};ctx.CompanionAPI={sync(){}};ctx.RPGCombatEffectsClient={};ctx.RPGReactions={register:d=>descriptors.set(d.id,d)};
 vm.runInContext(fs.readFileSync('rpg-samoth-automatismes.js','utf8'),ctx);return{s,d:descriptors.get('samoth-wings'),ctx};}
test('wings validate range/visibility, claim without cost, consume once on grant',async()=>{
 const{s,d,ctx}=reactions(),q={kind:'defensive-ac',wingsAllowed:true,reactionId:'attack1',self:false,rangeFeet:5,visible:true};
 assert.ok(d.matches(q));assert.ok(d.available(q));assert.equal(d.available({...q,rangeFeet:6}),false);assert.equal(d.available({...q,visible:false}),false);
 assert.ok(await d.beforeClaim(q));assert.equal(s.wings,4);const out=d.execute(q);assert.equal(out.acBonus,4);assert.equal(s.wings,3);assert.equal(s.eco.reaction,true);assert.equal(d.execute(q),out);assert.equal(d.recover(q),out);assert.equal(s.wings,3);
 assert.equal(d.available({...q,reactionId:'attack2'}),false);s.eco.reaction=false;s.wings=0;assert.equal(d.available(q),false);
 s.wings=4;ctx.RPGDialogs.confirm=async()=>false;assert.equal(await d.beforeClaim({...q,reactionId:'declined',rangeFeet:null,visible:undefined}),null);assert.equal(s.wings,4);
 assert.equal(d.execute({...q,reactionId:'declined'}).consumed,false);
});
test('late range invalidation never spends a reaction',async()=>{const{s,d}=reactions(),q={reactionId:'late',self:false,rangeFeet:5,visible:true};await d.beforeClaim(q);assert.equal(d.execute({...q,rangeFeet:9}).consumed,false);assert.equal(s.wings,4);assert.equal(s.eco.reaction,false);});
