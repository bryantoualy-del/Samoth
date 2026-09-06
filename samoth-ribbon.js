/* Ruban d’action : 7 secondes, clic pour fermer */
let samothRibbonTimer=null;
const samothOriginalShow=show;
show=function(t,c){
  S.log.unshift(t);S.log=S.log.slice(0,30);
  $('rb').textContent=t;
  const ribbon=$('ribbon');
  ribbon.classList.remove('show');
  void ribbon.offsetWidth;
  ribbon.classList.add('show');
  if(samothRibbonTimer)clearTimeout(samothRibbonTimer);
  samothRibbonTimer=setTimeout(()=>ribbon.classList.remove('show'),7000);
  if(c)fx(c);
  render();save();
};
$('ribbon').addEventListener('click',()=>{
  if(samothRibbonTimer)clearTimeout(samothRibbonTimer);
  samothRibbonTimer=null;
  $('ribbon').classList.remove('show');
});
