(function () {
  const N=window.NeonRace=window.NeonRace||{};
  N.Collision={
    cars(cars,onImpact) {
      for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
        const a=cars[i],b=cars[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=(a.length+b.length)*.48;
        if(d>0&&d<min){const nx=dx/d,ny=dy/d,overlap=min-d,relative=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
          a.x-=nx*overlap*.5;b.x+=nx*overlap*.5;a.y-=ny*overlap*.5;b.y+=ny*overlap*.5;
          if(relative>0){const impulse=relative*.48;a.vx-=nx*impulse;a.vy-=ny*impulse;b.vx+=nx*impulse;b.vy+=ny*impulse;a.speed*=.86;b.speed*=.86;if(onImpact)onImpact((a.isPlayer||b.isPlayer)?Math.min(1,relative/160):0)}
        }
      }
    },
    bounds(car,track,onImpact) {
      const loc=track.locate(car.x,car.y),limit=track.width*.54;
      if(loc.distance>limit){const amount=Math.min(1,(loc.distance-limit)/30),dx=car.x-loc.nearest.x,dy=car.y-loc.nearest.y,d=Math.max(.001,loc.distance);
        car.x=loc.nearest.x+dx/d*limit;car.y=loc.nearest.y+dy/d*limit;car.vx*=.66;car.vy*=.66;car.speed*=.9;
        if(onImpact&&amount>.18)onImpact(amount*.3);
      }
    },
    obstacles(cars,obstacles,onImpact) {
      cars.forEach(car=>obstacles.forEach(obstacle=>{const dx=car.x-obstacle.x,dy=car.y-obstacle.y,d=Math.hypot(dx,dy),limit=obstacle.radius+10;
        if(d>0&&d<limit){const nx=dx/d,ny=dy/d;car.x=obstacle.x+nx*limit;car.y=obstacle.y+ny*limit;
          if(car.obstacleCooldown<=0){car.speed*=.68;car.vx*=.62;car.vy*=.62;car.obstacleCooldown=.35;if(onImpact)onImpact(car.isPlayer?.7:0)}
        }
      }));
    }
  };
})();
