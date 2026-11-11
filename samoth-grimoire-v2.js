/* Grimoire catalogue Samoth, même langage d'interaction et pictogrammes que Kobe.
   Les capacités, les lancements et les emplacements restent gérés par companion.js. */
(()=>{'use strict';
 const storageKey='samoth:grimoire-favorites:v1';
 let selected='rayon',query='',onlyFavorites=false,favorites=[];
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');favorites=Array.isArray(saved)?saved.filter(x=>typeof x==='string').slice(0,4):[]}catch{}
 const iconNames={froid:'grimoire-slow',defense:'grimoire-circle',soin:'grimoire-heal',invocation:'grimoire-fireball',soutien:'grimoire-circle',controle:'grimoire-slow',arcane:'grimoire-flame'};
 const known={rayon:'grimoire-slow',cure:'grimoire-heal',vortex:'grimoire-fireball',cone:'grimoire-slow',shield:'grimoire-circle',haste:'grimoire-circle',counter:'grimoire-circle',radiance:'grimoire-fireball'};
 const icon=(id,role)=>{
   const img=document.createElement('img');img.className='samoth-spell-glyph';
   img.alt='';img.width=38;img.height=38;
   img.src='assets/grimoire-icons/'+(known[id]||iconNames[role]||iconNames.arcane)+'.svg';
   return img;
 };
 const node=(tag,cls,text='')=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=text;return n};
 const idFor=card=>card.querySelector('[data-cast]')?.dataset.cast||'';
 function decorate(){
   const host=document.getElementById('spellList');if(!host)return;
   const cards=[...host.querySelectorAll('.spell-section .spell')],slots=host.querySelector('.spell-slots'),filter=host.querySelector('.spell-legend');
   if(!cards.length)return;
   const sources=cards.map(card=>{
     const id=idFor(card);
     const role=[...card.classList].find(c=>c.startsWith('role-'))?.slice(5)||'arcane';
     const name=card.querySelector('h3')?.textContent||'Sort',level=card.closest('.spell-section')?.querySelector('h2')?.textContent||'';
     const casting=card.querySelector('.eyebrow')?.textContent||'';
     const range=card.querySelector('.meta')?.textContent||'';
     const searchable=[name,level,role,casting,range,card.querySelector('.spell-doc')?.textContent||''].join(' ').toLocaleLowerCase('fr');
     return {card,id,role,name,level,casting,range,searchable};
   }).filter(r=>r.id);
   const visible=sources.filter(r=>(!onlyFavorites||favorites.includes(r.id))&&r.searchable.includes(query.toLocaleLowerCase('fr')));
   if(!visible.some(x=>x.id===selected))selected=visible[0]?.id||'';
   const chosen=visible.find(x=>x.id===selected);
   const shell=node('section','samoth-kobe-grimoire');
   shell.setAttribute('aria-label','Grimoire de Samoth');
   const head=node('header','samoth-book-header');
   const title=node('div','samoth-book-heading');title.append(node('h2','', 'Grimoire'),node('small','', 'Catalogue de sorts · Samoth'));
   head.append(title);shell.append(head);
   if(slots){slots.classList.add('samoth-book-slots');shell.append(slots);}
   const tools=node('div','samoth-book-tools');
   const search=node('input','samoth-book-search');search.type='search';search.id='samothSpellSearch';
   search.placeholder='Rechercher un sort ou un pouvoir';search.autocomplete='off';search.value=query;
   search.setAttribute('aria-label','Rechercher un sort dans le grimoire');
   const fav=node('button','samoth-book-fav','☆ Favoris');fav.type='button';fav.dataset.samothBookFavorites='';
   fav.setAttribute('aria-pressed',String(onlyFavorites));tools.append(search,fav);
   shell.append(tools);
   if(filter){filter.classList.add('samoth-book-filters');shell.append(filter);}
   const layout=node('div','samoth-book-layout'),list=node('div','samoth-book-list'),details=node('aside','samoth-book-detail');
   list.setAttribute('aria-label','Catalogue des sorts');details.setAttribute('aria-label','Fiche du sort sélectionné');
   if(!visible.length)list.append(node('p','samoth-book-empty','Aucun sort ne correspond aux filtres.'));
   for(const record of visible){
     const row=node('div','samoth-book-entry role-'+record.role);
     const select=node('button','samoth-book-select');select.type='button';
     select.dataset.samothBookSelect=record.id;select.setAttribute('aria-pressed',String(record.id===selected));
     const name=node('span','samoth-book-name');name.append(node('strong','',record.name),node('small','',record.level));
     const cast=node('span','samoth-book-cast',record.casting.split(' · ')[0]);
     select.append(icon(record.id,record.role),name,cast);
     const star=node('button','samoth-book-star',favorites.includes(record.id)?'★':'☆');
     star.type='button';star.dataset.samothBookFavorite=record.id;star.setAttribute('aria-pressed',String(favorites.includes(record.id)));
     star.setAttribute('aria-label',(favorites.includes(record.id)?'Retirer des favoris : ':'Ajouter aux favoris : ')+record.name);
     if(favorites.length>=4&&!favorites.includes(record.id))star.disabled=true;
     row.append(select,star);list.append(row);
   }
   if(chosen){
     const subtitle=node('div','samoth-book-sheet-title');subtitle.append(icon(chosen.id,chosen.role));
     const text=node('div','');text.append(node('small','',chosen.level+' · '+chosen.casting),node('h3','',chosen.name));subtitle.append(text);details.append(subtitle);
     chosen.card.classList.add('samoth-book-sheet');
     chosen.card.querySelector('.spell-doc')?.setAttribute('open','');
     details.append(chosen.card);
   }else details.append(node('p','samoth-book-empty','Sélectionne un sort pour afficher sa fiche.'));
   layout.append(list,details);shell.append(layout);host.replaceChildren(shell);
 }
 function choose(id){selected=id;}
 function favorite(id){if(favorites.includes(id))favorites=favorites.filter(x=>x!==id);else if(favorites.length<4)favorites.push(id);
   try{localStorage.setItem(storageKey,JSON.stringify(favorites))}catch{}
 }
 function setQuery(value){query=String(value||'');}
 function toggleFavorites(){onlyFavorites=!onlyFavorites;}
 window.SamothGrimoireV2={decorate,choose,favorite,setQuery,toggleFavorites};
})();