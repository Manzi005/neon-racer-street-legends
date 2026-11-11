(function () {
  const N=window.NeonRace=window.NeonRace||{};
  class Game {
    constructor(canvas,controls,audio,callbacks){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.controls=controls;this.audio=audio;this.callbacks=callbacks;
      this.running=false;this.paused=false;this.state='menu';this.last=0;this.elapsed=0;this.shake=0;this.particles=[];this.cars=[];
      this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);this.resize();
      this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
    }
    resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);this.canvas.width=Math.max(1,Math.floor(rect.width*dpr));this.canvas.height=Math.max(1,Math.floor(rect.height*dpr));this.ctx.setTransform(dpr,0,0,dpr,0,0);this.width=rect.width;this.height=rect.height}
    start(config){
      this.config=config;this.track=new N.Track(N.TRACKS.find(t=>t.id===config.track)||N.TRACKS[0]);
      const p=this.track.points[0],next=this.track.points[1],angle=Math.atan2(next.y-p.y,next.x-p.x);
      const offset=this.track.width*.24;
      this.player=new N.Car(config.car,p.x-Math.sin(angle)*offset,p.y+Math.cos(angle)*offset,angle,true);
      this.player.bestLap=config.savedBest||Infinity;this.player.lap=0;this.player.raceProgress=0;
      const specs=N.CARS.filter(c=>c.id!=='phantom'),grid=this.track.width*.21;
      this.totalLaps=config.mode==='time'?5:this.track.laps;
      this.opponents=config.mode==='time'?[]:N.OPPONENTS.map((o,i)=>new N.Opponent(specs[(i+1)%specs.length],p.x+Math.cos(angle)*(-52-i*45)+Math.sin(angle)*grid*(i%2?1:-1),p.y+Math.sin(angle)*(-52-i*45)-Math.cos(angle)*grid*(i%2?1:-1),angle,o,config.difficulty||'normal',i+1));
      this.cars=[this.player,...this.opponents];this.particles=[];this.elapsed=0;this.shake=0;this.wasBraking=false;this.wasAccelerating=false;this.running=true;this.paused=false;this.state='countdown';this.countdown=3.5;this.player.lap=0;this.audio.pauseRace(false);
      this.callbacks.onStart(config);
    }
    togglePause(){if(!this.running)return;if(this.state==='pause'){this.state='race';this.paused=false;this.callbacks.onPause(false)}else if(this.state==='race'){this.state='pause';this.paused=true;this.callbacks.onPause(true)}}
    resume(){if(this.state==='pause'){this.state='race';this.paused=false;this.callbacks.onPause(false)}}
    finish(){if(this.state==='results')return;this.state='results';this.running=false;this.player.finished=true;const sorted=this.cars.slice().sort((a,b)=>this.rank(b)-this.rank(a));const place=sorted.indexOf(this.player)+1;this.audio.finish(place===1);this.callbacks.onFinish({place,time:this.elapsed,bestLap:this.player.bestLap,track:this.track,mode:this.config.mode,cars:sorted});}
    rank(car){return car.lap*this.track.length+(car===this.player?car.raceProgress:car.progress)}
    frame(timestamp){
      const dt=Math.min(.04,this.last?(timestamp-this.last)/1000:0);this.last=timestamp;
      if(this.state==='race'){this.update(dt)}
      this.render(timestamp/1000);requestAnimationFrame(this.frame);
    }
    update(dt){
      this.elapsed+=dt;
      const input={accelerate:this.controls.down('accelerate'),brake:this.controls.down('brake'),steer:(this.controls.down('right')?1:0)-(this.controls.down('left')?1:0),handbrake:this.controls.down('handbrake'),nitro:this.controls.down('nitro')};
      this.cars.forEach(car=>{car.obstacleCooldown=Math.max(0,car.obstacleCooldown-dt)});
      const onRoad=this.track.isOnRoad(this.player.x,this.player.y),old=this.player;
      const wasBoosting=old.isBoosting;
      if(input.accelerate&&!this.wasAccelerating)this.audio.accelerate();
      this.wasAccelerating=input.accelerate;
      if(input.brake&&!this.wasBraking&&Math.abs(old.speed)>30)this.audio.brake();
      this.wasBraking=input.brake;
      N.Physics.update(old,input,dt,onRoad);N.Collision.bounds(old,this.track,p=>this.impact(p));
      const loc=this.track.locate(old.x,old.y);old.progress=loc.progress;old.raceProgress=loc.progress;
      if(loc.index>0&&loc.index<this.track.segments.length-1)old.hasLeftStart=true;
      const crossedStart=loc.index<old.lastSegment&&old.lastSegment>this.track.segments.length*.72&&loc.index<this.track.segments.length*.3;
      if(crossedStart&&!old.hasLeftStart)old.checkpointMask=0;
      if(old.hasLeftStart&&crossedStart){
        old.lap++;old.bestLap=Math.min(old.bestLap,old.lapTime);old.lapTime=0;old.checkpointMask=0;
        this.callbacks.onLap(old.lap,old.bestLap);
        if(old.lap>=this.totalLaps){old.finished=true;old.finishTime=this.elapsed;this.finish()}
      }else old.lapTime+=dt;
      if(this.state==='results')return;
      old.lastSegment=loc.index;
      if(old.hasLeftStart&&!old.finished){
        [this.track.length/3,this.track.length*2/3].forEach((checkpoint,index)=>{
          const bit=1<<index;
          if(loc.progress>=checkpoint&&!(old.checkpointMask&bit)){old.checkpointMask|=bit;this.audio.checkpoint()}
        });
      }
      this.opponents.forEach(ai=>{ai.update(dt,this.track,this.cars);N.Collision.bounds(ai,this.track);if(ai.lap>=this.track.laps&&!ai.finished){ai.finished=true;ai.finishTime=this.elapsed}});
      N.Collision.cars(this.cars,p=>{if(p)this.impact(p)});
      N.Collision.obstacles(this.cars,this.track.obstacles,p=>{if(p)this.impact(p)});
      this.shake=Math.max(0,this.shake-dt*18);
      if(old.isBoosting&&!wasBoosting)this.audio.boost();
      this.audio.updateEngine(old.speed,old.isBoosting);
      this.audio.updateDrift(old.isDrifting,old.speed);
      if(old.isDrifting&&Math.random()<.65)this.particles.push({x:old.x-Math.cos(old.angle)*14+(Math.random()-.5)*8,y:old.y-Math.sin(old.angle)*14+(Math.random()-.5)*8,life:.55,max:.55,color:'#b9c9d9',size:5+Math.random()*8});
      if(old.isBoosting){for(let i=0;i<2;i++)this.particles.push({x:old.x-Math.cos(old.angle)*20+(Math.random()-.5)*8,y:old.y-Math.sin(old.angle)*20+(Math.random()-.5)*8,life:.28,max:.28,color:'#32e7ff',size:5+Math.random()*8})}
      this.particles.forEach(p=>{p.life-=dt;p.x-=Math.cos(old.angle)*old.speed*dt*.2;p.y-=Math.sin(old.angle)*old.speed*dt*.2});this.particles=this.particles.filter(p=>p.life>0);
      this.callbacks.onUpdate({speed:old.speed,nitro:old.nitro,lap:old.lap,elapsed:this.elapsed,best:old.bestLap,position:this.position(),drift:old.isDrifting,boost:old.isBoosting});
    }
    position(){return 1+this.opponents.filter(ai=>ai.lap*this.track.length+ai.progress>this.player.lap*this.track.length+this.player.progress).length}
    impact(power){this.shake=Math.max(this.shake,Math.min(9,power*10));this.audio.collision(power)}
    render(time){
      const ctx=this.ctx,w=this.width,h=this.height;if(!w||!h)return;
      ctx.save();ctx.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);
      ctx.fillStyle='#08111c';ctx.fillRect(0,0,w,h);
      if(this.track&&this.player){const shakeX=(Math.random()-.5)*this.shake,shakeY=(Math.random()-.5)*this.shake;
        ctx.save();ctx.translate(shakeX,shakeY);this.track.draw(ctx,this.player.x,this.player.y,w,h,time);
        this.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(w/2+p.x-this.player.x,h/2+p.y-this.player.y,p.size*(p.life/p.max),0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;ctx.shadowBlur=0;
        this.cars.slice().sort((a,b)=>a.y-b.y).forEach(car=>this.drawCar(ctx,car,w/2+car.x-this.player.x,h/2+car.y-this.player.y));
        ctx.restore();
      }else this.drawAttract(ctx,w,h,time);
      ctx.restore();
    }
    drawCar(ctx,car,x,y){
      ctx.save();ctx.translate(x,y);ctx.rotate(car.angle);ctx.shadowColor=car.spec.color;ctx.shadowBlur=car.isBoosting?24:12;
      if(car.isBoosting){ctx.fillStyle='#32e7ff';ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(-15,-5);ctx.lineTo(-34-Math.random()*12,0);ctx.lineTo(-15,5);ctx.fill();ctx.globalAlpha=1}
      ctx.fillStyle='#070b12';ctx.beginPath();ctx.roundRect(-car.length/2,-car.width/2,car.length,car.width,5);ctx.fill();
      ctx.fillStyle=car.spec.color;ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(7,-7);ctx.lineTo(-9,-7);ctx.lineTo(-15,-4);ctx.lineTo(-15,4);ctx.lineTo(-9,7);ctx.lineTo(7,7);ctx.closePath();ctx.fill();
      ctx.fillStyle='#17293a';ctx.beginPath();ctx.moveTo(5,-5);ctx.lineTo(-5,-5);ctx.lineTo(-9,-2);ctx.lineTo(-9,2);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff4c4';ctx.fillRect(11,-5,3,3);ctx.fillRect(11,2,3,3);ctx.fillStyle='#ff496b';ctx.fillRect(-14,-5,2,3);ctx.fillRect(-14,2,2,3);
      if(!car.isPlayer){ctx.rotate(-car.angle);ctx.shadowBlur=0;ctx.fillStyle='white';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText(car.name,x===undefined?0:0,-20)}
      ctx.restore();
    }
    drawAttract(ctx,w,h,time){
      const cx=w*.72,cy=h*.52,rx=Math.min(w*.27,330),ry=Math.min(h*.35,190);
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-.16);
      ctx.strokeStyle='#183044';ctx.lineWidth=88;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#263743';ctx.lineWidth=3;ctx.setLineDash([16,16]);ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      for(let i=0;i<3;i++){const a=time*.3+i*2.1;ctx.save();ctx.translate(Math.cos(a)*rx,Math.sin(a)*ry);ctx.rotate(a+.7);ctx.shadowBlur=22;ctx.shadowColor=['#32e7ff','#b578ff','#ff587e'][i];ctx.fillStyle=['#32e7ff','#b578ff','#ff587e'][i];ctx.fillRect(-17,-8,34,16);ctx.restore()}
      ctx.restore();
    }
  }
  N.Game=Game;
})();
