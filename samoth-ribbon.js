/* Ruban d’action : 7 secondes, clic pour fermer, succès vs indisponible */
let samothRibbonTimer=null;
const samothOriginalShow=show;

function samothRibbonIsBlocked(t){
  const s=String(t||'').toLowerCase();
  return [
    'déjà utilisée ce tour',
    'déjà utilisé ce tour',
    'pas assez de points',
    'impossible :',
    'aucun emplacement',
    'nécessite un sort',
    'épuisée',
    'épuisé',
    'déjà utilisées aujourd’hui',
    'déjà utilisé',
    'déjà au maximum',
    'aucun esprit draconique actif',
    'points convertibles déjà au maximum'
  ].some(x=>s.includes(x));
}

show=function(t,c){
  S.log.unshift(t);S.log=S.log.slice(0,30);
  $('rb').textContent=t;
  const ribbon=$('ribbon');
  const blocked=samothRibbonIsBlocked(t);
  ribbon.classList.remove('show','blocked');
  ribbon.classList.toggle('blocked',blocked);
  const title=ribbon.querySelector('.rt');
  if(title)title.textContent=blocked?'SAMOTH · ACTION INDISPONIBLE':'SAMOTH · RÉSULTAT';
  void ribbon.offsetWidth;
  ribbon.classList.add('show');
  if(samothRibbonTimer)clearTimeout(samothRibbonTimer);
  samothRibbonTimer=setTimeout(()=>ribbon.classList.remove('show'),7000);
  if(c&&!blocked)fx(c);
  render();save();
};

$('ribbon').addEventListener('click',()=>{
  if(samothRibbonTimer)clearTimeout(samothRibbonTimer);
  samothRibbonTimer=null;
  $('ribbon').classList.remove('show');
});
