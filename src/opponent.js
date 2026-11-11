(function () {
  const N=window.NeonRace=window.NeonRace||{};
  const personalities=[
    {name:'NOVA',color:'#ff567b',skill:.94,offset:-36,aggression:.7},
    {name:'KAI',color:'#b579ff',skill:1.02,offset:34,aggression:.5},
    {name:'ROOK',color:'#ffc95d',skill:.88,offset:0,aggression:.9}
  ];
  N.OPPONENTS=personalities;
  class Opponent extends N.Car {
    constructor(spec,x,y,angle,personality,difficulty,place) {
      super(spec,x,y,angle,false);this.name=personality.name;this.aiOffset=personality.offset;this.aggression=personality.aggression;
      this.aiSkill=personality.skill*(difficulty==='easy'?.84:difficulty==='hard'?1.1:1);this.place=place;this.targetSpeed=0;
    }
    update(dt,track,cars) {
      if(this.finished)return;
      const here=track.locate(this.x,this.y);
      let lookAhead=95+Math.max(0,this.speed)*.72;
      const targetProgress=(here.progress+lookAhead)%track.length;
      const target=pointAt(track,targetProgress);
      let offset=this.aiOffset;
      cars.forEach(other=>{if(other===this)return;const d=Math.hypot(other.x-this.x,other.y-this.y);if(d<65){const cross=(Math.cos(this.angle)*(other.y-this.y)-Math.sin(this.angle)*(other.x-this.x));offset+=(cross>=0?-1:1)*40*this.aggression}});
      track.obstacles.forEach(obstacle=>{const dx=obstacle.x-this.x,dy=obstacle.y-this.y,forward=dx*Math.cos(this.angle)+dy*Math.sin(this.angle),side=dx*-Math.sin(this.angle)+dy*Math.cos(this.angle);if(forward>0&&forward<lookAhead+45&&Math.abs(side)<38)offset+=side>=0?-55:55});
      const deltaX=target.x-this.x-Math.sin(this.angle)*offset,deltaY=target.y-this.y+Math.cos(this.angle)*offset;
      const desired=Math.atan2(deltaY,deltaX);
      let angleError=Math.atan2(Math.sin(desired-this.angle),Math.cos(desired-this.angle));
      const next=pointAt(track,(here.progress+170)%track.length),after=pointAt(track,(here.progress+300)%track.length);
      const corner=Math.abs(Math.atan2(Math.sin(Math.atan2(after.y-next.y,after.x-next.x)-Math.atan2(next.y-this.y,next.x-this.x)),Math.cos(Math.atan2(after.y-next.y,after.x-next.x)-Math.atan2(next.y-this.y,next.x-this.x))));
      this.targetSpeed=(track.data.speed||210)*this.aiSkill*(1-Math.min(.44,corner*.17));
      const throttle=this.speed<this.targetSpeed?1:0,brake=this.speed>this.targetSpeed+28?1:0;
      const steer=Math.max(-1,Math.min(1,angleError*2.15));
      N.Physics.update(this,{accelerate:throttle,brake,steer,handbrake:Math.abs(angleError)>1.1&&this.speed>100,nitro:this.speed<this.targetSpeed*.66&&Math.random()<.018},dt,track.isOnRoad(this.x,this.y));
      if(!track.isOnRoad(this.x,this.y)){this.speed*=Math.exp(-1.6*dt);this.angle+=Math.max(-1,Math.min(1,angleError))*dt}
      const loc=track.locate(this.x,this.y);this.progress=loc.progress;
      if(loc.index>0&&loc.index<track.segments.length-1)this.hasLeftStart=true;
      if(this.hasLeftStart&&loc.index<this.lastSegment&&this.lastSegment>track.segments.length*.72&&loc.index<track.segments.length*.3)this.lap++;
      this.lastSegment=loc.index;
    }
  }
  function pointAt(track,progress) {
    const p=((progress%track.length)+track.length)%track.length;
    let s=track.segments.find(seg=>p>=seg.start&&p<=seg.start+seg.len)||track.segments[0];
    const t=(p-s.start)/s.len;return{x:s.a.x+s.dx*t,y:s.a.y+s.dy*t};
  }
  N.Opponent=Opponent;
})();
