(()=>{
  const g=id=>document.getElementById(id);
  function sync(){
    const hp=g('hpInput'); if(hp&&g('mhHp')) g('mhHp').textContent=hp.value||'0';
    const turn=g('turnN'); if(turn&&g('mhTurn')) g('mhTurn').textContent=turn.textContent;
    const dmg=g('turnDamage'); if(dmg&&g('mhDamage')) g('mhDamage').textContent=dmg.textContent;
    const conc=g('concName'); if(conc&&g('mhConcName')){
      const txt=conc.textContent.trim()||'Aucune'; g('mhConcName').textContent=txt;
      g('mhConc')?.classList.toggle('active',txt!=='Aucune');
    }
    [['ecoAction','mhAction'],['ecoBonus','mhBonus'],['ecoReaction','mhReaction']].forEach(([src,dst])=>{
      const s=g(src),d=g(dst); if(!s||!d)return;
      d.classList.toggle('used',s.classList.contains('used'));
      d.classList.toggle('free',!s.classList.contains('used'));
    });
    const slots=g('slots'), mini=g('mhSlots');
    if(slots&&mini){
      const rows=[...slots.querySelectorAll('.slotrow')];
      mini.innerHTML=rows.map((r,i)=>{
        const count=r.querySelector('.slotcount')?.textContent?.trim()||'';
        return `<div class="mh-slot"><span>N${i+1}</span><b>${count.replace(/\s+/g,' ')}</b></div>`;
      }).join('');
    }
  }
  const observer=new MutationObserver(sync);
  window.addEventListener('DOMContentLoaded',()=>{
    ['slots','turnN','turnDamage','concName','ecoAction','ecoBonus','ecoReaction'].forEach(id=>{const e=g(id);if(e)observer.observe(e,{subtree:true,childList:true,characterData:true,attributes:true});});
    const hp=g('hpInput'); if(hp){hp.addEventListener('input',sync);observer.observe(hp,{attributes:true,attributeFilter:['value']});}
    sync(); setTimeout(sync,80); setTimeout(sync,350);
  });
  const oldRender=window.render;
  if(typeof oldRender==='function') window.render=function(...a){const r=oldRender.apply(this,a);requestAnimationFrame(sync);return r};
  setInterval(()=>{if(window.innerWidth<=760)sync()},700);
})();