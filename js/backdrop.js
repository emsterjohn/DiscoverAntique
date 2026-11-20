/* DISCOVER ANTIQUE — shared cinematic background crossfade.
   Used by the homepage (municipality section + selected-destination panel)
   and by the attraction detail hero. A photo is only shown after it has loaded
   successfully. If it fails or no photo exists, the layers fade out and the
   section's own clean gradient shows — never an unrelated substitute image. */
(function () {
  function createBackdrop(host, options) {
    const opts = options || {};
    const layers = [0, 1].map(() => {
      const layer = document.createElement("div");
      layer.className = "backdrop-layer" + (opts.layerClass ? " " + opts.layerClass : "");
      layer.setAttribute("aria-hidden", "true");
      return layer;
    });
    host.prepend(layers[1], layers[0]);

    let active = 0;
    let token = 0;
    let current;          // undefined = nothing requested yet

    function hideAll() {
      layers.forEach(layer => layer.classList.remove("is-visible"));
    }

    function setParallax(x, y) {
      const shiftX = Math.max(-18, Math.min(18, Number(x) || 0));
      const shiftY = Math.max(-8, Math.min(8, Number(y) || 0));
      layers.forEach(layer => {
        layer.style.setProperty("--backdrop-shift-x", shiftX + "px");
        layer.style.setProperty("--backdrop-shift-y", shiftY + "px");
      });
    }

    return {
      setParallax,
      /* show(url, onResult): onResult(true|false) reports whether the photo loaded. */
      show(url, onResult) {
        if (url === current) return;
        current = url || null;
        const myToken = ++token;
        if (!url) { hideAll(); if (onResult) onResult(false); return; }

        const probe = new Image();
        probe.decoding = "async";
        probe.fetchPriority = opts.priority || "auto";
        probe.referrerPolicy = "no-referrer";
        probe.onload = () => {
          if (myToken !== token) return;
          const next = layers[1 - active];
          const previous = layers[active];
          next.style.backgroundImage = 'url("' + url.replace(/"/g, "%22") + '")';
          // Restart the slow cinematic push-in on the incoming layer.
          next.classList.remove("is-visible");
          void next.offsetWidth;
          next.classList.add("is-visible");
          previous.classList.remove("is-visible");
          active = 1 - active;
          if (onResult) onResult(true);
        };
        probe.onerror = () => {
          if (myToken !== token) return;
          hideAll();
          if (onResult) onResult(false);
        };
        probe.src = url;
      },
      clear() { current = null; token++; hideAll(); }
    };
  }
  window.DiscoverBackdrop = { create: createBackdrop };
})();
