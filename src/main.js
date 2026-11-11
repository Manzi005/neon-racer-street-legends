(function () {
  const N=window.NeonRace=window.NeonRace||{};
  N.bus={events:{},on(name,fn){(this.events[name]||(this.events[name]=[])).push(fn)},emit(name,data){(this.events[name]||[]).forEach(fn=>fn(data))}};
  const SAVE_KEY='neon-racer-street-legends-v1';
  const defaults={credits:0,unlockedCars:['pulse'],unlockedTracks:['neon-bay'],records:{},settings:{muted:false,musicVolume:.24,sfxVolume:.7,musicMuted:false,sfxMuted:false,difficulty:'normal'},championship:{race:0,points:0}};
  function loadSave(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return structuredClone(defaults);const saved=JSON.parse(raw),settings={...defaults.settings,...saved.settings};['musicVolume','sfxVolume'].forEach(key=>{const value=Number(settings[key]);settings[key]=Number.isFinite(value)?Math.max(0,Math.min(1,value)):defaults.settings[key]});return{...structuredClone(defaults),...saved,settings,championship:{...defaults.championship,...saved.championship},records:saved.records||{},unlockedCars:Array.isArray(saved.unlockedCars)?saved.unlockedCars:['pulse'],unlockedTracks:Array.isArray(saved.unlockedTracks)?saved.unlockedTracks:['neon-bay']}}catch(error){console.warn('Save data could not be read; starting a fresh profile.',error);return structuredClone(defaults)}}
  const save=loadSave(),controls=new N.Controls(),audio=new N.AudioEngine(save.settings);
  audio.setMuted(save.settings.muted);
  const canvas=document.getElementById('game-canvas'),layer=document.getElementById('screen-layer'),hud=document.getElementById('race-hud');
  let selectedCar='pulse',selectedTrack='neon-bay',selectedDifficulty=save.settings.difficulty||'normal',mode='quick',game;
  const bestKey=(track)=>`${track}:${mode}`;
  const fmt=(sec)=>{if(!Number.isFinite(sec))return'--:--.--';const m=Math.floor(sec/60),s=(sec%60).toFixed(2).padStart(5,'0');return`${String(m).padStart(2,'0')}:${s}`};
  function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(error){console.error('Could not save game progress.',error);notify('SAVE FAILED — CHECK BROWSER STORAGE')}}
  function notify(text){const el=document.getElementById('toast');el.textContent=text;window.setTimeout(()=>{if(el.textContent===text)el.textContent=''},2400)}
  function button(text,action,cls='button'){return`<button class="${cls}" data-action="${action}">${text}</button>`}
  function home(){
    hud.hidden=true;layer.innerHTML=`<div class="menu-layout"><div><div class="eyebrow">✦ &nbsp; THE CITY NEVER SLEEPS</div><h1 class="hero-title">NEON<span>RACER</span></h1><p class="hero-copy">Own the night. Burn through the city. Leave your mark on the street legends.</p>    <div class="hero-actions">${button('START RACING','mode','button primary')}${button('GARAGE','garage')}${button('RECORDS','records')}${button('SETTINGS','settings')}${button('HOW TO PLAY','help','button ghost')}</div></div><aside class="feature-card"><div class="card-kicker"><span>YOUR STREET CRED</span><b>✦ PROFILE</b></div><div class="stats-row"><div class="mini-stat"><span>CREDITS</span><strong>${save.credits.toLocaleString()}</strong></div><div class="mini-stat"><span>UNLOCKED CARS</span><strong>${save.unlockedCars.length}<small> / ${N.CARS.length}</small></strong></div><div class="mini-stat"><span>RACES WON</span><strong>${save.records.wins||0}</strong></div></div><div class="progress-wrap"><div class="progress-head"><span>CHAMPIONSHIP SERIES</span><span>${Math.min(save.championship.race,3)} / 3</span></div><div class="progress-track"><i style="width:${Math.min(100,save.championship.race/3*100)}%"></i></div><p class="hint">Complete races to earn credits and unlock the ultimate street machines.</p></div></aside></div>`;
  }
  function panel(title,subtitle,content,foot=''){layer.innerHTML=`<section class="panel"><div class="panel-head"><div><div class="eyebrow">${subtitle}</div><h2>${title}</h2></div><button class="panel-close" data-action="home" aria-label="Close">×</button></div>${content}${foot}</section>`}
  function chooseMode(){
    const content=`<div class="selection-grid">
      <article class="select-card" data-mode="quick"><h3>QUICK RACE</h3><p>3 laps · 3 rivals<br>Pick your track and take the win.</p></article>
      <article class="select-card" data-mode="time"><h3>TIME TRIAL</h3><p>Solo hot lap · 5 laps<br>Set a record and beat your best.</p></article>
      <article class="select-card" data-mode="championship"><h3>CHAMPIONSHIP</h3><p>3 event series · points table<br>Race your way to the crown.</p></article>
    </div><div class="selection-summary">CHAMPIONSHIP STANDINGS &nbsp; ${save.championship.points} PTS &nbsp; — &nbsp; EVENT ${Math.min(save.championship.race+1,3)} / 3</div>`;
    panel('CHOOSE YOUR RACE','01 / GAME MODE',content,`<div class="panel-footer"><span class="hint">SELECT A MODE TO CONTINUE</span>${button('CONTINUE →','tracks','button primary')}</div>`);
  }
  function chooseTrack(){
    const cards=N.TRACKS.map(t=>{const open=save.unlockedTracks.includes(t.id),laps=mode==='time'?5:t.laps;return`<article class="select-card ${open?'':'locked'} ${selectedTrack===t.id?'selected':''}" data-track="${t.id}"><h3>${t.name} ${open?'':'🔒'}</h3><p>${t.place}<br>${laps} LAPS · ${open?'AVAILABLE':'WIN A RACE TO UNLOCK'}</p></article>`}).join('');
    const content=`<div class="selection-grid">${cards}</div><div class="selection-summary">TRACK RECORD &nbsp; ${fmt(save.records[bestKey(selectedTrack)]?.bestLap)}</div>`;
    panel('PICK THE STREETS','02 / TRACK SELECT',content,`<div class="panel-footer"><span class="hint">ARROWS AND WASD TO DRIVE</span>${button('BACK','mode')}${button(mode==='time'?'START TIME TRIAL':'NEXT →','difficulty','button primary')}</div>`);
  }
  function chooseDifficulty(){
    const levels=[['easy','ROOKIE','Relaxed rivals. Learn the racing line.'],['normal','STREET','Balanced opponents. The city fights back.'],['hard','LEGEND','Fast, aggressive and unforgiving.']];
    const content=`<div class="selection-grid">${levels.map(([id,name,desc])=>`<article class="select-card ${selectedDifficulty===id?'selected':''}" data-difficulty="${id}"><h3>${name}</h3><p>${desc}</p></article>`).join('')}</div>
    <div class="selection-summary">CAR &nbsp; ${N.CARS.find(c=>c.id===selectedCar).name} &nbsp; · &nbsp; TRACK &nbsp; ${N.TRACKS.find(t=>t.id===selectedTrack).name}</div>`;
    panel('SET THE PACE','03 / RACE SETUP',content,`<div class="panel-footer"><span class="hint">SHIFT NITRO · SPACE DRIFT · ESC PAUSE</span>${button('BACK','tracks')}${button('START ENGINE','start','button primary')}</div>`);
  }
  function garage(){
    const cards=N.CARS.map(c=>{const open=save.unlockedCars.includes(c.id);return`<article class="select-card ${open?'':'locked'} ${selectedCar===c.id?'selected':''}" data-car="${c.id}"><div class="car-swatch" style="--car-color:${c.color}"></div><h3>${c.name} ${open?'':'🔒'}</h3><p>TOP ${c.topSpeed} · ACCEL ${c.acceleration}<br>HANDLING ${c.handling.toFixed(1)} · ${open?'OWNED':`${c.unlock.toLocaleString()} CREDITS`}</p></article>`}).join('');
    panel('PICK YOUR RIDE','THE GARAGE',`<div class="selection-grid">${cards}</div><div class="selection-summary">Unlock vehicles by earning credits in races. Your current balance: <b>${save.credits.toLocaleString()} CR</b></div>`,`<div class="panel-footer"><span class="hint">EVERY CAR HAS A DIFFERENT FEEL</span>${button('BACK TO MENU','home')}${button('RACE THIS CAR','mode','button primary')}</div>`);
  }
  function records(){
    const rows=N.TRACKS.map(t=>`<div class="record-row"><span>${t.name} — QUICK RACE</span><span>${fmt(save.records[`${t.id}:quick`]?.bestLap)}</span></div><div class="record-row"><span>${t.name} — TIME TRIAL</span><span>${fmt(save.records[`${t.id}:time`]?.bestLap)}</span></div>`).join('');
    panel('PERSONAL RECORDS','YOUR STREET HISTORY',`<div class="record-list">${rows}</div><div class="selection-summary">CHAMPIONSHIP POINTS &nbsp; ${save.championship.points} &nbsp; · &nbsp; COMPLETED EVENTS &nbsp; ${save.championship.race}</div>`,`<div class="panel-footer"><span class="hint">RECORDS SAVED IN THIS BROWSER</span>${button('BACK TO MENU','home')}</div>`);
  }
  function help(){
    const content=`<div class="help-grid"><div class="help-item"><span>Accelerate</span><kbd>W / ↑</kbd></div><div class="help-item"><span>Brake / reverse</span><kbd>S / ↓</kbd></div><div class="help-item"><span>Steer</span><kbd>A / D · ← / →</kbd></div><div class="help-item"><span>Drift / handbrake</span><kbd>SPACE</kbd></div><div class="help-item"><span>Nitro boost</span><kbd>SHIFT</kbd></div><div class="help-item"><span>Pause / resume</span><kbd>ESC</kbd></div></div><p class="notice">Steer into corners while holding the handbrake to slide. Stay on the road to keep your speed and recharge nitro. Beat races to earn credits and unlock new cars.</p>`;
    panel('THE CONTROLS','DRIVER BRIEFING',content,`<div class="panel-footer">${button('GOT IT','home','button primary')}</div>`);
  }
  function settings(){
    const levels=[['easy','ROOKIE'],['normal','STREET'],['hard','LEGEND']];
    const content=`<p class="notice">Choose your default rival difficulty and audio levels. Audio starts after your first interaction.</p><div class="selection-grid">${levels.map(([id,name])=>`<article class="select-card ${selectedDifficulty===id?'selected':''}" data-setting-difficulty="${id}"><h3>${name}</h3><p>${id==='easy'?'Relaxed opponents':id==='normal'?'Balanced challenge':'Maximum challenge'}</p></article>`).join('')}</div><div class="audio-settings">
      <label class="volume-row"><span>MUSIC VOLUME <b id="music-volume-value">${Math.round(save.settings.musicVolume*100)}%</b></span><input type="range" min="0" max="1" step="0.01" value="${save.settings.musicVolume}" data-audio-volume="music" aria-label="Music volume"></label>
      <label class="volume-row"><span>SOUND EFFECTS <b id="sfx-volume-value">${Math.round(save.settings.sfxVolume*100)}%</b></span><input type="range" min="0" max="1" step="0.01" value="${save.settings.sfxVolume}" data-audio-volume="sfx" aria-label="Sound effects volume"></label>
      <div class="audio-buttons">${button(save.settings.muted?'UNMUTE ALL':'MUTE ALL','toggle-sound')}${button(save.settings.musicMuted?'ENABLE MUSIC':'MUTE MUSIC','toggle-music')}${button(save.settings.sfxMuted?'ENABLE EFFECTS':'MUTE EFFECTS','toggle-sfx')}</div>
    </div>`;
    panel('GAME SETTINGS','PREFERENCES',content,`<div class="panel-footer"><span class="hint">PREFERENCES SAVED IN THIS BROWSER</span>${button('BACK TO MENU','home')}</div>`);
  }
  function updateAudio(){audio.setMuted(save.settings.muted);audio.setMusicMuted(save.settings.musicMuted);audio.setSfxMuted(save.settings.sfxMuted);audio.setVolumes(save.settings.musicVolume,save.settings.sfxVolume)}
  function updateSoundButton(){document.querySelector('#sound-toggle span').textContent=save.settings.muted?'OFF':'ON';document.getElementById('sound-toggle').setAttribute('aria-label',save.settings.muted?'Unmute audio':'Mute audio')}
  function results(data){
    hud.hidden=true;const pos=data.place,credit=pos===1?600:pos===2?350:pos===3?200:100;
    save.credits+=credit;if(pos===1)save.records.wins=(save.records.wins||0)+1;
    const key=bestKey(data.track.id),rec=save.records[key]||{};if(Number.isFinite(data.bestLap)&&data.bestLap<(rec.bestLap||Infinity))rec.bestLap=data.bestLap;rec.lastTime=data.time;rec.lastPlace=pos;save.records[key]=rec;
    if(data.mode==='championship'){save.championship.points+=(pos===1?10:pos===2?7:pos===3?5:3);save.championship.race=Math.min(3,save.championship.race+1)}
    const earned=N.CARS.filter(c=>c.unlock<=save.credits&&!save.unlockedCars.includes(c.id));earned.forEach(c=>save.unlockedCars.push(c.id));
    if(pos===1&&!save.unlockedTracks.includes('afterglow'))save.unlockedTracks.push('afterglow');if(pos===1&&data.track.id==='afterglow'&&!save.unlockedTracks.includes('chrome-docks'))save.unlockedTracks.push('chrome-docks');
    persist();
    const standings=data.cars.map((c,i)=>`<div class="record-row"><span>${String(i+1).padStart(2,'0')} &nbsp; ${c.isPlayer?'YOU':c.name}</span><span>${c.isPlayer?fmt(data.time):`${c.lap} LAPS`}</span></div>`).join('');
    const unlockText=earned.length?`<div class="selection-summary">NEW CAR UNLOCKED — ${earned.map(c=>c.name).join(', ')}</div>`:'';
    layer.innerHTML=`<section class="panel"><div class="panel-head"><div><div class="eyebrow">${data.track.name} · ${data.mode.toUpperCase()}</div><h2>${pos===1?'NIGHT OWNED':`P${pos} — RACE COMPLETE`}</h2></div></div><div class="stats-row"><div class="mini-stat"><span>RACE TIME</span><strong>${fmt(data.time)}</strong></div><div class="mini-stat"><span>BEST LAP</span><strong>${fmt(data.bestLap)}</strong></div><div class="mini-stat"><span>CREDITS EARNED</span><strong>+${credit}</strong></div></div><div class="record-list">${standings}</div>${unlockText}<div class="panel-footer">${button('MAIN MENU','home')}${button('RACE AGAIN','again','button primary')}</div></section>`;
  }
  function pauseMenu(){
    layer.innerHTML=`<section class="panel" style="width:min(420px,100%)"><div class="panel-head"><div><div class="eyebrow">THE CITY CAN WAIT</div><h2>RACE PAUSED</h2></div></div><p class="notice">Take a breath, driver. Your race is waiting.</p><div class="hero-actions">${button('RESUME RACE','resume','button primary')}${button('RESTART RACE','again')}${button('QUIT TO MENU','home','button ghost')}</div></section>`;
  }
  function startRace(){
    const car=N.CARS.find(c=>c.id===selectedCar),track=N.TRACKS.find(t=>t.id===selectedTrack);
    game.start({mode,car,track:selectedTrack,difficulty:selectedDifficulty,savedBest:save.records[bestKey(selectedTrack)]?.bestLap});
  }
  function handleAction(action){
    audio.menu();
    if(action==='home'){if(game&&game.running){game.running=false;game.state='menu';audio.pauseRace(true)}home();audio.pauseRace(false)}
    else if(action==='mode')chooseMode();else if(action==='tracks')chooseTrack();else if(action==='difficulty')chooseDifficulty();else if(action==='garage')garage();else if(action==='records')records();else if(action==='help')help();else if(action==='settings')settings();else if(action==='toggle-sound'){save.settings.muted=!save.settings.muted;updateAudio();persist();updateSoundButton();settings()}else if(action==='toggle-music'){save.settings.musicMuted=!save.settings.musicMuted;updateAudio();persist();settings()}else if(action==='toggle-sfx'){save.settings.sfxMuted=!save.settings.sfxMuted;updateAudio();persist();settings()}else if(action==='start')startRace();else if(action==='resume'){game.resume();layer.innerHTML=''}
    else if(action==='again')startRace();
  }
  layer.addEventListener('click',e=>{
    const action=e.target.closest('[data-action]');if(action){handleAction(action.dataset.action);return}
    const m=e.target.closest('[data-mode]');if(m){audio.menu();mode=m.dataset.mode;chooseMode();return}
    const t=e.target.closest('[data-track]');if(t&&save.unlockedTracks.includes(t.dataset.track)){audio.menu();selectedTrack=t.dataset.track;chooseTrack();return}
    const d=e.target.closest('[data-difficulty]');if(d){audio.menu();selectedDifficulty=d.dataset.difficulty;chooseDifficulty();return}
    const setting=e.target.closest('[data-setting-difficulty]');if(setting){audio.menu();selectedDifficulty=setting.dataset.settingDifficulty;save.settings.difficulty=selectedDifficulty;persist();settings();return}
    const c=e.target.closest('[data-car]');if(c){audio.menu();const car=N.CARS.find(x=>x.id===c.dataset.car);if(save.unlockedCars.includes(car.id)){selectedCar=car.id;garage()}else if(save.credits>=car.unlock){save.unlockedCars.push(car.id);save.credits-=car.unlock;persist();selectedCar=car.id;garage()}else notify(`NEED ${(car.unlock-save.credits).toLocaleString()} MORE CREDITS`)}
  });
  document.getElementById('sound-toggle').addEventListener('click',()=>{audio.menu();save.settings.muted=!save.settings.muted;updateAudio();persist();updateSoundButton()});
  document.getElementById('pause-button').addEventListener('click',()=>{audio.menu();game.togglePause()});
  layer.addEventListener('input',e=>{
    const slider=e.target.closest('[data-audio-volume]');if(!slider)return;
    const type=slider.dataset.audioVolume;save.settings[type==='music'?'musicVolume':'sfxVolume']=Number(slider.value);
    updateAudio();document.getElementById(`${type}-volume-value`).textContent=`${Math.round(Number(slider.value)*100)}%`;
  });
  layer.addEventListener('change',e=>{if(e.target.matches('[data-audio-volume]'))persist()});
  updateSoundButton();
  game=new N.Game(canvas,controls,audio,{
    onStart(config){layer.innerHTML='';hud.hidden=false;document.getElementById('countdown').hidden=false;document.getElementById('countdown').textContent='3';document.getElementById('hud-lap').innerHTML=`1<small> / ${game.totalLaps}</small>`;document.getElementById('hud-position').innerHTML=`1<small> / ${game.cars.length}</small>`;document.getElementById('hud-best').textContent=fmt(config.savedBest);audio.engineStart();let remaining=3;const tick=()=>{if(game.state!=='countdown')return;if(remaining<=0){game.state='race';document.getElementById('countdown').textContent='GO!';audio.go();setTimeout(()=>document.getElementById('countdown').hidden=true,550);return}document.getElementById('countdown').textContent=remaining;audio.countdown(remaining);remaining--;setTimeout(tick,750)};setTimeout(tick,100)},
    onUpdate(s){document.getElementById('hud-speed').textContent=String(Math.round(Math.abs(s.speed))).padStart(3,'0');document.getElementById('hud-position').innerHTML=`${s.position}<small> / ${game.cars.length}</small>`;document.getElementById('hud-time').textContent=fmt(s.elapsed);document.getElementById('hud-best').textContent=fmt(s.best);document.getElementById('hud-lap').innerHTML=`${Math.min(s.lap+1,game.totalLaps)}<small> / ${game.totalLaps}</small>`;document.getElementById('nitro-fill').style.width=`${s.nitro}%`;document.getElementById('nitro-state').textContent=s.boost?'BOOSTING':s.nitro>0?'READY':'RECHARGING';document.getElementById('drift-indicator').classList.toggle('active',s.drift)},
    onLap(lap,best){audio.lap();notify(`LAP ${lap} COMPLETE — BEST ${fmt(best)}`)},
    onPause(paused){audio.pauseRace(paused);if(paused)pauseMenu();else layer.innerHTML=''},
    onFinish:results
  });
  N.bus.on('pause-toggle',()=>game.togglePause());N.bus.on('auto-pause',()=>{if(game.state==='race')game.togglePause()});
  window.addEventListener('pagehide',()=>audio.destroy(),{once:true});
  home();
})();
