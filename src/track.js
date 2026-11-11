(function () {
  const N = window.NeonRace = window.NeonRace || {};
  const tracks = [
    { id: 'neon-bay', name: 'NEON BAY', place: 'HARBOR DISTRICT', laps: 3, width: 188, theme: '#32e7ff', points: [[-90,-560],[300,-560],[630,-470],[790,-220],[770,70],[580,340],[260,500],[-100,520],[-440,430],[-690,190],[-700,-120],[-500,-400],[-250,-540]] },
    { id: 'afterglow', name: 'AFTERGLOW', place: 'OLD TOWN LOOP', laps: 3, width: 174, theme: '#c084ff', points: [[-70,-620],[280,-580],[590,-390],[660,-90],[500,190],[600,450],[290,600],[-50,520],[-350,590],[-660,360],[-620,70],[-430,-170],[-560,-420],[-330,-600]] },
    { id: 'chrome-docks', name: 'CHROME DOCKS', place: 'EASTERN PORT', laps: 3, width: 202, theme: '#ffc85b', points: [[-120,-590],[190,-610],[490,-490],[700,-250],[700,50],[420,180],[150,70],[-100,160],[-250,450],[-590,500],[-740,230],[-600,-80],[-430,-380],[-220,-510]] }
  ];
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  class Track {
    constructor(data) {
      this.data = data; this.id = data.id; this.name = data.name; this.place = data.place;
      this.laps = data.laps; this.width = data.width; this.theme = data.theme;
      this.points = data.points.map(([x,y])=>({x,y}));
      this.segments = this.points.map((a,i)=>{
        const b=this.points[(i+1)%this.points.length], dx=b.x-a.x,dy=b.y-a.y;
        return {a,b,dx,dy,len:Math.hypot(dx,dy),start:0};
      });
      let total=0; this.segments.forEach(s=>{s.start=total;total+=s.len}); this.length=total;
      this.obstacles=[3,8].map((index,i)=>{const s=this.segments[index],side=i%2?1:-1;return{id:`${this.id}-barrel-${i}`,x:(s.a.x+s.b.x)/2+s.dy/s.len*this.width*.36*side,y:(s.a.y+s.b.y)/2-s.dx/s.len*this.width*.36*side,radius:12}});
      this.streetLights=[];
      this.segments.forEach((s,index)=>{for(let d=80;d<s.len;d+=230){const t=d/s.len,side=(Math.floor(d/230)+index)%2?1:-1;this.streetLights.push({x:s.a.x+s.dx*t+s.dy/s.len*(this.width*.62)*side,y:s.a.y+s.dy*t-s.dx/s.len*(this.width*.62)*side,color:side>0?'#32e7ff':'#bd75ff'})}});
      this.decor = [];
      let seed=data.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0);
      const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      for(let i=0;i<80;i++){const s=this.segments[Math.floor(rand()*this.segments.length)],t=rand(),side=rand()<.5?-1:1,dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,len=Math.hypot(dx,dy),offset=this.width*.8+80+rand()*360;this.decor.push({x:s.a.x+dx*t+dy/len*offset*side,y:s.a.y+dy*t-dx/len*offset*side,size:12+rand()*32,hue:rand()})}
    }
    locate(x,y) {
      let best={distance:Infinity,progress:0,index:0,nearest:null};
      this.segments.forEach((s,i)=>{const t=Math.max(0,Math.min(1,((x-s.a.x)*s.dx+(y-s.a.y)*s.dy)/(s.len*s.len))),px=s.a.x+s.dx*t,py=s.a.y+s.dy*t,d=Math.hypot(x-px,y-py);if(d<best.distance)best={distance:d,progress:s.start+t*s.len,index:i,nearest:{x:px,y:py}}});
      return best;
    }
    isOnRoad(x,y){return this.locate(x,y).distance<this.width*.56}
    draw(ctx, cameraX, cameraY, width, height, time) {
      const cx=width/2-cameraX,cy=height/2-cameraY;
      ctx.save();ctx.translate(cx,cy);
      ctx.fillStyle='#081525';ctx.fillRect(-5000,-5000,10000,10000);
      ctx.strokeStyle='#0c2431';ctx.lineWidth=1;
      const gx=Math.floor((cameraX-width/2)/100)*100,gy=Math.floor((cameraY-height/2)/100)*100;
      for(let x=gx;x<cameraX+width/2+100;x+=100){ctx.beginPath();ctx.moveTo(x,-5000);ctx.lineTo(x,5000);ctx.stroke()}
      for(let y=gy;y<cameraY+height/2+100;y+=100){ctx.beginPath();ctx.moveTo(-5000,y);ctx.lineTo(5000,y);ctx.stroke()}
      this.decor.forEach((d,i)=>{ctx.fillStyle=i%3===0?'#142d39':'#101b2c';ctx.fillRect(d.x-d.size/2,d.y-d.size/2,d.size,d.size);ctx.fillStyle=i%4===0?'#ff44bb':'#38dfff';ctx.globalAlpha=.25+.2*Math.sin(time*2+i);ctx.fillRect(d.x-2,d.y-d.size/2,4,4);ctx.globalAlpha=1});
      this.path(ctx);
      ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=this.theme;ctx.globalAlpha=.13;ctx.lineWidth=this.width+15;ctx.stroke();ctx.globalAlpha=1;
      ctx.strokeStyle='#262b37';ctx.lineWidth=this.width;ctx.stroke();
      ctx.strokeStyle='#d9e2ec';ctx.globalAlpha=.68;ctx.lineWidth=3;ctx.setLineDash([22,22]);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
      this.streetLights.forEach(light=>{ctx.save();ctx.strokeStyle=light.color;ctx.fillStyle=light.color;ctx.shadowColor=light.color;ctx.shadowBlur=15;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(light.x,light.y);ctx.lineTo(light.x,light.y-18);ctx.stroke();ctx.beginPath();ctx.arc(light.x,light.y-20,3.5,0,Math.PI*2);ctx.fill();ctx.restore()});
      this.obstacles.forEach(o=>{ctx.save();ctx.translate(o.x,o.y);ctx.shadowColor='#ffad45';ctx.shadowBlur=12;ctx.fillStyle='#ffb448';ctx.beginPath();ctx.arc(0,0,o.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#713d35';ctx.fillRect(-o.radius,-3,o.radius*2,6);ctx.restore()});
      const s=this.segments[0],nx=-s.dy/s.len,ny=s.dx/s.len;
      ctx.save();ctx.translate(s.a.x,s.a.y);ctx.rotate(Math.atan2(s.dy,s.dx));ctx.fillStyle='#eef7ff';ctx.fillRect(-5,-this.width*.48,10,this.width*.96);
      for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#111522':'#36e8ff';ctx.fillRect(-6,-this.width*.48+i*this.width*.08,12,this.width*.08)}ctx.restore();
      ctx.restore();
    }
    path(ctx) {
      const p=this.points;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);
      for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],prev=p[(i+p.length-1)%p.length],next=p[(i+2)%p.length];const c1x=a.x+(b.x-prev.x)/6,c1y=a.y+(b.y-prev.y)/6,c2x=b.x-(next.x-a.x)/6,c2y=b.y-(next.y-a.y)/6;ctx.bezierCurveTo(c1x,c1y,c2x,c2y,b.x,b.y)}
      ctx.closePath();
    }
  }
  N.Track=Track;N.TRACKS=tracks;N.distance=dist;
})();
