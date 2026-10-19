/* Samoth's recorded 2014 build; state migration never resets live resources. */
(()=>{'use strict';
 const profile=Object.freeze({level:10,scores:{str:8,dex:13,con:14,int:12,wis:10,cha:17},metamagic:['quick','twin','empower'],level8Feat:'fizban:feat:gift-of-the-metallic-dragon',castingAbility:'cha'});
 function migrate(s){
  s.featEnabled=false;s.intensified=false;s.featSp=0;
  s.level8Feat=profile.level8Feat;s.classMetamagic=[...profile.metamagic];
  if(!['int','wis','cha'].includes(s.draconicHealingAbility))s.draconicHealingAbility=profile.castingAbility;
  if(!['none',...profile.metamagic].includes(s.meta))s.meta='none';
  if(s.undo&&typeof s.undo==='object')migrate(s.undo);
  s.metallicFeatMigration=1;return s;
 }
 const proficiency=()=>2+Math.floor((profile.level-1)/4);
 const healingModifier=s=>Math.floor((profile.scores[s.draconicHealingAbility??profile.castingAbility]-10)/2);
 const wingsEligible=q=>q.magicMissile!==true&&q.visible!==false&&q.targetVisible!==false&&(q.self||q.rangeFeet==null||Number.isFinite(q.rangeFeet)&&q.rangeFeet>=0&&q.rangeFeet<=5);
 globalThis.SamothFeatRules={profile,migrate,proficiency,healingModifier,wingsEligible};
})();
