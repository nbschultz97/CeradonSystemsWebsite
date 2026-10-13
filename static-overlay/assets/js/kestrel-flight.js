// Playback is deliberate, including with reduced motion. Native controls remain available.
(function () {
  'use strict';
  document.querySelectorAll('[data-flight-toggle]').forEach(function (button) {
    var video = document.getElementById(button.dataset.flightToggle);
    if (!video) return;
    function update() { button.textContent = video.paused ? 'Play flight' : 'Pause flight'; }
    button.addEventListener('click', function () {
      if (!video.paused) { video.pause(); return; }
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function (error) { if (error.name === 'AbortError') update(); else button.textContent = 'Retry playback'; });
    });
    video.addEventListener('play', update);
    video.addEventListener('pause', update);
    video.addEventListener('ended', update);
    update();
  });
})();
