/* Presentation for the already committed spell. No combat or network writes. */
(() => {
  'use strict';
  function play() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return null;
    const stage = document.createElement('div');
    stage.className = 'disintegration-fx';
    stage.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '<span class="disintegration-rune"></span><span class="disintegration-core"></span><span class="disintegration-beam"></span><span class="disintegration-impact"></span>';
    for (let i = 0; i < 16; i++) {
      const spark = document.createElement('span');
      spark.className = 'disintegration-spark';
      const angle = (i / 16) * Math.PI * 2;
      spark.style.setProperty('--x', Math.cos(angle) * (62 + i % 4 * 16) + 'px');
      spark.style.setProperty('--y', Math.sin(angle) * (62 + i % 4 * 16) + 'px');
      spark.style.setProperty('--delay', (i % 4) * 35 + 'ms');
      stage.append(spark);
    }
    document.body.append(stage);
    return new Promise(resolve => {
      function finish() {
        clearTimeout(timeout);
        stage.removeEventListener('animationend', done);
        stage.removeEventListener('animationcancel', done);
        stage.remove();
        resolve();
      }
      function done(event) {
        if (event.target === stage) finish();
      }
      const timeout = setTimeout(finish, 1650);
      stage.addEventListener('animationend', done);
      stage.addEventListener('animationcancel', done);
    });
  }
  window.SamothDisintegrationFX = { play };
})();
