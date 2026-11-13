/* Grimoire Samoth : ergonomie de Kobe, pictogrammes arcaniques originaux.
   Les capacités, les lancements et les emplacements restent gérés par companion.js. */
(()=>{'use strict';
 const storageKey='samoth:grimoire-favorites:v1';
 let query='',onlyFavorites=false,favorites=[];
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'[]');favorites=Array.isArray(saved)?saved.filter(x=>typeof x==='string').slice(0,4):[]}catch{}
 // Original Samoth glyphs. Keep Kobe's compact book layout, not Kobe's pictograms.
 const iconTypes={
   froid:'frost',defense:'ward',soin:'mercy',invocation:'vortex',
   soutien:'aurora',controle:'bind',arcane:'constellation'
 };
 const specific={rayon:'frost',cure:'mercy',vortex:'vortex',cone:'blizzard',
   shield:'ward',haste:'haste',counter:'counter',radiance:'aurora'};
 const paths={
   frost:'M20 3v34M3 20h34M8 8l24 24M32 8 8 32M20 3l-5 6m5-6 5 6M20 37l-5-6m5 6 5-6',
   blizzard:'M7 10l26 10-26 10M11 20h21M14 14l8 6-8 6M23 9l9 11-9 11',
   ward:'M20 3 33 9v12c0 8-6 13-13 16C13 34 7 29 7 21V9Z M12 20h16M20 12v16',
   mercy:'M17 7h6v10h10v6H23v10h-6V23H7v-6h10Z M10 10l4-4M30 30l4 4',
   vortex:'M31 15c-4-9-18-10-23 0-7 14 9 24 19 16 8-7 2-17-6-17-8 0-10 9-4 12 5 3 9-2 6-5',
   haste:'M23 3 9 22h11l-3 15 15-23H21Z M5 31h8M5 36h5',
   counter:'M20 3 32 10v12L20 36 8 22V10Z M12 12l16 16M28 12 12 28',
   aurora:'M20 3v34M3 20h34M8 8l24 24M32 8 8 32 M20 11l5 9-5 9-5-9Z',
   bind:'M6 13c6-10 22-10 28 0M6 27c6 10 22 10 28 0M12 9v22M28 9v22M12 20h16',
   constellation:'M7 12l13-7 13 12-10 17-16-8Z M7 12l16 22M20 5l3 29M7 26l26-9'
 };
 const glyphColors={
   frost:'#8fe9ff',blizzard:'#c6f6ff',ward:'#c3a6ff',mercy:'#88e5c9',
   vortex:'#9eacff',haste:'#f7d38c',counter:'#e5a9ed',
   aurora:'#8ed4fb',bind:'#aabff6',constellation:'#cad7ff'
 };
 const icon=(id,role)=>{
   const kind=specific[id]||iconTypes[role]||'constellation';
   const shell=document.createElement('span');
   shell.className='samoth-spell-glyph';
   shell.dataset.glyph=kind;
   shell.style.setProperty('--glyph-color',glyphColors[kind]);
   shell.setAttribute('aria-hidden','true');
   shell.innerHTML='<svg viewBox="0 0 40 40" focusable="false" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="17.2" fill="none" stroke="currentColor" stroke-opacity=".38" stroke-width="1.1"/><path d="'+paths[kind]+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
   return shell;
 };
 const node=(tag,cls,text='')=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=text;return n};
 const idFor=card=>card.querySelector('[data-cast]')?.dataset.cast||'';
 function decorate(selected){
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
 window.SamothGrimoireV2={decorate,favorite,setQuery,toggleFavorites};
})();