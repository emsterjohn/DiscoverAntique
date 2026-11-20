document.addEventListener("DOMContentLoaded", () => {
  const el = id => document.getElementById(id);
  const data = window.DISCOVER_DESTINATIONS || [];
  const detailMenuToggle = el("detailMenuToggle");
  const detailMainNav = el("detailMainNav");
  if (detailMenuToggle && detailMainNav) {
    const closeDetailMenu = () => {
      detailMainNav.classList.remove("open");
      detailMenuToggle.setAttribute("aria-expanded", "false");
      detailMenuToggle.setAttribute("aria-label", "Open navigation");
      detailMenuToggle.textContent = "☰";
    };
    detailMenuToggle.addEventListener("click", () => {
      const isOpen = detailMainNav.classList.toggle("open");
      detailMenuToggle.setAttribute("aria-expanded", String(isOpen));
      detailMenuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      detailMenuToggle.textContent = isOpen ? "×" : "☰";
    });
    detailMainNav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeDetailMenu));
    document.addEventListener("keydown", event => { if (event.key === "Escape") closeDetailMenu(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 760) closeDetailMenu(); });
  }

  const params = new URLSearchParams(location.search);
  let municipality = data.find(item => item.name === params.get("municipality")) || data[0];
  let attractionIndex = 0;
  let activeLightboxKeyHandler = null;

  const title = el("detailTitle");
  const heroHost = el("detailHeroBackdrop");
  const heroSection = heroHost ? heroHost.closest(".detail-hero") : null;
  const heroCredit = el("detailHeroCredit");
  const heroBackdrop = heroHost && window.DiscoverBackdrop ? window.DiscoverBackdrop.create(heroHost) : null;
  const nextButtons = [el("nextAttraction"), el("bottomNextAttraction")].filter(Boolean);
  const previousButtons = [el("backToMunicipality"), el("bottomBackToMunicipality")].filter(Boolean);
  const municipalitySelect = el("detailMunicipalitySelect");
  if (!data.length || !title) return;

  if (municipalitySelect) {
    data.forEach(item => {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name;
      municipalitySelect.appendChild(option);
    });
    municipalitySelect.value = municipality.name;
    municipalitySelect.addEventListener("change", () => {
      const chosen = data.find(item => item.name === municipalitySelect.value);
      if (!chosen || chosen.name === municipality.name) return;
      municipality = chosen;
      attractionIndex = 0;
      renderAttraction();
    });
  }

  function attractionsFor(item) {
    return (item.attractions || []).filter(name => item.details && item.details[name]);
  }

  function attractionUrl(item, attractionName) {
    return `destination.html?municipality=${encodeURIComponent(item.name)}&attraction=${encodeURIComponent(attractionName)}`;
  }

  function updateUrl() {
    const url = new URL(location.href);
    url.searchParams.set("municipality", municipality.name);
    url.searchParams.set("attraction", attractionsFor(municipality)[attractionIndex]);
    history.replaceState({ municipality: municipality.name, attractionIndex }, "", url);
  }

  function attractionImagePath(municipalityName, attractionName) {
    return `tourist-spot-images/${encodeURIComponent(municipalityName)}/${encodeURIComponent(attractionName)}/image.jpg`;
  }

  function renderLocalGallery(municipalityName, attractionName, galleryHost) {
    document.querySelectorAll(".photo-lightbox").forEach(item => item.remove());
    if (activeLightboxKeyHandler) document.removeEventListener("keydown", activeLightboxKeyHandler);
    const path = attractionImagePath(municipalityName, attractionName);
    const localWrap = document.createElement("div");
    localWrap.className = "local-photo-gallery";
    localWrap.setAttribute("aria-label", `Photo of ${attractionName}`);
    const heading = document.createElement("p");
    heading.className = "local-gallery-heading";
    heading.textContent = "TOURIST SPOT PHOTO";
    const grid = document.createElement("div");
    grid.className = "local-gallery-grid";
    const modal = document.createElement("div");
    modal.className = "photo-lightbox";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", `${attractionName} photo viewer`);
    const modalImage = document.createElement("img");
    modalImage.alt = attractionName;
    modalImage.src = path;
    const close = document.createElement("button");
    close.type = "button"; close.className = "lightbox-close"; close.textContent = "×"; close.setAttribute("aria-label", "Close photo viewer");
    const image = document.createElement("img");
    image.src = path; image.alt = `${attractionName}, ${municipalityName}`;
    image.loading = "lazy"; image.decoding = "async";
    image.addEventListener("error", () => { localWrap.remove(); modal.remove(); });
    const button = document.createElement("button");
    button.type = "button"; button.className = "local-gallery-item";
    button.setAttribute("aria-label", `Open photo of ${attractionName}`);
    button.appendChild(image);
    button.addEventListener("click", () => { modal.hidden = false; document.body.classList.add("lightbox-open"); close.focus(); });
    const closeModal = () => { modal.hidden = true; document.body.classList.remove("lightbox-open"); };
    close.addEventListener("click", closeModal);
    modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
    activeLightboxKeyHandler = event => { if (!modal.hidden && event.key === "Escape") closeModal(); };
    document.addEventListener("keydown", activeLightboxKeyHandler);
    modal.append(modalImage, close);
    grid.appendChild(button);
    localWrap.append(heading, grid);
    galleryHost.appendChild(localWrap);
    document.body.appendChild(modal);
  }

  function renderAttraction() {
    const attractions = attractionsFor(municipality);
    if (!attractions.length) {
      title.textContent = "Destination information unavailable";
      return;
    }
    attractionIndex = (attractionIndex + attractions.length) % attractions.length;
    const attractionName = attractions[attractionIndex];
    const detail = municipality.details[attractionName];

    document.title = `${attractionName} | Discover Antique`;
    if (municipalitySelect) municipalitySelect.value = municipality.name;
    el("detailRegion").textContent = `${municipality.region.toUpperCase()} · ANTIQUE, PHILIPPINES`;
    title.textContent = attractionName;
    el("detailSubtitle").textContent = `${detail.category || "Featured destination"} · ${detail.location || municipality.name + ", Antique"}`;
    // The single image in this attraction's folder is reused for its detail hero.
    const attractionPhotoPath = attractionImagePath(municipality.name, attractionName);
    const heroLabel = `${attractionName}, ${municipality.name}, Antique`;
    if (heroHost) heroHost.setAttribute("aria-label", heroLabel);
    if (heroSection) heroSection.dataset.photoSource = "tourist-spot-folder";
    if (heroHost) {
      heroHost.style.backgroundImage = "";
      if (heroBackdrop) {
        heroBackdrop.show(attractionPhotoPath, loaded => {
          if (heroCredit) {
            heroCredit.hidden = false;
            heroCredit.className = loaded ? "hero-photo-credit" : "hero-photo-credit is-missing";
            heroCredit.textContent = loaded ? "Photo: local tourist-spot image" : "Add image.jpg to this tourist spot's folder to display its photo.";
          }
        });
      }
    }

    // Keep a coordinated button palette for each municipality region.
    const region = (municipality.region || "").toLowerCase();
    let palette = { primary: "#176b55", hover: "#10543f", accent: "#c7a878" };
    if (region.includes("southern")) palette = { primary: "#176b78", hover: "#10515d", accent: "#d1b27d" };
    else if (region.includes("northern")) palette = { primary: "#8a6335", hover: "#684923", accent: "#e0c28e" };
    else if (region.includes("central")) palette = { primary: "#176b55", hover: "#10543f", accent: "#c7a878" };
    document.documentElement.style.setProperty("--municipality-primary", palette.primary);
    document.documentElement.style.setProperty("--municipality-hover", palette.hover);
    document.documentElement.style.setProperty("--municipality-accent", palette.accent);
    el("detailDescription").textContent = detail.description;

    const highlights = el("detailHighlights");
    highlights.replaceChildren();
    (detail.highlights || []).forEach(value => {
      const li = document.createElement("li");
      li.textContent = value;
      highlights.appendChild(li);
    });

    const gallery = el("detailGallery");
    gallery.replaceChildren();

    // One consistent VIEW PHOTOS action for every attraction in every municipality.
    // Google Images opens in a separate tab, leaving this destination page available.
    const imageSearchQuery = `${attractionName} ${municipality.name} Antique Philippines`;
    const viewPhotosLink = document.createElement("a");
    viewPhotosLink.className = "view-photos-button";
    viewPhotosLink.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(imageSearchQuery)}`;
    viewPhotosLink.target = "_blank";
    viewPhotosLink.rel = "noopener noreferrer";
    viewPhotosLink.textContent = "VIEW PHOTOS ↗";
    viewPhotosLink.title = `Search Google Images for ${imageSearchQuery}`;
    viewPhotosLink.setAttribute("aria-label", `View Google Images results for ${imageSearchQuery} in a new tab`);
    gallery.appendChild(viewPhotosLink);
    renderLocalGallery(municipality.name, attractionName, gallery);

    const galleryDisclaimer = el("galleryDisclaimer");
    if (galleryDisclaimer) {
      galleryDisclaimer.textContent = `Add one image.jpg inside tourist-spot-images/${municipality.name}/${attractionName}/. The same photo is reused by the municipality background and attraction card. VIEW PHOTOS still opens Google Images in a new tab.`;
    }

    const placeQuery = encodeURIComponent(`${attractionName}, ${municipality.name}, Antique, Western Visayas, Philippines`);
    el("detailLocation").textContent = detail.location || `${attractionName}, ${municipality.name}, Antique, Western Visayas, Philippines`;
    const sourceLink = el("detailSourceLink");
    if (sourceLink) { sourceLink.href = detail.sourceUrl || "https://experiencewesternvisayas.com/antique/"; sourceLink.textContent = detail.sourceLabel ? `View ${detail.sourceLabel} ↗` : "View information source ↗"; }
    el("detailMap").src = `https://www.google.com/maps?q=${placeQuery}&output=embed`;
    el("openMapLink").href = `https://www.google.com/maps/search/?api=1&query=${placeQuery}`;
    el("detailNote").textContent = detail.note || "Confirm access and visitor information locally before travelling.";

    const step = `${String(attractionIndex + 1).padStart(2, "0")} / ${String(attractions.length).padStart(2, "0")}`;
    el("destinationStep").textContent = step;
    const previousAttraction = attractions[(attractionIndex - 1 + attractions.length) % attractions.length];
    previousButtons.forEach(link => { link.href = attractionUrl(municipality, previousAttraction); });
    updateUrl();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextAttraction() {
    const attractions = attractionsFor(municipality);
    attractionIndex = (attractionIndex + 1) % attractions.length;
    renderAttraction();
  }

  function previousAttraction(event) {
    if (event) event.preventDefault();
    const attractions = attractionsFor(municipality);
    attractionIndex = (attractionIndex - 1 + attractions.length) % attractions.length;
    renderAttraction();
  }

  nextButtons.forEach(button => button.addEventListener("click", nextAttraction));
  previousButtons.forEach(button => button.addEventListener("click", previousAttraction));

  const requestedAttraction = params.get("attraction");
  const initialAttractions = attractionsFor(municipality);
  const requestedIndex = initialAttractions.indexOf(requestedAttraction);
  attractionIndex = requestedIndex >= 0 ? requestedIndex : 0;

  renderAttraction();
});