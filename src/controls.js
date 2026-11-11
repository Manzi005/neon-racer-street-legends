(function () {
  const N = window.NeonRace = window.NeonRace || {};
  class Controls {
    constructor() {
      this.keys = new Set();
      this.bindings = { accelerate: ['w', 'arrowup'], brake: ['s', 'arrowdown'], left: ['a', 'arrowleft'], right: ['d', 'arrowright'], handbrake: [' '], nitro: ['shift'] };
      window.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
        this.keys.add(key);
        if (key === 'escape' && !e.repeat && N.bus) N.bus.emit('pause-toggle');
      });
      window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.keys.clear());
      document.addEventListener('visibilitychange', () => { if (document.hidden && N.bus) N.bus.emit('auto-pause'); });
    }
    down(action) { return this.bindings[action].some(key => this.keys.has(key)); }
    clear() { this.keys.clear(); }
  }
  N.Controls = Controls;
})();
