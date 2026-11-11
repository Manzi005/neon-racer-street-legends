(function () {
  const N = window.NeonRace = window.NeonRace || {};
  N.Physics = {
    update(car, input, dt, onRoad) {
      const p = car.spec;
      const throttle = input.accelerate ? 1 : 0;
      const braking = input.brake ? 1 : 0;
      const drift = input.handbrake && Math.abs(car.speed) > 25;
      car.isDrifting = drift && Math.abs(input.steer) > .15;
      const nitro = input.nitro && car.nitro > 0 && throttle > 0 && !car.finished;
      car.isBoosting = nitro;
      if (nitro) car.nitro = Math.max(0, car.nitro - 31 * dt);
      else car.nitro = Math.min(100, car.nitro + (onRoad ? 7.2 : 3.2) * dt);
      const max = p.topSpeed * (onRoad ? 1 : .48);
      const acceleration = p.acceleration * (onRoad ? 1 : .47);
      if (throttle) car.speed += acceleration * (nitro ? 1.53 : 1) * dt;
      if (braking) car.speed += (car.speed > 0 ? -p.braking : -p.reverse) * dt;
      if (!throttle && !braking) car.speed *= Math.exp(-(onRoad ? .48 : 2.5) * dt);
      car.speed = Math.max(-p.reverse * .62, Math.min(max * (nitro ? 1.1 : 1), car.speed));
      const speedRatio = Math.min(1, Math.abs(car.speed) / Math.max(1, p.topSpeed));
      const steerRate = p.handling * (drift ? 1.48 : 1) * (.22 + speedRatio * .88);
      if (Math.abs(car.speed) > 1) car.angle += input.steer * steerRate * dt * Math.sign(car.speed);
      const forwardX = Math.cos(car.angle), forwardY = Math.sin(car.angle);
      const lateralX = -forwardY, lateralY = forwardX;
      const lateral = car.vx * lateralX + car.vy * lateralY;
      const grip = drift ? .43 : (onRoad ? p.grip : .36);
      car.vx -= lateralX * lateral * Math.min(1, grip * dt * (drift ? 2.2 : 5));
      car.vy -= lateralY * lateral * Math.min(1, grip * dt * (drift ? 2.2 : 5));
      car.vx = car.vx * .25 + forwardX * car.speed * .75;
      car.vy = car.vy * .25 + forwardY * car.speed * .75;
      car.x += car.vx * dt;
      car.y += car.vy * dt;
      return { drift: car.isDrifting, nitro };
    }
  };
})();
