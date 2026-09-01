(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loader = document.getElementById('loader');

  if (!loader || reduce || typeof gsap === 'undefined') {
    if (loader) loader.remove();
    return;
  }

  loader.innerHTML = '<svg class="loader-svg" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Loading">'
    + '<defs><path id="loader-path" fill="none" d="M481.5,195.5H302c-33,0-60.5,26.534-60.5,59.534v0.017c0,33,27.125,59.975,60.125,59.975l179.875,0.041c33,0,60.125,27.433,60.125,60.433h0.125c0,33-27.25,59.567-60.25,59.567h-180c-33,0-59.875,27.433-59.875,60.433h0.125c0,33,26.75,59.567,59.75,59.567l180.125-0.042c33,0,59.875,27.025,59.875,60.025v-0.017c0,33-26.5,60.466-59.5,60.466H301.5"/></defs>'
    + '<g class="loader-group"><use href="#loader-path" y="-480"/><use href="#loader-path"/><use href="#loader-path" y="480"/>'
    + '<g class="loader-trails" fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round"><use href="#loader-path" opacity=".1"/><use href="#loader-path" opacity=".3"/><use href="#loader-path" opacity=".7"/><use href="#loader-path"/></g>'
    + '<g fill="#FFF"><circle class="loader-ball" cx="345" cy="176" r="14"/><circle class="loader-ball" cx="400" cy="176" r="14"/><circle class="loader-ball" cx="455" cy="176" r="14"/></g></g></svg>';

  var svg = loader.querySelector('svg');
  var trails = Array.prototype.slice.call(loader.querySelectorAll('.loader-trails use'));
  var balls = Array.prototype.slice.call(loader.querySelectorAll('.loader-ball'));
  var group = loader.querySelector('.loader-group');

  // DrawSVGPlugin must be explicitly registered or the drawSVG property
  // below is silently ignored and the trail-drawing animation never runs.
  if (typeof DrawSVGPlugin !== 'undefined') {
    gsap.registerPlugin(DrawSVGPlugin);
  }

  var timeline = gsap.timeline({ repeat: -1 });

  gsap.set(balls, { transformOrigin: '50% 100%' });
  gsap.set(trails, { drawSVG: '1% 9%' });
  gsap.set(svg, { visibility: 'visible' });

  [24, 45.5, 68.5, 90].forEach(function (start) {
    timeline.to(trails, { duration: 1, drawSVG: start + '% ' + (start + 8) + '%', ease: 'expo.inOut' });
    timeline.to(balls, { duration: 1, y: '+=120', ease: 'bounce.out', stagger: 0.04 }, '-=0.65');
    timeline.to(balls, { duration: 0.1, scaleX: 1.2, scaleY: 0.8, ease: 'power2.in', stagger: 0.04 }, '-=0.75');
    timeline.to(balls, { duration: 0.1, scaleX: 1, scaleY: 1, stagger: 0.04 }, '-=0.6');
  });
  timeline.to(group, { duration: timeline.duration(), y: '-=480', ease: 'none' }, 0);

  window.addEventListener('load', function () {
    window.setTimeout(function () {
      timeline.pause();
      loader.classList.add('hide');
      window.setTimeout(function () { loader.remove(); }, 550);
    }, 900);
  });
})();