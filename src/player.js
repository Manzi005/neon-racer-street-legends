(function () {
  const N = window.NeonRace = window.NeonRace || {};
  N.CARS = [
    { id: 'pulse', name: 'PULSE GT', color: '#32e7ff', topSpeed: 250, acceleration: 138, braking: 270, reverse: 75, handling: 2.55, grip: .9, capacity: 100, unlock: 0 },
    { id: 'vanta', name: 'VANTA R', color: '#b578ff', topSpeed: 276, acceleration: 119, braking: 285, reverse: 70, handling: 2.15, grip: .76, capacity: 100, unlock: 1200 },
    { id: 'solstice', name: 'SOLSTICE X', color: '#ffc95d', topSpeed: 238, acceleration: 161, braking: 255, reverse: 82, handling: 2.95, grip: 1.02, capacity: 100, unlock: 4000 },
    { id: 'phantom', name: 'PHANTOM S', color: '#ff5e8a', topSpeed: 295, acceleration: 128, braking: 300, reverse: 72, handling: 2.35, grip: .82, capacity: 100, unlock: 9000 }
  ];
  class Car {
    constructor(spec, x, y, angle, isPlayer) {
      this.spec = spec; this.x = x; this.y = y; this.angle = angle; this.isPlayer = isPlayer;
      this.speed = 0; this.vx = 0; this.vy = 0; this.nitro = 100;
      this.width = 18; this.length = 34; this.lap = 0; this.progress = 0;
      this.lastSegment = 0; this.lapTime = 0; this.bestLap = Infinity;
      this.finished = false; this.finishTime = 0; this.isDrifting = false; this.isBoosting = false;
      this.invulnerable = 0; this.aiSkill = 1; this.aiOffset = 0; this.hasLeftStart = false; this.obstacleCooldown = 0; this.checkpointMask = 3;
    }
  }
  N.Car = Car;
})();
