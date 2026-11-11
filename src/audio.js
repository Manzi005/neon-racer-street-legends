(function () {
  const N=window.NeonRace=window.NeonRace||{};
  class AudioEngine {
    constructor(settings={}) {
      this.ctx=null;this.musicGain=null;this.sfxGain=null;this.engineOsc=null;this.engineGain=null;
      this.driftOsc=null;this.driftGain=null;this.musicTimer=null;this.musicStep=0;this.activeVoices=0;
      this.musicVolume=this.validVolume(settings.musicVolume,.24);this.sfxVolume=this.validVolume(settings.sfxVolume,.7);
      this.musicMuted=!!settings.musicMuted;this.sfxMuted=!!settings.sfxMuted;this.masterMuted=!!settings.muted;
      this.racePaused=false;this.lastCollisionAt=-1;this.destroyed=false;
    }
    validVolume(value,fallback){const number=Number(value);return Number.isFinite(number)?Math.max(0,Math.min(1,number)):fallback}
    start() {
      if(this.destroyed)return;
      if(!this.ctx){
        const AudioContextClass=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextClass)return;
        this.ctx=new AudioContextClass();
        this.musicGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();
        this.musicGain.connect(this.ctx.destination);this.sfxGain.connect(this.ctx.destination);
        this.applyVolumes();this.startMusic();
      }
      if(this.ctx.state==='suspended')this.ctx.resume();
    }
    applyVolumes() {
      if(!this.ctx)return;
      const now=this.ctx.currentTime;
      this.musicGain.gain.setTargetAtTime(this.masterMuted||this.musicMuted?0:this.musicVolume,now,.035);
      this.sfxGain.gain.setTargetAtTime(this.masterMuted||this.sfxMuted?0:this.sfxVolume,now,.035);
    }
    setVolumes(music,sfx) {
      this.musicVolume=this.validVolume(music,.24);
      this.sfxVolume=this.validVolume(sfx,.7);
      this.applyVolumes();
    }
    setMuted(muted){this.masterMuted=!!muted;this.applyVolumes()}
    setMusicMuted(muted){this.musicMuted=!!muted;this.applyVolumes()}
    setSfxMuted(muted){this.sfxMuted=!!muted;this.applyVolumes()}
    startMusic() {
      if(this.musicTimer||this.racePaused)return;
      const bass=[55,65.41,73.42,61.74,49,61.74,82.41,73.42];
      const lead=[220,0,261.63,329.63,0,293.66,392,329.63,246.94,0,293.66,369.99,0,329.63,440,369.99];
      this.musicTimer=window.setInterval(()=>{
        if(!this.ctx||this.masterMuted||this.musicMuted)return;
        const step=this.musicStep++%16;
        this.tone(bass[Math.floor(step/2)%bass.length],.38,'triangle',.11,undefined,'music');
        if(lead[step])this.tone(lead[step],.19,'sine',step%4===0?.12:.07,undefined,'music');
        if(step%4===0)this.tone(52,.12,'sine',.22,28,'music');
      },230);
    }
    stopMusic(){if(this.musicTimer){window.clearInterval(this.musicTimer);this.musicTimer=null}}
    tone(freq,duration,type='sine',volume=.16,endFreq,bus='sfx') {
      this.start();
      if(!this.ctx||this.activeVoices>=14)return;
      this.activeVoices++;
      const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain(),now=this.ctx.currentTime;
      oscillator.type=type;oscillator.frequency.setValueAtTime(Math.max(1,freq),now);
      if(endFreq)oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),now+duration);
      gain.gain.setValueAtTime(Math.max(.001,volume),now);
      gain.gain.exponentialRampToValueAtTime(.001,now+duration);
      oscillator.connect(gain);gain.connect(bus==='music'?this.musicGain:this.sfxGain);
      oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();this.activeVoices=Math.max(0,this.activeVoices-1)};
      oscillator.start(now);oscillator.stop(now+duration);
    }
    menu(){this.tone(470,.075,'sine',.13,710)}
    engineStart(){this.start();this.tone(72,.72,'sawtooth',.24,210);this.tone(160,.35,'triangle',.18,95)}
    accelerate(){this.tone(155,.16,'sawtooth',.08,260)}
    countdown(number){this.tone(number===1?470:330,.17,'square',.2,number===1?360:270)}
    go(){this.tone(480,.42,'sawtooth',.23,960);this.tone(240,.28,'triangle',.16,480)}
    boost(){this.tone(115,.34,'sawtooth',.2,280);this.tone(620,.22,'sine',.12,980)}
    brake(){this.tone(190,.16,'sawtooth',.12,55)}
    collision(power=1){this.start();if(!this.ctx||this.ctx.currentTime-this.lastCollisionAt<.12)return;this.lastCollisionAt=this.ctx.currentTime;this.tone(75+power*30,.22,'triangle',.24,35);this.tone(190,.09,'square',.08,70)}
    lap(){this.tone(520,.18,'triangle',.17,780);this.tone(780,.24,'sine',.13,1040)}
    checkpoint(){this.tone(640,.16,'sine',.12,920)}
    victory(){this.tone(392,.28,'triangle',.2,523);window.setTimeout(()=>this.tone(523,.3,'triangle',.18,659),130);window.setTimeout(()=>this.tone(659,.48,'sine',.2,784),260)}
    defeat(){this.tone(220,.45,'triangle',.2,164);window.setTimeout(()=>this.tone(164,.6,'sawtooth',.1,82),190)}
    gameOver(){this.tone(110,.85,'triangle',.15,55)}
    updateEngine(speed,boosting) {
      this.start();if(!this.ctx||this.racePaused)return;
      const frequency=68+Math.abs(speed)*1.3+(boosting?105:0);
      if(!this.engineOsc){
        this.engineOsc=this.ctx.createOscillator();this.engineGain=this.ctx.createGain();
        this.engineOsc.type='sawtooth';this.engineGain.gain.value=.0001;
        this.engineOsc.connect(this.engineGain);this.engineGain.connect(this.sfxGain);this.engineOsc.start();
      }
      const now=this.ctx.currentTime;
      this.engineOsc.frequency.setTargetAtTime(frequency,now,.055);
      this.engineGain.gain.setTargetAtTime(.012+Math.min(.035,Math.abs(speed)/6200),now,.08);
    }
    updateDrift(active,speed) {
      this.start();if(!this.ctx||this.racePaused)return;
      if(active&&!this.driftOsc){
        this.driftOsc=this.ctx.createOscillator();this.driftGain=this.ctx.createGain();
        this.driftOsc.type='sawtooth';this.driftGain.gain.value=.0001;
        this.driftOsc.connect(this.driftGain);this.driftGain.connect(this.sfxGain);this.driftOsc.start();
      }
      if(this.driftOsc){
        const now=this.ctx.currentTime;
        this.driftOsc.frequency.setTargetAtTime(700+Math.abs(speed)*2.5,now,.06);
        this.driftGain.gain.setTargetAtTime(active?Math.min(.09,.025+Math.abs(speed)/4000):.0001,now,.055);
        if(!active&&this.driftGain.gain.value<.001){this.driftOsc.stop();this.driftOsc.disconnect();this.driftGain.disconnect();this.driftOsc=null;this.driftGain=null}
      }
    }
    pauseRace(paused) {
      this.racePaused=!!paused;
      if(paused){this.stopMusic();this.stopLoop('engine');this.stopLoop('drift')}
      else this.startMusic();
    }
    stopLoop(name) {
      const oscillator=name==='engine'?this.engineOsc:this.driftOsc,gain=name==='engine'?this.engineGain:this.driftGain;
      if(!oscillator)return;
      try{oscillator.stop()}catch(error){if(error.name!=='InvalidStateError')throw error}
      oscillator.disconnect();gain.disconnect();
      if(name==='engine'){this.engineOsc=null;this.engineGain=null}else{this.driftOsc=null;this.driftGain=null}
    }
    finish(won) {
      this.stopLoop('engine');this.stopLoop('drift');this.stopMusic();
      if(won)this.victory();else this.defeat();
      window.setTimeout(()=>this.gameOver(),won?560:250);
    }
    destroy() {
      this.destroyed=true;this.stopMusic();this.stopLoop('engine');this.stopLoop('drift');
      if(this.ctx){this.ctx.close();this.ctx=null}
    }
  }
  N.AudioEngine=AudioEngine;
})();
