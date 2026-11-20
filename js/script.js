/* DISCOVER ANTIQUE — municipality carousel and navigation */
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const track = document.getElementById("municipalityTrack");
  const destinationSection = document.getElementById("destinationDetails");
  const destinationPhoto = document.getElementById("destinationPhoto");
  const destinationEyebrow = document.getElementById("destinationEyebrow");
  const destinationName = document.getElementById("destinationName");
  const destinationDescription = document.getElementById("destinationDescription");
  const attractionList = document.getElementById("attractionList");
  const municipalitySection = document.querySelector(".municipality-section");

  if (!track || !destinationPhoto || !destinationName || !destinationDescription || !attractionList) return;

  // Both the home page and detail page use the same complete municipality database.
  const municipalities = window.DISCOVER_DESTINATIONS || [];
  if (!municipalities.length) return;

  // Two-layer crossfade backdrops. No stock-photo fallback exists anywhere:
  // if a municipality photo cannot load, the clean section gradient is shown.
  const Backdrop = window.DiscoverBackdrop;
  const sectionBackdrop = Backdrop && municipalitySection ? Backdrop.create(municipalitySection, { layerClass: "section-backdrop-layer" }) : null;
  const panelBackdrop = Backdrop ? Backdrop.create(destinationPhoto, { layerClass: "panel-backdrop-layer" }) : null;
  // Every image comes from the same tourist-spot folders used by the municipality cards.
  const imagePathFor = (municipality, attraction) =>
    `tourist-spot-images/${encodeURIComponent(municipality)}/${encodeURIComponent(attraction)}/image.${municipality === "Culasi" && ["Bantang River", "Batbatan Island"].includes(attraction) ? "avif" : "jpg"}`;
  const imagesForMunicipality = place => (place.attractions || []).map(name => imagePathFor(place.name, name));
  const findAvailableImages = paths => Promise.all(paths.map(path => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(path);
    image.onerror = () => resolve(null);
    image.src = path;
  }))).then(results => results.filter(Boolean));

  const attractionEntries = municipalities.flatMap(place => (place.attractions || []).map(name => ({
    municipality: place.name,
    name,
    category: place.details && place.details[name] ? place.details[name].category || "" : "",
    description: place.details && place.details[name] ? place.details[name].description || "" : "",
    path: imagePathFor(place.name, name)
  })));
  const matchesAny = (entry, terms) => {
    const text = `${entry.category} ${entry.name} ${entry.description}`.toLowerCase();
    return terms.some(term => text.includes(term));
  };
  const pathsForCategory = terms => attractionEntries
    .filter(entry => matchesAny(entry, terms))
    .map(entry => entry.path);

  // Each featured slideshow is restricted to images that match its caption.
  const featureImagePools = {
    coast: pathsForCategory(["coast", "coastal", "island", "marine", "beach", "seaside", "shore", "bay"]),
    water: pathsForCategory(["river", "spring", "waterfall", "water", "lake", "hot bath", "kawa"]),
    highlands: pathsForCategory(["mountain", "highland", "hiking", "cave", "terrace", "viewpoint", "bukid", "hill"])
  };
  const heroImagePool = [...new Set([...featureImagePools.coast, ...featureImagePools.highlands])];

  function syncSelectedBackdrop(path) {
    if (sectionBackdrop) sectionBackdrop.show(path || null);
    if (panelBackdrop) panelBackdrop.show(path || null);
  }

  const createCard = (place, index, copyIndex) => {
    const card = document.createElement("div");
    card.className = "municipality-card";
    card.dataset.municipality = place.name;
    card.dataset.index = String(index);
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", `${place.name} municipality`);

    const image = document.createElement("span");
    image.className = "card-image";
    image.setAttribute("aria-hidden", "true");
    image.classList.add("card-image-fallback");
    const imageA = document.createElement("span");
    imageA.className = "card-image-layer is-visible";
    const imageB = document.createElement("span");
    imageB.className = "card-image-layer";
    image.append(imageA, imageB);
    image.dataset.activeLayer = "0";

    const shade = document.createElement("span");
    shade.className = "card-shade";
    shade.setAttribute("aria-hidden", "true");

    const number = document.createElement("span");
    number.className = "card-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const content = document.createElement("span");
    content.className = "card-content";

    const region = document.createElement("small");
    region.textContent = place.region;

    const title = document.createElement("strong");
    title.textContent = place.name;

    const hint = document.createElement("span");
    hint.textContent = "Press Explore to select ↗";

    content.append(region, title, hint);

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "municipality-play btn btn-light";
    playButton.setAttribute("aria-label", `Explore ${place.name}`);
    playButton.innerHTML = '<span class="play-symbol" aria-hidden="true">▶</span><span>EXPLORE</span>';
    playButton.addEventListener("click", (event) => {
      event.stopPropagation();
      selectMunicipality(index, card);
    });

    card.append(image, shade, number, content, playButton);
    return card;
  };

  // Render each municipality once. The carousel stops at both ends.
  municipalities.forEach((place, index) => {
    track.appendChild(createCard(place, index, 0));
  });

  {
    const interval = 3000;
    function attachSlideshow(host, paths, layers, onImageChange) {
      if (!paths.length) return;
      let active = 0, current = -1, timer = 0, running = false, availablePaths = [], runToken = 0;
      const show = () => {
        if (!availablePaths.length) return;
        let next = availablePaths.length > 1 ? Math.floor(Math.random() * availablePaths.length) : 0;
        if (next === current && availablePaths.length > 1) next = (next + 1) % availablePaths.length;
        current = next;
        if (onImageChange) onImageChange(availablePaths[next]);
        const target = 1 - active;
        layers[target].style.backgroundImage = `url("${availablePaths[next].replace(/"/g, "%22")}")`;
        layers[target].classList.add("is-visible");
        layers[active].classList.remove("is-visible");
        active = target;
      };
      const start = () => {
        if (running) return;
        running = true;
        const token = ++runToken;
        findAvailableImages(paths).then(found => {
          if (!running || token !== runToken) return;
          availablePaths = found;
          show();
          if (availablePaths.length > 1) timer = window.setInterval(show, interval);
        });
      };
      const stop = () => { running = false; runToken++; if (timer) window.clearInterval(timer); timer = 0; };
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => entry.isIntersecting ? start() : stop());
        }, { rootMargin: "100px" });
        observer.observe(host);
      } else start();
    }

    Array.from(track.querySelectorAll(".municipality-card")).forEach(card => {
      const place = municipalities.find(item => item.name === card.dataset.municipality);
      const paths = place ? imagesForMunicipality(place) : [];
      const layers = card.querySelectorAll(".card-image-layer");
      attachSlideshow(card, paths, layers, path => {
        card.dataset.currentImage = path;
        if (Number(card.dataset.index) === selectedIndex) syncSelectedBackdrop(path);
      });
    });

    // The hero uses coastal and highland imagery; each feature card uses its own category.
    const heroImage = document.querySelector(".hero-image");
    if (heroImage) {
      const layers = [document.createElement("span"), document.createElement("span")];
      layers.forEach(layer => { layer.className = "hero-backdrop-layer"; heroImage.appendChild(layer); });
      attachSlideshow(heroImage, heroImagePool, layers);
    }

    document.querySelectorAll("[data-province-slot]").forEach(host => {
      const slot = host.dataset.provinceSlot;
      const layers = [document.createElement("span"), document.createElement("span")];
      layers.forEach(layer => { layer.className = "province-photo-layer"; host.appendChild(layer); });
      attachSlideshow(host, featureImagePools[slot] || [], layers);
    });
  }

  let selectedIndex = -1;
  let isDragging = false;
  let visualFrame = 0;

  const getCards = () => Array.from(track.querySelectorAll(".municipality-card"));

  function selectMunicipality(index, clickedCard) {
    selectedIndex = index;
    const place = municipalities[index];

    getCards().forEach((card) => {
      const active = Number(card.dataset.index) === index;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-pressed", String(active));
    });

    destinationEyebrow.textContent = `${place.region.toUpperCase()} · YOUR NEXT DESTINATION`;
    destinationName.textContent = place.name;
    destinationDescription.textContent = place.description;
    attractionList.replaceChildren();

    place.attractions.forEach((attraction) => {
      const chip = document.createElement("a");
      chip.className = "attraction-chip btn btn-outline-light btn-sm";
      chip.textContent = attraction;
      chip.href = `destination.html?municipality=${encodeURIComponent(place.name)}&attraction=${encodeURIComponent(attraction)}`;
      chip.setAttribute("aria-label", `View details for ${attraction}`);
      attractionList.appendChild(chip);
    });


    destinationSection.classList.add("is-changing");
    const selectedCard = getCards().find(card => Number(card.dataset.index) === index);
    syncSelectedBackdrop(selectedCard && selectedCard.dataset.currentImage ? selectedCard.dataset.currentImage : null);
    const photoCredit = document.getElementById("municipalityPhotoCredit");
    if (photoCredit) photoCredit.textContent = "Municipality backgrounds and cards automatically reuse photos from that municipality’s tourist-spot folders.";
    window.setTimeout(() => destinationSection.classList.remove("is-changing"), 350);

    if (clickedCard && !isDragging) {
      // Bring the selected municipality's information into view after Explore.
      window.setTimeout(() => {
        destinationSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      // Keep the selected card visible without forcing a page jump.
      clickedCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }

  const searchInput = document.getElementById("destinationSearch");
  const searchResults = document.getElementById("destinationSearchResults");
  if (searchInput && searchResults) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLowerCase();
      searchResults.replaceChildren();
      if (!query) { searchResults.hidden = true; return; }
      const matches = [];
      municipalities.forEach((place, index) => {
        if (place.name.toLowerCase().includes(query)) matches.push({ place, index, label: place.name, attraction: "" });
        (place.attractions || []).forEach(attraction => {
          if (attraction.toLowerCase().includes(query)) matches.push({ place, index, label: attraction, attraction });
        });
      });
      matches.slice(0, 8).forEach(match => {
        const button = document.createElement("button");
        button.type = "button"; button.className = "destination-search-result";
        button.textContent = match.attraction ? `${match.label} · ${match.place.name}` : match.label;
        button.setAttribute("role", "option");
        button.addEventListener("click", () => {
          const card = getCards().find(item => Number(item.dataset.index) === match.index);
          selectMunicipality(match.index, card);
          centerMunicipality(match.index);
          searchResults.hidden = true;
          searchInput.value = match.attraction ? match.label : match.place.name;
          if (match.attraction) window.location.href = `destination.html?municipality=${encodeURIComponent(match.place.name)}&attraction=${encodeURIComponent(match.attraction)}`;
        });
        searchResults.appendChild(button);
      });
      if (!matches.length) {
        const empty = document.createElement("p");
        empty.className = "destination-search-empty"; empty.textContent = "No matching municipality or attraction found.";
        searchResults.appendChild(empty);
      }
      searchResults.hidden = false;
    });
    document.addEventListener("click", event => {
      if (!event.target.closest(".destination-search")) searchResults.hidden = true;
    });
    searchInput.addEventListener("keydown", event => {
      if (event.key === "Escape") searchResults.hidden = true;
    });
  }

  function updateCoverflow() {
    const cards = getCards();
    // Use untransformed layout coordinates. Measuring transformed bounding boxes
    // creates a feedback loop that can make the coverflow wobble while scrolling.
    const centerX = track.scrollLeft + track.clientWidth / 2;
    let nearest = null;
    let nearestDistance = Infinity;
    cards.forEach((card) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = (cardCenter - centerX) / Math.max(1, card.offsetWidth + 18);
      const clamped = Math.max(-2.1, Math.min(2.1, distance));
      const absolute = Math.abs(clamped);
      const lift = Math.min(27, absolute * 14);
      const rotate = clamped * -19;
      const scale = 1 - Math.min(.22, absolute * .105);
      card.style.transform = `translate3d(0, ${lift}px, 0) rotateY(${rotate}deg) scale3d(${scale}, ${scale}, 1)`;
      card.style.zIndex = String(100 - Math.round(absolute * 10));
      card.classList.toggle("is-centered", absolute < .48);
      if (Math.abs(cardCenter - centerX) < nearestDistance) {
        nearestDistance = Math.abs(cardCenter - centerX);
        nearest = card;
      }
    });
    if (nearest) {
      const index = Number(nearest.dataset.index);
      if (index !== selectedIndex) selectMunicipality(index);
    }
  }

  function centerMunicipality(index, behavior = "smooth") {
    const card = getCards().find(item => Number(item.dataset.index) === index);
    if (!card) return;
    const target = card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left: Math.max(0, Math.min(target, track.scrollWidth - track.clientWidth)), behavior });
  }

  track.addEventListener("scroll", () => {
    cancelAnimationFrame(visualFrame);
    visualFrame = requestAnimationFrame(() => {
      updateCoverflow();
    });
  }, { passive: true });

  function moveCarousel(direction) {
    const nextIndex = Math.max(0, Math.min(municipalities.length - 1, selectedIndex + direction));
    if (nextIndex === selectedIndex) return;
    centerMunicipality(nextIndex);
  }
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") { event.preventDefault(); moveCarousel(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); moveCarousel(-1); }
  });

  // Let Android and other touch browsers handle horizontal swipes natively.
  // CSS scroll snapping provides a natural, medium-feeling glide in either direction.

  // Mobile menu: close after choosing a section or pressing Escape.
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      menuToggle.textContent = isOpen ? "×" : "☰";
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        menuToggle.textContent = "☰";
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        menuToggle.textContent = "☰";
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 760) {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation");
        menuToggle.textContent = "☰";
      }
    });
  }

  // Wait for layout before measuring so card widths and gaps are included.
  requestAnimationFrame(() => {
    updateCoverflow();
    window.addEventListener("resize", updateCoverflow);

    // Restore the selected municipality when returning from a tourist-spot page.
    const requestedMunicipality = new URLSearchParams(window.location.search).get("municipality");
    if (requestedMunicipality) {
      const restoreIndex = municipalities.findIndex(place => place.name === requestedMunicipality);
      if (restoreIndex >= 0) {
        selectMunicipality(restoreIndex);
        centerMunicipality(restoreIndex, "auto");
        updateCoverflow();
          window.setTimeout(() => {
          destinationSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 180);
      }
    }
  });
});
