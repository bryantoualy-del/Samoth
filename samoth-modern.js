/* Modernisation conservative de Samoth. Les cinq onglets et les FX historiques restent intacts. */
const MODERN_JOURNAL_LIMIT=150;
const MODERN_BLOCKED=['déjà utilisée','déjà utilisé','pas assez','impossible','aucun emplacement','nécessite','épuisée','épuisé','au maximum','aucun esprit','doit jouer'];
S.tempHp=Math.max(0,Number(S.tempHp)||0);
S.round=Math.max(1,Number(S.round||S.turn)||1);
S.combat=Math.max(1,Number(S.combat)||1);
S.phase=S.phase==='dragon'&&S.dragon?'dragon':'samoth';
S.eco=Object.assign({action:false,bonus:false,reaction:false,movement:false},S.eco||{});
S.dragonEco=Object.assign({action:false,movement:false},S.dragonEco||{});
S.empoweredArmed=!!S.empoweredArmed;
S.journal=Array.isArray(S.journal)?S.journal:[];
if(!S.journal.length&&Array.isArray(S.log))S.journal=S.log.slice().reverse().map((detail,i)=>({id:Date.now()+i,time:Date.now(),combat:S.combat,round:S.round,phase:'Samoth',type:'state',title:'Historique importé',detail}));
S.lastResult=S.lastResult||null;
S.lastUndo=S.lastUndo||null;

let modernPending=null;
let modernRibbonTimer=null;
const deep=v=>structuredClone(v);
function snapshot(){const x=deep(S);delete x.lastUndo;return x}
function restoreSnapshot(x){if(!x)return;S=Object.assign({},deep(x));modernPending=null;render();renderJournal();save()}
function blockedText(t){const s=String(t||'').toLowerCase();return MODERN_BLOCKED.some(x=>s.includes(x))}
function journalPush(title,detail,type='state'){
  S.journal.push({id:Date.now()+Math.random(),time:Date.now(),combat:S.combat,round:S.round,phase:S.phase==='dragon'?'Dragon':'Samoth',type,title,detail:String(detail||'')});
  S.journal=S.journal.slice(-MODERN_JOURNAL_LIMIT);
  S.log=S.journal.slice(-100).reverse().map(x=>x.title+(x.detail?'\n'+x.detail:''));
}
function presentResult(title,detail,fxClass,type='state',before=null){
  if(before)S.lastUndo=before;
  const text=title+(detail?'\n'+detail:'');
  journalPush(title,detail,type);
  S.lastResult={title,text,fxClass,type,time:Date.now()};
  $('rb').textContent=text;
  const ribbon=$('ribbon');
  ribbon.classList.remove('show','blocked');void ribbon.offsetWidth;ribbon.classList.add('show');
  ribbon.querySelector('.rt').textContent='SAMOTH · RÉSULTAT';
  $('ribbonUndo').disabled=!S.lastUndo;
  $('resultBadge').classList.remove('show');
  clearTimeout(modernRibbonTimer);modernRibbonTimer=setTimeout(()=>collapseRibbon(),7000);
  if(fxClass)fx(fxClass);
  render();renderJournal();save();
}
show=function(t,c){
  const blocked=blockedText(t),before=modernPending;modernPending=null;
  if(blocked){
    const ribbon=$('ribbon');$('rb').textContent=t;ribbon.classList.add('blocked','show');ribbon.querySelector('.rt').textContent='SAMOTH · ACTION INDISPONIBLE';
    $('ribbonUndo').disabled=true;$('resultBadge').classList.remove('show');clearTimeout(modernRibbonTimer);modernRibbonTimer=setTimeout(()=>collapseRibbon(),4200);render();save();return;
  }
  presentResult(String(t).split('\n')[0],String(t).split('\n').slice(1).join('\n'),c,'state',before);
};
function collapseRibbon(){clearTimeout(modernRibbonTimer);$('ribbon').classList.remove('show');if(S.lastResult)$('resultBadge').classList.add('show')}
function undoLast(){if(!S.lastUndo)return;const old=S.lastUndo;S.lastUndo=null;restoreSnapshot(old);journalPush('Annulation','La dernière résolution a été annulée atomiquement.','state');S.lastResult={title:'Annulation',text:'Dernière résolution annulée.',type:'state',time:Date.now()};$('rb').textContent=S.lastResult.text;$('ribbon').classList.add('show');$('resultBadge').classList.remove('show');$('ribbonUndo').disabled=true;render();renderJournal();save()}

function openResolution(title,body,actions){
  $('resolutionTitle').textContent=title;$('resolutionBody').innerHTML=body;$('resolutionActions').innerHTML='';
  actions.forEach(a=>{const b=document.createElement('button');b.type='button';b.textContent=a.label;b.className=a.className||'';b.onclick=a.run;$('resolutionActions').appendChild(b)});
  $('resolutionModal').classList.add('open');$('resolutionModal').setAttribute('aria-hidden','false');
}
function closeResolution(){$('resolutionModal').classList.remove('open');$('resolutionModal').setAttribute('aria-hidden','true')}
function cancelResolution(){const before=modernPending;modernPending=null;closeResolution();restoreSnapshot(before)}
function spendSorcery(cost){let bonus=Math.min(S.spBonus,cost);S.spBonus-=bonus;S.spCore-=cost-bonus}
function modernBeginSpell(level,ctx={}){
  const before=snapshot(),main=S.metaArmed,emp=S.empoweredArmed;
  ctx=Object.assign({damage:false,saveSpell:false,twinnable:false,actionCast:true},ctx);
  let err=main?metaRule(main,ctx):'';if(emp&&!ctx.damage)err='Renforcé nécessite un sort qui lance des dés de dégâts.';
  const mainCost=main?metaCost(level):0,cost=mainCost+(emp?1:0),eco=main==='Accéléré'?'bonus':'action';
  if(err){show(err);return null}if(S.phase!=='samoth'){show('Samoth doit jouer pendant son propre tour.');return null}
  if(S.eco[eco]){show((eco==='bonus'?'Action bonus':'Action')+' déjà utilisée ce tour.');return null}
  if((S.spCore+S.spBonus)<cost){show('Pas assez de points de métamagie.');return null}
  if(eco==='bonus'&&S.actionSpellLevel!=null&&S.actionSpellLevel>0){show('Impossible : un sort de niveau 1+ a déjà été lancé avec l’Action.');return null}
  if(eco==='action'&&S.bonusSpellCast&&level>0){show('Après un sort lancé en Action bonus, l’Action ne peut lancer qu’un tour de magie.');return null}
  if(level&&S.slots[level]<1){show('Aucun emplacement N'+level+'.');return null}
  S.eco[eco]=true;if(level)S.slots[level]--;if(eco==='bonus')S.bonusSpellCast=true;else S.actionSpellLevel=level;
  if(cost)spendSorcery(cost);S.metaArmed='';S.metaCost=0;S.empoweredArmed=false;modernPending=before;
  return{before,main,emp,eco,cost};
}
armMeta=function(n,c){
  if(n==='Renforcé')S.empoweredArmed=!S.empoweredArmed;else if(S.metaArmed===n){S.metaArmed='';S.metaCost=0}else{S.metaArmed=n;S.metaCost=c}
  render();save();
};
clearMeta=function(){S.metaArmed='';S.metaCost=0;S.empoweredArmed=false;render();save()};
function metaSummary(start,level){const parts=[];if(start.main)parts.push(metaText(start.main,level).trim());if(start.emp)parts.push('Métamagie : Renforcé · 1 pt');return parts.length?'\n'+parts.join('\n'):''}
function rollDamage(n,s,cold,emp){let r=dice(n,s,cold),line='';if(emp){const rr=rerollLowest(r.a,s,cold,Math.min(3,r.a.length));r=rr;line='\n'+rr.text}return{r,line}}
function consumePure(level,applies){if(!S.pureReady||level<1)return{total:0,text:''};S.pureReady=false;S.pureUse=0;fx('fx-pure',2);if(!applies)return{total:0,text:'Flammes pures consommées, sans dégâts sur une attaque ratée.'};const r=dice(level,10);return{total:r.total,text:'Flammes pures : '+r.total+' radiants ('+r.a.join('+')+')'}}
function finishAttackResolution(name,level,nd,sd,cold,start,rolls,hits){
  let total=0,detail=[];let pureApplied=false;
  rolls.forEach((nat,i)=>{if(!hits[i]){detail.push('Cible '+(i+1)+' : '+nat+' +10 = '+(nat+10)+' · ratée');return}const crit=nat===20,dr=rollDamage(nd*(crit?2:1),sd,cold,start.emp),affinity=cold?3:0;let dmg=dr.r.total+affinity;let pure=consumePure(level,!pureApplied);if(pure.total||pure.text)pureApplied=true;dmg+=pure.total;total+=dmg;detail.push('Cible '+(i+1)+' : '+nat+' +10 = '+(nat+10)+(crit?' · CRITIQUE':'')+'\n'+dmg+' dégâts'+(cold?' de froid':'')+' ('+dr.r.a.join('+')+(affinity?' +3':'')+')'+dr.line+(pure.text?'\n'+pure.text:''))});
  if(!hits.some(Boolean))detail.push(consumePure(level,false).text);
  S.turnDamage+=total;modernPending=null;closeResolution();if(rolls.some((n,i)=>hits[i]&&n===20))fx('crit',2);
  presentResult(name,detail.join('\n')+metaSummary(start,level),cold?coldFxFor(name):'', 'damage',start.before);
}
attackSpell=function(name,level,nd,sd,cold){
  const start=modernBeginSpell(level,{damage:true,twinnable:true});if(!start)return;
  const rolls=[d(20)];if(start.main==='Jumelé')rolls.push(d(20));
  if(rolls.length===1){const nat=rolls[0];openResolution(name,'<div class="resolution-roll"><small>Jet d’attaque</small><strong>'+nat+' + 10 = '+(nat+10)+'</strong>'+(nat===20?'<small>20 naturel · critique</small>':'')+'</div><p>L’attaque touche-t-elle la cible ?</p>',[
    {label:'Oui',className:'yes',run:()=>finishAttackResolution(name,level,nd,sd,cold,start,rolls,[true])},{label:'Non',className:'no',run:()=>finishAttackResolution(name,level,nd,sd,cold,start,rolls,[false])},{label:'Annuler',className:'cancel',run:cancelResolution}
  ])}else{
    openResolution(name+' · Sort jumelé','<div class="resolution-roll"><small>Cible 1</small><strong>'+rolls[0]+' + 10 = '+(rolls[0]+10)+'</strong></div><div class="resolution-roll"><small>Cible 2</small><strong>'+rolls[1]+' + 10 = '+(rolls[1]+10)+'</strong></div><div class="resolution-fields"><label>Cible 1<select id="hitOne"><option value="1">Touchée</option><option value="0">Ratée</option></select></label><label>Cible 2<select id="hitTwo"><option value="1">Touchée</option><option value="0">Ratée</option></select></label></div>',[
      {label:'Résoudre',className:'yes',run:()=>finishAttackResolution(name,level,nd,sd,cold,start,rolls,[$('hitOne').value==='1',$('hitTwo').value==='1'])},{label:'Annuler',className:'cancel',run:cancelResolution}
    ]);
  }
};
function finishSaveResolution(name,level,saveName,nd,sd,cold,start,failures,successes,half){
  let dr=rollDamage(nd,sd,cold,start.emp),base=dr.r.total+(cold?3:0),pure=consumePure(level,failures+successes>0),perFail=base+pure.total,perSuccess=half?Math.floor(perFail/2):0,total=failures*perFail+successes*perSuccess;
  S.turnDamage+=total;modernPending=null;closeResolution();const detail=saveName+' DD18 · '+failures+' échec(s), '+successes+' réussite(s)\nJet : '+base+(cold?' froid':'')+(pure.text?'\n'+pure.text:'')+'\nDégâts comptabilisés : '+total+dr.line+metaSummary(start,level);
  presentResult(name,detail,cold?coldFxFor(name):'fx-radiant','damage',start.before);
}
saveSpell=function(name,level,saveName,nd,sd,cold){
  const isSingle=name==='Gelure',start=modernBeginSpell(level,{damage:true,saveSpell:true,twinnable:isSingle});if(!start)return;
  const targets=start.main==='Jumelé'?2:1,half=!isSingle;
  if(isSingle){
    if(targets===1)openResolution(name,'<p>Résultat de la sauvegarde de '+saveName+' DD18 ?</p>',[
      {label:'Échec',className:'yes',run:()=>finishSaveResolution(name,level,saveName,nd,sd,cold,start,1,0,half)},{label:'Réussite',className:'no',run:()=>finishSaveResolution(name,level,saveName,nd,sd,cold,start,0,1,half)},{label:'Annuler',className:'cancel',run:cancelResolution}
    ]);else openResolution(name+' · Sort jumelé','<div class="resolution-fields"><label>Échecs<input id="saveFails" type="number" min="0" max="2" value="2"></label><label>Réussites<input id="saveSuccess" type="number" min="0" max="2" value="0"></label></div>',[
      {label:'Résoudre',className:'yes',run:()=>finishSaveResolution(name,level,saveName,nd,sd,cold,start,Math.max(0,Number($('saveFails').value)||0),Math.max(0,Number($('saveSuccess').value)||0),half)},{label:'Annuler',className:'cancel',run:cancelResolution}
    ]);
  }else openResolution(name,'<p>Indique le nombre de créatures pour chaque résultat.</p><div class="resolution-fields"><label>Échecs<input id="saveFails" type="number" min="0" value="1"></label><label>Réussites<input id="saveSuccess" type="number" min="0" value="0"></label></div>',[
    {label:'Résoudre',className:'yes',run:()=>finishSaveResolution(name,level,saveName,nd,sd,cold,start,Math.max(0,Number($('saveFails').value)||0),Math.max(0,Number($('saveSuccess').value)||0),half)},{label:'Annuler',className:'cancel',run:cancelResolution}
  ]);
};
iceStorm=function(){
  const start=modernBeginSpell(4,{damage:true,saveSpell:true});if(!start)return;
  openResolution('Tempête de grêle','<p>Indique le nombre de créatures pour chaque résultat (DEX DD18).</p><div class="resolution-fields"><label>Échecs<input id="saveFails" type="number" min="0" value="1"></label><label>Réussites<input id="saveSuccess" type="number" min="0" value="0"></label></div>',[
    {label:'Résoudre',className:'yes',run:()=>{let pool=[...dice(2,8).a.map(v=>({v,s:8,c:false})),...dice(4,6,true).a.map(v=>({v,s:6,c:true}))],beforeDice=pool.map(x=>x.v);if(start.emp){pool.map((x,i)=>({x,i})).sort((a,b)=>a.x.v-b.x.v).slice(0,3).forEach(({x})=>{x.v=d(x.s);if(x.c&&x.v===1)x.v=2})}const base=pool.reduce((n,x)=>n+x.v,0)+3,pure=consumePure(4,true),full=base+pure.total,f=Math.max(0,Number($('saveFails').value)||0),s=Math.max(0,Number($('saveSuccess').value)||0),total=f*full+s*Math.floor(full/2);S.turnDamage+=total;modernPending=null;closeResolution();presentResult('Tempête de grêle','DEX DD18 · '+f+' échec(s), '+s+' réussite(s)\n'+full+' dégâts complets · '+total+' comptabilisés'+(start.emp?'\nRenforcé : '+beforeDice.join('+')+' → '+pool.map(x=>x.v).join('+'):'')+(pure.text?'\n'+pure.text:'')+metaSummary(start,4),'fx-tempete-grele','damage',start.before)}},{label:'Annuler',className:'cancel',run:cancelResolution}
  ]);
};
castUtility=function(name,level,conc,eco,effect){const radiance=name==='Rayonnement écœurant',start=modernBeginSpell(level,{damage:radiance,saveSpell:radiance,twinnable:name==='Hâte'||name==='Invisibilité supérieure'});if(!start)return;if(conc){if(S.concentration.includes('draconique'))S.dragon=false;S.concentration=name}if(radiance){S.radianceEmpowered=!!start.emp;S.radianceIntensified=start.main==='Intensifié'}const pure=consumePure(level,true);if(pure.total)S.turnDamage+=pure.total;modernPending=null;presentResult(name,'Lancé N'+level+(conc?' · concentration':'')+(pure.text?'\n'+pure.text:'')+metaSummary(start,level),effect,'state',start.before)};
function resolveRadiance(){if(S.concentration!=='Rayonnement écœurant')return show('Rayonnement écœurant doit être actif.');const before=snapshot();openResolution('Rayonnement écœurant','<p>Résultat de la sauvegarde de Constitution DD18 ?'+(S.radianceIntensified?' La première sauvegarde est faite avec désavantage.':'')+'</p>',[
  {label:'Échec',className:'yes',run:()=>{let r=dice(4,10),line='';if(S.radianceEmpowered){const rr=rerollLowest(r.a,10,false,3);r=rr;line='\n'+rr.text;S.radianceEmpowered=false}S.radianceIntensified=false;S.turnDamage+=r.total;closeResolution();presentResult('Exposition au rayonnement',r.total+' dégâts radiants et 1 niveau d’épuisement.'+line,'fx-radiant','damage',before)}},{label:'Réussite',className:'no',run:()=>{S.radianceIntensified=false;closeResolution();presentResult('Exposition au rayonnement','Sauvegarde réussie · aucun dégât.','fx-radiant','damage',before)}},{label:'Annuler',className:'cancel',run:()=>{modernPending=before;cancelResolution()}}
])}

createSlot=function(l,c){const before=snapshot();if(S.phase!=='samoth')return show('Samoth doit jouer pendant son propre tour.');if(S.eco.bonus)return show('Action bonus déjà utilisée ce tour.');if(S.spCore<c)return show('Pas assez de points convertibles.');if(S.slots[l]>=MAXS[l])return show('Emplacements N'+l+' déjà au maximum.');S.eco.bonus=true;S.spCore-=c;S.slots[l]++;presentResult('Incantation flexible','Emplacement N'+l+' créé pour '+c+' points.','', 'resource',before)};
function convertSlot(l){const before=snapshot();if(S.phase!=='samoth')return show('Samoth doit jouer pendant son propre tour.');if(S.eco.bonus)return show('Action bonus déjà utilisée ce tour.');if(!S.slots[l])return show('Aucun emplacement N'+l+'.');if(S.spCore>=10)return show('Points convertibles déjà au maximum.');S.eco.bonus=true;S.slots[l]--;const gain=Math.min(l,10-S.spCore);S.spCore+=gain;presentResult('Incantation flexible','Emplacement N'+l+' converti en '+gain+' point(s).','', 'resource',before)}
function setTempHp(){const x=Math.max(0,Number($('tempHpInput').value)||0),before=snapshot();S.tempHp=Math.max(S.tempHp,x);$('tempHpInput').value='';presentResult('PV temporaires',S.tempHp+' PV temporaires actifs.','fx-shield','defense',before)}
takeDamage=function(){const x=Math.max(0,Number($('incoming').value)||0);if(!x)return;const before=snapshot(),absorbed=Math.min(S.tempHp,x),hpDamage=x-absorbed;S.tempHp-=absorbed;S.hp=Math.max(0,S.hp-hpDamage);$('incoming').value='';if(!S.concentration){presentResult('Dégâts reçus',x+' dégâts · '+absorbed+' absorbés par les PV temporaires · '+S.hp+'/72 PV.','', 'defense',before);return}modernPending=before;const dc=Math.max(10,Math.floor(x/2)),nat=d(20),total=nat+6;openResolution('Jet de concentration','<div class="resolution-roll"><small>CON +6 contre DD '+dc+'</small><strong>'+nat+' + 6 = '+total+'</strong></div><p>'+x+' dégâts reçus, dont '+absorbed+' absorbés par les PV temporaires.</p>',[
  {label:'Maintenue',className:'yes',run:()=>{modernPending=null;closeResolution();presentResult('Dégâts reçus',x+' dégâts · '+S.hp+'/72 PV. Concentration maintenue sur '+S.concentration+'.','', 'defense',before)}},{label:'Perdue',className:'no',run:()=>{const old=S.concentration;S.concentration='';S.dragon=false;S.phase='samoth';modernPending=null;closeResolution();presentResult('Concentration rompue',x+' dégâts · '+S.hp+'/72 PV. '+old+' prend fin.','', 'defense',before)}},{label:'Annuler',className:'cancel',run:cancelResolution}
])};

function requireDragonAction(){if(!S.dragon){show('Aucun esprit draconique actif.');return null}if(S.phase!=='dragon'){show('Le dragon doit jouer pendant son propre tour.');return null}if(S.dragonEco.action){show('Action déjà utilisée ce tour.');return null}return snapshot()}
summonDragon=function(){const start=modernBeginSpell(5,{damage:false});if(!start)return;S.dragon=true;S.dragonHp=50;S.concentration='Convocation d’esprit draconique';S.dragonEco={action:false,movement:false};modernPending=null;presentResult('Esprit draconique d’argent','Invoqué avec 50 PV · il jouera immédiatement après Samoth.'+metaSummary(start,5),'fx-dragon','state',start.before)};
dragonRend=function(){const before=requireDragonAction();if(!before)return;const rolls=[d(20),d(20)];modernPending=before;openResolution('Déchirement ×2','<div class="resolution-roll"><small>Attaque 1</small><strong>'+rolls[0]+' + 10 = '+(rolls[0]+10)+'</strong></div><div class="resolution-roll"><small>Attaque 2</small><strong>'+rolls[1]+' + 10 = '+(rolls[1]+10)+'</strong></div><div class="resolution-fields"><label>Attaque 1<select id="rendOne"><option value="1">Touchée</option><option value="0">Ratée</option></select></label><label>Attaque 2<select id="rendTwo"><option value="1">Touchée</option><option value="0">Ratée</option></select></label></div>',[
  {label:'Résoudre',className:'yes',run:()=>{const hits=[$('rendOne').value==='1',$('rendTwo').value==='1'];let total=0,lines=[];rolls.forEach((nat,i)=>{if(!hits[i])return lines.push('Attaque '+(i+1)+' ratée.');const crit=nat===20,r=dice(crit?2:1,6),dmg=r.total+9;total+=dmg;lines.push('Attaque '+(i+1)+(crit?' critique':'')+' : '+dmg+' dégâts.')});S.dragonEco.action=true;S.turnDamage+=total;modernPending=null;closeResolution();if(rolls.some((n,i)=>hits[i]&&n===20))fx('crit',2);presentResult('Déchirement ×2',lines.join('\n')+'\nTotal : '+total,'fx-dragon','damage',before)}},{label:'Annuler',className:'cancel',run:cancelResolution}
])};
dragonBreath=function(){const before=requireDragonAction();if(!before)return;modernPending=before;openResolution('Souffle froid','<p>Indique le nombre de créatures pour chaque résultat (DEX DD18).</p><div class="resolution-fields"><label>Échecs<input id="saveFails" type="number" min="0" value="1"></label><label>Réussites<input id="saveSuccess" type="number" min="0" value="0"></label></div>',[
  {label:'Résoudre',className:'yes',run:()=>{const r=dice(2,6),f=Math.max(0,Number($('saveFails').value)||0),s=Math.max(0,Number($('saveSuccess').value)||0),total=f*r.total+s*Math.floor(r.total/2);S.dragonEco.action=true;S.turnDamage+=total;modernPending=null;closeResolution();presentResult('Souffle froid',r.total+' dégâts complets · '+f+' échec(s), '+s+' réussite(s) · '+total+' comptabilisés.','fx-souffle-dragon','damage',before)}},{label:'Annuler',className:'cancel',run:cancelResolution}
])};
function dragonDodge(){const before=requireDragonAction();if(!before)return;S.dragonEco.action=true;presentResult('Esquive du dragon','Le dragon Esquive jusqu’au début de son prochain tour.','fx-dragon','state',before)}
function damageDragon(){const x=Math.max(0,Number($('dragonIncoming').value)||0);if(!x||!S.dragon)return;const before=snapshot();S.dragonHp=Math.max(0,S.dragonHp-x);$('dragonIncoming').value='';if(!S.dragonHp){S.dragon=false;S.phase='samoth';if(S.concentration.includes('draconique'))S.concentration=''}presentResult('PV du dragon',x+' dégâts · '+S.dragonHp+'/50 PV.'+(S.dragon?'':' Le dragon disparaît.'),'', 'defense',before)}

nextTurn=function(){const before=snapshot();if(S.phase==='samoth'&&S.dragon){S.phase='dragon';S.dragonEco={action:false,movement:false};S.turnDamage=0;presentResult('Tour de l’esprit draconique','Le dragon joue immédiatement après Samoth.','', 'state',before);return}S.phase='samoth';S.turn++;S.round=S.turn;S.turnDamage=0;S.eco={action:false,bonus:false,reaction:false,movement:false};S.bonusSpellCast=false;S.actionSpellLevel=null;presentResult('Tour '+S.turn,'Économie d’action et dégâts du tour réinitialisés. La concentration persiste.','', 'state',before)};
function newCombat(){const before=snapshot();S.combat++;S.turn=1;S.round=1;S.phase='samoth';S.turnDamage=0;S.eco={action:false,bonus:false,reaction:false,movement:false};S.dragonEco={action:false,movement:false};S.bonusSpellCast=false;S.actionSpellLevel=null;presentResult('Nouveau combat','Combat '+S.combat+' démarré. Les ressources durables et la concentration sont conservées.','', 'state',before)}
shortRest=function(){const before=snapshot();S.phase='samoth';S.turnDamage=0;S.eco={action:false,bonus:false,reaction:false,movement:false};S.dragonEco={action:false,movement:false};S.bonusSpellCast=false;S.actionSpellLevel=null;presentResult('Repos court','Économie d’action et données du tour réinitialisées.','', 'resource',before)};
longRest=function(){const before=snapshot(),combat=S.combat,journal=S.journal,lastResult=S.lastResult;S=Object.assign(deep(BASE),{tempHp:0,round:1,combat,phase:'samoth',eco:{action:false,bonus:false,reaction:false,movement:false},dragonEco:{action:false,movement:false},empoweredArmed:false,journal,lastResult,lastUndo:null});presentResult('Repos long','Toutes les ressources de Samoth sont restaurées.','fx-heal','resource',before)};

function renderJournal(){const list=$('journalList');if(!list)return;const q=($('journalSearch').value||'').trim().toLowerCase(),filter=$('journalFilter').value||'all',items=S.journal.slice().reverse().filter(x=>(filter==='all'||x.type===filter)&&((x.title+' '+x.detail).toLowerCase().includes(q)));list.innerHTML=items.length?items.map(x=>'<article class="journal-entry"><div class="journal-entry-head"><span>Combat '+x.combat+' · Tour '+x.round+' · '+x.phase+'</span><span>'+new Date(x.time).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})+'</span></div><b>'+escapeHtml(x.title)+'</b><p>'+escapeHtml(x.detail)+'</p></article>').join(''):'<div class="journal-empty">Aucun événement correspondant.</div>'}
function escapeHtml(x){return String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
clearLog=function(){if(!confirm('Effacer le journal de Samoth ?'))return;S.journal=[];S.log=[];S.lastUndo=null;render();renderJournal();save()};
const legacyRenderModern=render;
render=function(){legacyRenderModern();
  $('tempHpText').textContent=S.tempHp?'· '+S.tempHp+' temp.':'';
  $('phaseLabel').innerHTML=(S.phase==='dragon'?'Dragon':'Samoth')+' · Tour <span id="turnN">'+S.turn+'</span>';
  const movement=$('ecoMovement');movement.classList.toggle('used',S.phase==='dragon'?S.dragonEco.movement:S.eco.movement);movement.classList.toggle('na',false);movement.querySelector('span').textContent=(S.phase==='dragon'?S.dragonEco.movement:S.eco.movement)?'Utilisé':'Disponible';
  ['Action','Bonus','Reaction'].forEach(k=>{const key=k.toLowerCase(),e=$('eco'+k),dragon=S.phase==='dragon';const unavailable=dragon&&key!=='action',used=dragon?(key==='action'?S.dragonEco.action:true):S.eco[key];e.classList.toggle('used',used);e.classList.toggle('na',unavailable);e.querySelector('span').textContent=unavailable?'Indisponible':used?'Utilisée':'Disponible'});
  document.querySelectorAll('.metachip[data-meta]').forEach(x=>x.classList.toggle('active',x.dataset.meta==='Renforcé'?S.empoweredArmed:x.dataset.meta===S.metaArmed));
  if($('mhPhase'))$('mhPhase').textContent=S.phase==='dragon'?'Dragon':'Samoth';if($('mhMovement')){$('mhMovement').classList.toggle('used',S.phase==='dragon'?S.dragonEco.movement:S.eco.movement)}
  if($('resultBadge'))$('resultBadge').classList.toggle('show',!!S.lastResult&&!$('ribbon').classList.contains('show'));
  renderJournal();save();
};

const txWrap=(name,fn)=>function(...args){modernPending=snapshot();const out=fn.apply(this,args);if(modernPending)modernPending=null;return out};
reactionSpell=txWrap('reactionSpell',reactionSpell);useWings=txWrap('useWings',useWings);armPure=txWrap('armPure',armPure);staffRecharge=txWrap('staffRecharge',staffRecharge);useVial=txWrap('useVial',useVial);freeHeal=txWrap('freeHeal',freeHeal);woodHeal=txWrap('woodHeal',woodHeal);
staff=function(v){const before=snapshot();S.staff=Math.max(0,Math.min(8,S.staff+v));presentResult('Bâton de confluence','Charges : '+S.staff+'/8.','', 'resource',before)};
endConc=function(){if(!S.concentration)return;const before=snapshot(),old=S.concentration;S.concentration='';if(old.includes('draconique')){S.dragon=false;S.phase='samoth'}presentResult('Concentration terminée',old+' prend fin.','', 'state',before)};

$('ribbonUndo').onclick=e=>{e.stopPropagation();undoLast()};$('ribbonCollapse').onclick=e=>{e.stopPropagation();collapseRibbon()};$('resultBadge').onclick=()=>{if(!S.lastResult)return;$('rb').textContent=S.lastResult.text;$('ribbon').classList.add('show');$('resultBadge').classList.remove('show');$('ribbonUndo').disabled=!S.lastUndo};
$('journalSearch').addEventListener('input',renderJournal);$('journalFilter').addEventListener('change',renderJournal);
$('resolutionModal').addEventListener('click',e=>{if(e.target===$('resolutionModal'))cancelResolution()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('resolutionModal').classList.contains('open'))cancelResolution()});
function toggleEconomy(id){const before=snapshot();if(S.phase==='dragon'){if(id!=='action'&&id!=='movement')return show('Cette ressource est indisponible pendant le tour du dragon.');S.dragonEco[id]=!S.dragonEco[id]}else S.eco[id]=!S.eco[id];presentResult('Économie d’action',(id==='reaction'?'Réaction':id.charAt(0).toUpperCase()+id.slice(1))+' mise à jour.','', 'state',before)}
document.querySelectorAll('.eco').forEach(e=>e.addEventListener('click',()=>toggleEconomy(e.id.replace('eco','').toLowerCase())));
[['mhAction','action'],['mhBonus','bonus'],['mhReaction','reaction'],['mhMovement','movement']].forEach(([id,key])=>$(id)?.addEventListener('click',()=>toggleEconomy(key)));
render();renderJournal();save();
