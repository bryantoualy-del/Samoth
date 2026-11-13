/* Grimoire Samoth : ergonomie de Kobe, pictogrammes arcaniques originaux.
   Les capacités, les lancements et les emplacements restent gérés par companion.js. */
(()=>{'use strict';
 const storageKey='samoth:grimoire-favorites:v1';
 let query='',onlyFavorites=false,favorites=[];
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');favorites=Array.isArray(saved)?saved.filter(x=>typeof x==='string').slice(0,4):[]}catch{}
 const icon=(id)=>{
   const img=document.createElement('img');
   img.className='samoth-spell-glyph';img.alt='';img.width=38;img.height=38;
   img.addEventListener('error',()=>{img.src='assets/samoth-spells/default.svg';},{once:true});
   img.src='assets/samoth-spells/'+id+'.svg';
   return img;
 };
 const node=(tag,cls,text='')=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=text;return n};
 const idFor=card=>card.querySelector('[data-cast]')?.dataset.cast||'';
 function decorate(selected,roleFilter){
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
   const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
   const visible=sources.filter(r=>(roleFilter==='all'||r.role===roleFilter)&&(!onlyFavorites||favorites.includes(r.id))&&normalize(r.searchable).includes(normalize(query)));
   const chosen=sources.find(x=>x.id===selected);
   const shell=node('section','samoth-kobe-grimoire');
   shell.setAttribute('aria-label','Grimoire de Samoth');
   if(slots){slots.classList.add('samoth-book-slots');shell.append(slots);}
   const tools=node('div','samoth-book-tools');
   const search=node('input','samoth-book-search');search.type='search';search.id='samothSpellSearch';
   search.placeholder='Rechercher un sort ou un pouvoir';search.autocomplete='off';search.value=query;
   search.setAttribute('aria-label','Rechercher un sort dans le grimoire');
   const fav=node('button','samoth-book-fav','☆ Favoris');fav.type='button';fav.dataset.samothBookFavorites='';
   fav.setAttribute('aria-pressed',String(onlyFavorites));tools.append(search,fav);

   const layout=node('div','samoth-book-layout'),list=node('div','samoth-book-list'),details=node('aside','samoth-book-detail');
   list.setAttribute('aria-label','Catalogue des sorts');details.setAttribute('aria-label','Fiche du sort sélectionné');
   if(!visible.length)list.append(node('p','samoth-book-empty','Aucun sort ne correspond aux filtres.'));
   for(const record of visible){
     const row=node('div','samoth-book-entry role-'+record.role);
     const select=node('button','samoth-book-select');select.type='button';
     select.dataset.samothBookSelect=record.id;select.setAttribute('aria-pressed',String(record.id===selected));
     const name=node('span','samoth-book-name');name.append(node('strong','',record.name),node('small','',record.level));
     const cast=node('span','samoth-book-cast',record.casting.split(' · ')[0]);
     select.append(icon(record.id),name,cast);
     const star=node('button','samoth-book-star',favorites.includes(record.id)?'★':'☆');
     star.type='button';star.dataset.samothBookFavorite=record.id;star.setAttribute('aria-pressed',String(favorites.includes(record.id)));
     star.setAttribute('aria-label',(favorites.includes(record.id)?'Retirer des favoris : ':'Ajouter aux favoris : ')+record.name);
     if(favorites.length>=4&&!favorites.includes(record.id))star.disabled=true;
     row.append(select,star);list.append(row);
   }
   if(chosen){
     const subtitle=node('div','samoth-book-sheet-title');subtitle.append(icon(chosen.id));
     const text=node('div','');text.append(node('small','',chosen.level+' · '+chosen.casting),node('h3','',chosen.name));subtitle.append(text);details.append(subtitle);
     chosen.card.classList.add('samoth-book-sheet');
     const launch=chosen.card.querySelector('[data-cast]');
     if(launch){const outlet=node('div','book-cast-controls');outlet.id='bookCastHome';launch.replaceWith(outlet);}
     details.append(chosen.card);
   }else details.append(node('p','samoth-book-empty','Sélectionne un sort pour afficher sa fiche.'));
   const navigation=node('div','samoth-book-navigation');
   navigation.append(tools);
   if(filter){filter.classList.add('samoth-book-filters');navigation.append(filter);}
   navigation.append(list);
   layout.append(navigation,details);shell.append(layout);host.replaceChildren(shell);
 }
 function favorite(id){if(favorites.includes(id))favorites=favorites.filter(x=>x!==id);else if(favorites.length<4)favorites.push(id);
   try{localStorage.setItem(storageKey,JSON.stringify(favorites))}catch{}
 }
 function setQuery(value){query=String(value||'');}
 function toggleFavorites(){onlyFavorites=!onlyFavorites;}
 window.SamothGrimoireV2={icon,decorate,favorite,setQuery,toggleFavorites};
})();