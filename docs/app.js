import { ENDINGS, SOURCES, PROTESTS } from './story.js';
import { OUTINGS, JOURNEY_EVIDENCE as EVIDENCE, JOURNEY_DEDUCTIONS as DEDUCTIONS } from './journey.js';
import { DESTINATIONS } from './alabama.js';
import { GolfGame } from './golf.js';
import { newGame, unlockedLocations, collect, respond, solve, finishRound, chooseEnding, validateSave, parseBackup, storageKey, travel, roundContext, roundOuting, roundFind, prepareRound, clearRound, nextOuting } from './state.js';
const $=(q,root=document)=>root.querySelector(q);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=$('#app'),dialog=$('#dialog'),KEY=storageKey(location.pathname);
let state=newGame(),view='course',caseTab='evidence',golf=null,armed=false,saveAvailable=true,installPrompt=null,toastTimer,lastFocus,importCandidate=null;
try{const raw=localStorage.getItem(KEY);if(raw)state=validateSave(JSON.parse(raw));}catch{saveAvailable=false;}
const icons={more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="m6 6 12 12M18 6 6 18"/></svg>',mark:'<svg class="brand-mark" viewBox="0 0 45 52" fill="none"><path d="M5 4h35v27c0 8-17.5 17-17.5 17S5 39 5 31Z" stroke="currentColor" stroke-width="1.3"/><path d="M22.5 11v25m0-25 11 5-11 5M12 34c5-4 16-4 21 0" stroke="currentColor" stroke-width="1.3"/><circle cx="16" cy="36" r="1.8" fill="currentColor"/></svg>'};
function save(){state.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));saveAvailable=true;}catch{if(saveAvailable)toast('Storage unavailable. Save a backup in the menu.');saveAvailable=false;}}
function toast(t){clearTimeout(toastTimer);$('#toast').textContent=t;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function showDialog(title,body,kicker='The Pension Plan'){if(!dialog.open)lastFocus=document.activeElement;dialog.innerHTML=`<div class="dialog-head"><span class="eyebrow">${esc(kicker)}</span><button class="icon-button" data-action="close" aria-label="Close">${icons.close}</button></div><div class="dialog-content"><h2 id="dialog-title">${esc(title)}</h2>${body}</div>`;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
function closeDialog(){dialog.close();if(lastFocus?.isConnected)lastFocus.focus();}
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeDialog();}});
function utilityHeader() {
  return `<header class="utility-header"><button class="text-button" data-action="view" data-view="course">← Golf</button><button class="icon-button" data-action="menu" aria-label="Menu">${icons.more}</button></header>`;
}
function render() {
  if (golf) { golf.destroy(); golf = null; }
  const playing = view === 'course';
  document.body.classList.toggle('playing', playing);
  if (playing) {
    prepareRound(state);
    app.innerHTML = courseView();
    mountGolf();
  } else {
    app.innerHTML = utilityHeader() + `<main class="main">${view === 'trail' ? trailView() : view === 'casebook' ? casebookView() : endingView()}</main>`;
  }
}
function courseView() {
  const location = DESTINATIONS[state.current];
  return `<main class="play-screen" aria-label="${esc(location.title)}"><section class="play-stage" aria-label="Golf course"><div class="course-body"><div id="golf-host" class="golf-host"></div>${state.rounds[state.current]?.finished ? resultView() : ''}</div></section><button class="game-menu" data-action="menu" aria-label="Menu">${icons.more}</button></main>`;
}
function mountGolf() {
  const i = state.current, location = DESTINATIONS[i], meta = roundContext(state), outing = roundOuting(state), find = roundFind(state);
  armed = true;
  golf = new GolfGame($('#golf-host'), {
    courseIndex: location.baseCourse, variant: meta.variant, saved: state.rounds[i],
    sound: state.settings.sound, assisted: state.settings.assisted, target: outing?.target,
    protestLevel: state.ending === 'seal' || state.ending === 'expose' ? 0 : state.chorus,
    finale: outing?.kind === 'finale',
    findable: find ? { id: find.clue, afterFlags: find.afterFlags, found: state.evidence.includes(find.clue) } : undefined,
    onFind: id => { collect(state, id); save(); foundDialog(id, find); },
    onChange: snapshot => { state.rounds[i] = snapshot; save(); },
    onComplete: result => {
      state.rounds[i] = golf.getSnapshot();
      finishRound(state, i, result);
      save();
      $('.result-card')?.remove();
      $('.course-body').insertAdjacentHTML('beforeend', resultView());
    }
  });
  state.rounds[i] = golf.getSnapshot();
  save();
}
function resultView(){const round=state.rounds[state.current],meta=roundContext(state),o=roundOuting(state);if(!round?.finished)return '';const find=roundFind(state);return `<div class="result-card"><div class="result-paper quiet-result"><div class="eyebrow">${esc(DESTINATIONS[state.current].title)}</div><strong class="round-total">${round.strokes}</strong><div class="eyebrow muted">Strokes</div><p>${esc(o?.target?(meta.won?'A debt is a debt.':'Another round, another chance.'):o?.after||'No hurry to be anywhere else.')}</p>${o?.kind==='finale'&&meta.won?'<button class="btn" data-action="ending-choice">Your signature ↗</button>':o?.reward&&meta.won?'<button class="btn" data-action="claim">Stay for a minute ↗</button>':'<button class="btn" data-action="clubhouse">Something cold? ↗</button>'}${find?'<button class="text-button" data-action="walk-green">Walk the green ↗</button>':''}<div class="result-small-actions"><button class="text-button" data-action="retry">Another five ↺</button><button class="text-button" data-action="open-trail">A change of scenery ↗</button></div></div></div>`;}
function foundDialog(id,f){const e=EVIDENCE.find(e=>e.id===id);if(!e)return;const paper=id==='brass-sign'?'<div class="invoice-paper"><div class="eyebrow">Field & Green Supply Co.</div><div class="invoice-type">DELIVERY COPY</div><div class="invoice-row"><span>Artificial turf</span><span class="circled">5 strips</span></div><div class="invoice-line"></div><div class="invoice-line short"></div><div class="handwritten">Why so much? — I.</div></div>':`<div class="found-note">${esc(f?.text||e.body)}</div>`;showDialog(e.title,`${paper}<button class="btn light" data-action="file-note">Keep it</button>`,'By the green');}
function clueLabel(id){return EVIDENCE.find(e=>e.id===id)?.title||'A scrap of paper';}
function clubhouse(){const l=DESTINATIONS[state.current],o=roundOuting(state),p=o?.person;const rounds=state.counts[state.current]||0;const lore=l.lore[Math.max(0,(rounds-1)%l.lore.length)];if(p){showDialog(p.name,`<p>${esc(p.opening)}</p><div class="choices">${p.choices.map(d=>`<button class="choice" data-action="response" data-id="${d.id}">${esc(d.label)}</button>`).join('')}</div>${rounds?`<button class="text-button" style="margin-top:18px" data-action="local-story">Anything worth seeing nearby? ↗</button>`:''}`,p.role);}else{showDialog(l.local.name,`<p>${rounds?'“Staying another day?”':'“Take your time out there.”'}</p><div class="choices"><button class="choice" data-action="local-story">What’s around here?</button><button class="choice" data-action="open-trail">Where would you play next?</button><button class="choice" data-action="close">Back to the green.</button></div>`,l.local.role);}}
function localStory(){const l=DESTINATIONS[state.current],rounds=state.counts[state.current]||0,story=l.lore[Math.max(0,(rounds-1)%l.lore.length)];if(!state.loreSeen.includes(story.id))state.loreSeen.push(story.id);save();showDialog(story.title,`<p>${esc(story.text)}</p><button class="btn light" data-action="file-note">Worth a detour.</button>`,'Around '+l.region);}
function response(id){const d=respond(state,state.current,id),o=roundOuting(state);if(!d)return;save();showDialog(o.person.name,`<p>${esc(d.response)}</p><div class="dialog-actions"><button class="btn light" data-action="clubhouse">Stay a little</button><button class="btn" data-action="file-note">See you around.</button></div>`,o.person.role);}
function claim(){const o=roundOuting(state);if(!o?.reward)return;const e=EVIDENCE.find(e=>e.id===o.reward);showDialog(e.title,`<div class="found-note">${esc(e.body)}</div><div class="dialog-actions"><button class="btn light" data-action="file-note">Keep it</button><button class="btn" data-action="open-trail">Time to go ↗</button></div>`,o.person?.name||'After the round');}
function trailView(){const available=unlockedLocations(state),next=nextOuting(state);return `<div class="page-heading"><div><div class="eyebrow">No fixed return date</div><h1>A little more Alabama.</h1></div></div><div class="open-trail"><div class="trail-map"><div class="map-title"><div class="eyebrow">The Yellowhammer State</div><div class="serif">Stay a while.</div></div>${mapSVG()}<div class="map-legend"><span>11 PLACES TO PLAY</span><span>NOT TO SCALE</span></div></div><div class="open-locations">${DESTINATIONS.map(l=>`<button class="location-row" data-action="travel" data-index="${l.index}" ${available.includes(l.index)?'':'disabled'}><span class="num">${String(l.index+1).padStart(2,'0')}</span><div><h3>${esc(l.title)}</h3><div class="meta">${esc(l.region)}${l.index===state.current?' · You are here':state.counts[l.index]?` · ${state.counts[l.index]} rounds`:''}</div></div><span class="row-arrow">${available.includes(l.index)?'↗':'·'}</span></button>`).join('')}</div></div>${!state.totalRounds?'<p class="route-note">First, settle into your opening round.</p>':next?`<button class="text-button" style="margin-top:20px" data-action="postcard">A note from reception ↗</button>`:'<p class="route-note">The days are yours.</p>'}`;}
function mapSVG(){return `<svg viewBox="0 0 470 560" role="img" aria-label="Golf destinations across Alabama"><defs><pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#c8d4bd" stroke-width=".6"/></pattern></defs><rect width="470" height="560" fill="url(#map-grid)"/><path class="map-water" d="M0 460Q150 477 217 470T470 485V560H0Z"/><path class="map-land" d="M173 88 330 88 340 247 358 346 339 453 194 453 177 478 145 471 133 428 153 319 150 220Z"/><path class="map-road" d="m183 89 18 117 30 53-12 85-69 103M322 101 4 108-71 88-15 137M156 200l176 4M148 319l201 4M143 402l200-5"/><path d="M244 95Q286 142 260 196T273 313 263 419" fill="none" stroke="#b4cbc7" stroke-width="5"/><text x="218" y="385" fill="#b4bea4" font-family="Georgia" font-size="20" transform="rotate(-86 218 385)" letter-spacing="7">ALABAMA</text>${DESTINATIONS.map(l=>`<g class="map-pin ${l.index===state.current?'current':''}" transform="translate(${l.map.x} ${l.map.y})"><circle r="12"/><text y=".5">${l.index+1}</text></g>`).join('')}</svg>`;}
function casebookView(){const evidence=EVIDENCE.filter(e=>state.evidence.includes(e.id)),lore=DESTINATIONS.flatMap(l=>l.lore).filter(l=>state.loreSeen.includes(l.id));return `<div class="page-heading"><div><div class="eyebrow">Things picked up along the way</div><h1>The notebook.</h1></div></div><div class="case-tabs"><button class="${caseTab==='evidence'?'active':''}" data-action="case-tab" data-tab="evidence">Pockets</button><button class="${caseTab==='places'?'active':''}" data-action="case-tab" data-tab="places">Places & people</button>${evidence.length>=4?`<button class="${caseTab==='deductions'?'active':''}" data-action="case-tab" data-tab="deductions">Loose ends</button>`:''}</div>${caseTab==='places'?lore.length?`<div class="souvenir-list">${lore.map(l=>`<button class="souvenir" data-action="lore" data-id="${l.id}"><span class="eyebrow muted">A local recommendation</span><h3>${esc(l.title)}</h3><span>↗</span></button>`).join('')}</div>`:'<p class="route-note">Ask around. People have stories.</p>':caseTab==='deductions'?deductionsView():evidence.length?`<div class="souvenir-list">${evidence.map(e=>`<button class="souvenir" data-action="evidence" data-id="${e.id}"><span class="eyebrow muted">${esc(e.kind)}</span><h3>${esc(e.title)}</h3><span>↗</span></button>`).join('')}</div>`:'<p class="route-note">A pencil. A scorecard. A little room left.</p>'}${state.finalWin?'<button class="text-button" style="margin-top:30px" data-action="ending-choice">The last signature ↗</button>':''}`;}
function deductionsView(){const visible=DEDUCTIONS.filter(d=>d.required.some(id=>state.evidence.includes(id)));return `<div class="deductions">${visible.map(d=>{const done=state.solved.includes(d.id),ready=d.required.every(id=>state.evidence.includes(id));return `<article class="deduction-card ${done?'done':''}"><div class="eyebrow">${done?'Filed':'A loose end'}</div><h3>${esc(d.title)}</h3><button class="btn ${done?'light':''}" data-action="deduction" data-id="${d.id}" ${ready?'':'disabled'}>${done?'Revisit':'Think it through'} ↗</button>${!ready?'<div class="evidence-count">Something is missing.</div>':''}</article>`;}).join('')}</div>`;}
function evidenceDialog(id,detail=false){const e=EVIDENCE.find(e=>e.id===id);if(!e||!state.evidence.includes(id))return;showDialog(e.title,`<div class="found-note">${esc(detail?e.detail:e.body)}</div><div class="dialog-actions">${!detail?`<button class="btn light" data-action="evidence-detail" data-id="${id}">Look again</button>`:''}<button class="btn" data-action="close">Put it away</button></div>`,e.kind);}
function deductionDialog(id,wrong=false){const d=DEDUCTIONS.find(d=>d.id===id);if(!d||!d.required.every(id=>state.evidence.includes(id)))return;const done=state.solved.includes(id);showDialog(d.title,`<p>${esc(done?d.explanation:d.prompt)}</p>${wrong?'<p class="small">That doesn’t quite fit.</p>':''}${done?'<button class="btn" data-action="close">Filed</button>':`<div class="deduction-evidence">${d.required.map(id=>`<span>${esc(clueLabel(id))}</span>`).join('')}</div><div class="choices">${d.options.map(o=>`<button class="choice" data-action="solve" data-id="${id}" data-answer="${o.id}">${esc(o.label)}</button>`).join('')}</div>`}`,'A quiet thought');}
function endingChoice(){if(!state.finalWin)return;showDialog('Your instructions.','<p>The Architect lays down his pen.</p><button class="ending-choice" data-action="choose-ending" data-ending="seal">Close the account.<span>↗</span></button>'+`<button class="ending-choice" data-action="choose-ending" data-ending="expose" ${state.trust>=2?'':'disabled'}>Make it public.<span>↗</span>${state.trust<2?'<small>You’ll need someone willing to stand beside you.</small>':''}</button>`+'<button class="ending-choice" data-action="choose-ending" data-ending="accept">Ask about the benefits.<span>↗</span></button>','One final signature');}
function endingView(){const e=ENDINGS[state.ending];return e?`<div class="ending-wrap"><div class="eyebrow">${esc(e.kicker)}</div><h1>${esc(e.title)}.</h1><div class="ending-copy">${esc(e.body)}</div><button class="btn" data-action="open-trail">Stay another day ↗</button></div>`:'';}
function menu() {
  const location = DESTINATIONS[state.current], finished = state.rounds[state.current]?.finished;
  showDialog(location.title, `<div class="pause-actions"><button class="btn" data-action="resume">Back to golf</button>${finished ? '<button class="choice" data-action="scorecard">Scorecard</button>' : ''}<button class="choice" data-action="clubhouse">Clubhouse</button><button class="choice" data-action="open-trail">Explore Alabama</button>${state.evidence.length || state.loreSeen.length ? '<button class="choice" data-action="view" data-view="casebook">Notebook</button>' : ''}<button class="choice" data-action="settings">Settings</button></div>`, location.region);
}
function settings() {
  showDialog('Settings', `<div class="setting"><span>Sound</span><button class="toggle ${state.settings.sound ? 'on' : ''}" data-action="toggle-sound" role="switch" aria-checked="${state.settings.sound}" aria-label="Sound"></button></div><div class="setting"><span>Golf assistance</span><button class="toggle ${state.settings.assisted ? 'on' : ''}" data-action="toggle-assist" role="switch" aria-checked="${state.settings.assisted}" aria-label="Golf assistance"></button></div><div class="settings-buttons"><button class="btn light" data-action="backup">Save backup ↓</button><button class="btn light" data-action="restore">Open backup ↑</button><button class="btn light" data-action="help">Controls</button><button class="btn light" data-action="install">Install</button></div><div class="settings-links">${state.rounds[state.current] && !state.rounds[state.current].finished ? '<button class="text-button" data-action="restart-round">Restart round</button>' : ''}<button class="text-button" data-action="about">About</button><button class="text-button" data-action="new-game">New holiday</button></div>`, 'The Pension Plan');
}
function help(){showDialog('Pull back. Let go.','<p>Pull opposite your shot. Release to swing.</p><p class="small">Return to the ball to cancel. Drag the ground to look around; pinch or scroll to zoom. Chip carries. Roll stays low.</p><div class="help-keys"><span>Aim / power</span><span><kbd>← →</kbd> <kbd>↑ ↓</kbd></span><span>Swing / club</span><span><kbd>Space</kbd> <kbd>C</kbd></span></div><p class="footnote">Keyboard controls work while the course has focus. Assistance is available in the menu.</p><button class="btn" data-action="close">Let’s try.</button>','Golf controls');}
function about(){showDialog('A golf holiday.',`<p class="small">An open-ended Alabama trip by Ryan L. Melvin. Original compact courses, local stories, and something to notice if you stay long enough.</p><p class="small">Fictional characters and events in real Alabama places. Unaffiliated with RSA or the Robert Trent Jones Golf Trail.</p><details><summary style="font-size:12px;cursor:pointer;margin:18px 0">Real places & reading ↗</summary><ul class="source-list">${SOURCES.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a></li>`).join('')}</ul></details><p class="footnote">This first edition has 11 destinations, 33 local stories, and a long mystery arc. Golf and travel continue after its resolution.</p>`,'The Pension Plan');}
async function install(){if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}showDialog('Take it with you.','<p class="small">Use Install app or Add to Home Screen in your browser. Safari: Share → Add to Home Screen, or File → Add to Dock on Mac.</p><p class="small">Open online once for offline play. Saves stay in this browser; use a backup to move between devices or installations.</p><div class="dialog-actions"><button class="btn light" data-action="backup">Save backup ↓</button><button class="btn" data-action="persist">Keep my save</button></div>','Install & offline');}
function backup(){if(golf&&armed)state.rounds[state.current]=golf.getSnapshot();save();const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='the-pension-plan-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Packed.');}
function restartRound(){if(golf){golf.destroy();golf=null;}clearRound(state);save();render();}
document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;switch(el.dataset.action){
case 'view':if(dialog.open)closeDialog();view=el.dataset.view;render();window.scrollTo(0,0);break;
case 'resume':if(dialog.open)closeDialog();if(view!=='course'){view='course';render();}break;
case 'close':closeDialog();break;
case 'clubhouse':clubhouse();break;
case 'local-story':localStory();break;
case 'response':response(el.dataset.id);break;
case 'claim':claim();break;
case 'file-note':closeDialog();render();break;
case 'walk-green':$('.result-card')?.remove();break;
case 'scorecard':if(dialog.open)closeDialog();view='course';render();break;
case 'retry':if(dialog.open)closeDialog();restartRound();break;
case 'restart-round':showDialog('A fresh card?','<p>This round will be set aside.</p><div class="dialog-actions"><button class="btn light" data-action="close">Keep playing</button><button class="btn" data-action="confirm-round">Start fresh ↺</button></div>');break;
case 'confirm-round':closeDialog();restartRound();break;
case 'travel':{const i=Number(el.dataset.index);if(golf){golf.destroy();golf=null;}if(travel(state,i)){save();view='course';render();window.scrollTo(0,0);}break;}
case 'postcard':{const o=nextOuting(state),waiting=o.kind==='finale'&&!DEDUCTIONS.every(d=>state.solved.includes(d.id));showDialog('No rush.',waiting?'<p>“Your last appointment can wait. A few loose ends first.”</p><button class="btn light" data-action="open-notebook">Open the notebook ↗</button>':`<p>“We’ve kept a tee time for you at ${esc(DESTINATIONS[o.location].title)}.”</p><button class="btn light" data-action="close">Good to know.</button>`,'Reception');break;}
case 'open-notebook':closeDialog();caseTab='deductions';view='casebook';render();break;
case 'open-trail':if(dialog.open)closeDialog();view='trail';render();break;
case 'case-tab':caseTab=el.dataset.tab;render();break;
case 'evidence':evidenceDialog(el.dataset.id);break;
case 'evidence-detail':evidenceDialog(el.dataset.id,true);break;
case 'lore':{const l=DESTINATIONS.flatMap(l=>l.lore).find(l=>l.id===el.dataset.id);showDialog(l.title,`<p>${esc(l.text)}</p><a class="text-button" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.sourceTitle)} ↗</a>`,'A local story');break;}
case 'deduction':deductionDialog(el.dataset.id);break;
case 'solve':if(solve(state,el.dataset.id,el.dataset.answer)){save();render();showDialog('That fits.',`<p>${esc(DEDUCTIONS.find(d=>d.id===el.dataset.id).explanation)}</p><button class="btn light" data-action="close">Close the notebook.</button>`,'A loose end');}else deductionDialog(el.dataset.id,true);break;
case 'ending-choice':endingChoice();break;
case 'choose-ending':if(chooseEnding(state,el.dataset.ending)){save();closeDialog();view='ending';render();}break;
case 'menu':menu();break;
case 'settings':settings();break;
case 'help':help();break;
case 'about':about();break;
case 'toggle-sound':state.settings.sound=!state.settings.sound;save();golf?.setSound(state.settings.sound);settings();break;
case 'toggle-assist':state.settings.assisted=!state.settings.assisted;save();render();settings();break;
case 'install':await install();break;
case 'persist':{const kept=await navigator.storage?.persist?.().catch(()=>false);toast(kept?'Your browser will protect this save.':'A backup is your safest bet.');break;}
case 'backup':backup();break;
case 'restore':$('#restore-file').click();break;
case 'confirm-restore':if(importCandidate){if(golf){golf.destroy();golf=null;}state=importCandidate;importCandidate=null;save();closeDialog();view='course';render();toast('Welcome back.');}break;
case 'new-game':showDialog('Another holiday?','<p>Your current trip will be replaced.</p><div class="dialog-actions"><button class="btn light" data-action="backup">Save it first ↓</button><button class="btn" data-action="confirm-new">Begin again ↗</button></div>');break;
case 'confirm-new':if(golf){golf.destroy();golf=null;}state=newGame();save();closeDialog();view='course';caseTab='evidence';render();break;
}});
$('#restore-file').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>500000)throw Error();importCandidate=parseBackup(await file.text());showDialog('Unpack this holiday?',`<p>${importCandidate.totalRounds} rounds. ${importCandidate.loreSeen.length} local stories.</p><p class="small">This replaces the trip on this device.</p><div class="dialog-actions"><button class="btn light" data-action="close">Keep this one</button><button class="btn" data-action="confirm-restore">Restore ↗</button></div>`);}catch{importCandidate=null;toast('That isn’t a valid Pension Plan save.');}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('pagehide',()=>{if(golf&&armed)state.rounds[state.current]=golf.getSnapshot();save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&golf&&armed){state.rounds[state.current]=golf.getSnapshot();save();}});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>toast('Offline play isn’t ready yet. Try again online.'));
render();if(!saveAvailable)toast('Local storage is unavailable. Use Save backup in the menu.');
