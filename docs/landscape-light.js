/* A single, interruptible light movement; crossing gaps keeps the last summit. */
(function () {
  'use strict';
  function boot() {
    var scene = document.querySelector('.entry .scene');
    var sun = scene && scene.querySelector('.sun');
    if (!sun) return;
    var enabled = window.matchMedia('(min-width: 761px) and (prefers-reduced-motion: no-preference)');
    var targets = { '01': [.1352, .656, 200], '02': [.3424, .3792, 90], '03': [.57, .1728, 90], '04': [.8656, .2748, 90] };
    var current = { x: 0, y: 0 }, velocity = { x: 0, y: 0 }, destination = { x: 0, y: 0 };
    var selected = null, pending = 0, reset = 0, frame = 0, lastTime = 0;
    function coordinates(route) {
      var t = targets[route], w = scene.clientWidth, h = scene.clientHeight;
      if (!t) return { x: 0, y: 0 };
      var top = h * t[1] - t[2];
      if (route === '01') top = Math.min(top, h * .27);
      return { x: w * t[0] - w * .57, y: Math.max(12, top) - 40 };
    }
    function animate(time) {
      var dt = Math.min((time - lastTime) / 1000 || 1 / 60, .05);
      lastTime = time;
      // Exact critically damped integration keeps velocity continuous when retargeted.
      var omega = 11, decay = Math.exp(-omega * dt);
      ['x', 'y'].forEach(function (axis) {
        var offset = current[axis] - destination[axis];
        var step = (velocity[axis] + omega * offset) * dt;
        current[axis] = destination[axis] + (offset + step) * decay;
        velocity[axis] = (velocity[axis] - omega * step) * decay;
      });
      sun.style.transform = 'translate3d(' + current.x.toFixed(2) + 'px,' + current.y.toFixed(2) + 'px,0)';
      if (Math.abs(current.x - destination.x) + Math.abs(current.y - destination.y) + Math.abs(velocity.x) + Math.abs(velocity.y) > .15) {
        frame = requestAnimationFrame(animate);
      } else { frame = 0; lastTime = 0; }
    }
    function select(route) {
      selected = route;
      destination = coordinates(route);
      if (!frame && enabled.matches) frame = requestAnimationFrame(animate);
    }
    function focusRoute() {
      var focused = scene.querySelector('.tag:focus-visible');
      return focused && focused.getAttribute('data-route');
    }
    function queue(route) {
      clearTimeout(pending); clearTimeout(reset);
      if (!enabled.matches) return;
      var focused = focusRoute();
      if (focused) { select(focused); return; }
      // Ignore fleeting crossings while the pointer is travelling to another summit.
      pending = setTimeout(function () { select(route); }, 90);
    }
    scene.addEventListener('pointerover', function (event) {
      var link = event.target.closest('.peak[data-route],.tag[data-route]');
      if (link && !link.contains(event.relatedTarget)) queue(link.getAttribute('data-route'));
    });
    scene.addEventListener('pointerleave', function () {
      clearTimeout(pending);
      if (!focusRoute()) reset = setTimeout(function () { select(null); }, 650);
    });
    scene.addEventListener('focusin', function () {
      clearTimeout(pending); clearTimeout(reset);
      var route = focusRoute();
      if (route && enabled.matches) select(route);
    });
    scene.addEventListener('focusout', function () {
      clearTimeout(reset);
      reset = setTimeout(function () { if (!focusRoute() && !scene.matches(':hover')) select(null); }, 650);
    });
    function resize() {
      clearTimeout(pending); clearTimeout(reset);
      if (frame) cancelAnimationFrame(frame);
      frame = 0; lastTime = 0;
      velocity = { x: 0, y: 0 };
      if (!enabled.matches) selected = null;
      destination = coordinates(selected); current = { x: destination.x, y: destination.y };
      sun.style.transform = enabled.matches ? 'translate3d(' + current.x + 'px,' + current.y + 'px,0)' : '';
    }
    window.addEventListener('resize', resize);
    enabled.addEventListener('change', resize);
    window.addEventListener('pagehide', function () {
      clearTimeout(pending); clearTimeout(reset);
      if (frame) cancelAnimationFrame(frame);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
