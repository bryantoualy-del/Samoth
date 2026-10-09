/* Small adapters invoke each character's real melee engine. */
(()=>{'use strict';const b=window.__CompanionBridge;if(!b||!window.RPGReactions)return;
 const configs=window.RPGOpportunityConfig||[];
 if(!configs.length){const button=document.createElement('button');button.type='button';button.dataset.opportunity='native';button.textContent='Attaque d’opportunité';button.className='rpg-group-launch';const group=document.querySelector('.rpg-group-launch');group?.after(button);if(!b.nativeReactionAttack){
  // Indisponible mécaniquement, mais activable au toucher pour expliquer pourquoi.
  // Ne pas ajouter cette option au registre des réactions : aucun jet ni coût ne doit partir vers Encounter.
  button.setAttribute('aria-disabled','true');
  button.classList.add('rpg-opportunity-unavailable');
  button.title='Attaque d’opportunité indisponible sur cette fiche';
  const style=document.createElement('style');
  style.textContent='.rpg-opportunity-unavailable{opacity:.58;filter:saturate(.55);cursor:not-allowed}.rpg-opportunity-info{color:#f8eddb;background:#18212b;border:1px solid #d5a95f;border-radius:16px;width:min(420px,calc(100vw - 32px));padding:20px;box-shadow:0 16px 48px #0008}.rpg-opportunity-info::backdrop{background:#0009}.rpg-opportunity-info h2{font-size:1.12rem;margin:0 0 12px}.rpg-opportunity-info p{margin:0 0 18px;line-height:1.5}.rpg-opportunity-info button{display:block;margin-left:auto;padding:10px 18px;border-radius:9px;background:#284152;color:#f8eddb;border:1px solid #d5a95f;min-height:44px}';
  document.head.append(style);
  const dialog=document.createElement('dialog');
  dialog.className='rpg-opportunity-info';
  dialog.setAttribute('aria-label','Attaque d’opportunité indisponible');
  const heading=document.createElement('h2');
  heading.textContent='Attaque d’opportunité indisponible';
  const explanation=document.createElement('p');
  explanation.textContent='Samoth n’a pas d’attaque d’opportunité configurée dans son compagnon. Ses réactions magiques (Bouclier, Ailes protectrices et Contresort) restent disponibles selon les circonstances.';
  const close=document.createElement('button');
  close.type='button';
  close.textContent='Compris';
  close.onclick=()=>dialog.close();
  dialog.append(heading,explanation,close);
  document.body.append(dialog);
  button.onclick=()=>{if(!dialog.open)dialog.showModal()};
}else{button.onclick=()=>b.nativeReactionAttack();configs.push({id:'opportunity-native',label:'Attaque d’opportunité',selector:'[data-opportunity=native]'})}}
 window.RPGOpportunityConfig=configs;
})();
