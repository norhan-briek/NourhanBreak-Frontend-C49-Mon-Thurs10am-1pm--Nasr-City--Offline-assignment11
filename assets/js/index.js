

const NASA_KEY = "Wj7btbzb7njzNJzn6KtL9mHwqHHRPbKc7NtrMKnK";
const $ = (id) => document.getElementById(id);

/* ---------------------------------------------------------
   1) Navigation (Sidebar + Sections)
--------------------------------------------------------- */
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".app-section");
const sidebar = $("sidebar");

function showSection(name) {
  sections.forEach((s) =>
    s.classList.toggle("hidden", s.dataset.section !== name)
  );

  navLinks.forEach((link) => {
    const active = link.dataset.section === name;
    link.classList.toggle("bg-blue-500/10", active);
    link.classList.toggle("text-blue-400", active);
    link.classList.toggle("text-slate-300", !active);
    link.classList.toggle("hover:bg-slate-800", !active);
  });

  sidebar.classList.remove("open"); 
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});


$("sidebar-toggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

/* ---------------------------------------------------------
   2) APOD - Today in Space
--------------------------------------------------------- */
const dateInput = $("apod-date-input");
const dateInputLabel = dateInput.nextElementSibling; 
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function fetchApod(date) {
  const cacheKey = "apod-" + (date || todayISO());
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed && parsed.url && parsed.date) return parsed;
    localStorage.removeItem(cacheKey);
  }

  
  const candidates = date ? [date] : [undefined, daysAgoISO(1)];
  let lastErr;

  for (const d of candidates) {
    const url =
      `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&thumbs=true` +
      (d ? `&date=${d}` : "");

    for (let attempt = 0; attempt < 1; attempt++) {
      try {
        const res = await fetch(url);
        if (res.status === 429) throw new Error("RATE_LIMIT");
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`APOD ${res.status}: ${body.slice(0, 150)}`);
        }
        const data = await res.json();
        if (!data || !data.url || !data.date) {
          throw new Error("APOD bad response: " + JSON.stringify(data).slice(0, 150));
        }
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      } catch (err) {
        lastErr = err;
        console.error(err);
        if (err.message === "RATE_LIMIT") throw err;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastErr;
}

async function loadApod(date) {
  const loading = $("apod-loading");
  const img = $("apod-image");

  loading.classList.remove("hidden");
  img.classList.add("hidden");

  try {
    const data = await fetchApod(date);

    
    img.src =
      data.media_type === "video"
        ? data.thumbnail_url || "./assets/images/placeholder.webp"
        : data.url;
    img.alt = data.title;

    $("apod-title").textContent = data.title;
    $("apod-explanation").textContent = data.explanation;
    $("apod-date").textContent =
      "Astronomy Picture of the Day - " + formatLongDate(data.date);
    $("apod-date-detail").innerHTML = `<i class="far fa-calendar mr-2"></i>${data.date}`;
    $("apod-date-info").textContent = data.date;
    $("apod-media-type").textContent =
      data.media_type === "video" ? "Video" : "Image";
    $("apod-copyright").textContent = data.copyright
      ? "© " + data.copyright.trim()
      : "Public domain";

    dateInput.value = data.date;
    dateInputLabel.textContent = formatDate(data.date);
  } catch (err) {
  console.error(err);
  img.src = "./assets/images/placeholder.webp";
  img.alt = "Image not available";
  $("apod-title").textContent = "Couldn't load the picture";
  $("apod-explanation").textContent =
    err.message === "RATE_LIMIT"
      ? "وصلنا للحد الأقصى من الطلبات على مفتاح NASA. استني شوية."
      : "سيرفر NASA مش بيرد دلوقتي (" + err.message + "). جربي تاريخ تاني أو حاولي بعد شوية.";
}
   finally {
    loading.classList.add("hidden");
    img.classList.remove("hidden");
  }
}

$("load-date-btn").addEventListener("click", () => {
  if (dateInput.value) loadApod(dateInput.value);
});

$("today-apod-btn").addEventListener("click", () => loadApod());

dateInput.addEventListener("change", () => {
  dateInputLabel.textContent = formatDate(dateInput.value);
});

/* ---------------------------------------------------------
   3) Launches (The Space Devs)
--------------------------------------------------------- */
const LAUNCHES_URL =
  "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=10";


 async function fetchLaunches() {
  const cached = JSON.parse(localStorage.getItem("launches") || "null");
  if (cached && Date.now() - cached.time < 60 * 60 * 1000) return cached.data;

  const res = await fetch(LAUNCHES_URL);
  if (!res.ok) throw new Error("Launches request failed: " + res.status);
  const data = await res.json();
  localStorage.setItem("launches", JSON.stringify({ time: Date.now(), data }));
  return data;
}


const USE_MOCK = false; 



























function statusColor(abbrev) {
  switch (abbrev) {
    case "Go":
      return { badge: "bg-green-500/90", soft: "bg-green-500/20 text-green-400" };
    case "TBC":
      return { badge: "bg-yellow-500/90", soft: "bg-yellow-500/20 text-yellow-400" };
    case "TBD":
      return { badge: "bg-blue-500/90", soft: "bg-blue-500/20 text-blue-400" };
    default:
      return { badge: "bg-slate-500/90", soft: "bg-slate-500/20 text-slate-300" };
  }
}

function launchDateParts(net) {
  const d = new Date(net);
  return {
    date: d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    longDate: d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }),
    time:
      d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
      }) + " UTC",
    days: Math.max(0, Math.ceil((d - Date.now()) / 86400000)),
  };
}

function normalizeLaunch(l) {
  const parts = launchDateParts(l.net);
  return {
    name: l.name,
    status: l.status?.abbrev || "TBD",
    provider: l.launch_service_provider?.name || "Unknown",
    rocket: l.rocket?.configuration?.name || "Unknown",
    pad: l.pad?.name || "Unknown pad",
    location: l.pad?.location?.name || "Unknown location",
    country:
      l.pad?.country?.alpha_3_code ||
      l.pad?.location?.country_code ||
      "N/A",
    description: l.mission?.description || "No description available yet.",
    image: l.image?.image_url || null,
    ...parts,
  };
}

function renderFeatured(l) {
  const c = statusColor(l.status);
  $("featured-launch").innerHTML = `
    <div class="relative bg-slate-800/30 border border-slate-700 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all">
      <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <span class="px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-star"></i> Featured Launch
              </span>
              <span class="px-4 py-1.5 ${c.soft} rounded-full text-sm font-semibold">${l.status}</span>
            </div>
            <h3 class="text-3xl font-bold mb-3 leading-tight">${l.name}</h3>
            <div class="flex flex-col xl:flex-row xl:items-center gap-4 mb-6 text-slate-400">
              <div class="flex items-center gap-2"><i class="fas fa-building"></i><span>${l.provider}</span></div>
              <div class="flex items-center gap-2"><i class="fas fa-rocket"></i><span>${l.rocket}</span></div>
            </div>
            <div class="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-xl mb-6">
              <i class="fas fa-clock text-2xl text-blue-400"></i>
              <div>
                <p class="text-2xl font-bold text-blue-400">${l.days}</p>
                <p class="text-xs text-slate-400">Days Until Launch</p>
              </div>
            </div>
            <div class="grid xl:grid-cols-2 gap-4 mb-6">
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-calendar"></i> Launch Date</p>
                <p class="font-semibold">${l.longDate}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-clock"></i> Launch Time</p>
                <p class="font-semibold">${l.time}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-map-marker-alt"></i> Location</p>
                <p class="font-semibold text-sm">${l.location}</p>
              </div>
              <div class="bg-slate-900/50 rounded-xl p-4">
                <p class="text-xs text-slate-400 mb-1 flex items-center gap-2"><i class="fas fa-globe"></i> Country</p>
                <p class="font-semibold">${l.country}</p>
              </div>
            </div>
            <p class="text-slate-300 leading-relaxed mb-6">${l.description}</p>
          </div>

          <div class="flex flex-col md:flex-row gap-3">
            <button class="flex-1 self-start md:self-center px-6 py-3 bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center gap-2">
              <i class="fas fa-info-circle"></i> View Full Details
            </button>
            <div class="icons self-end md:self-center">
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
              <button class="px-4 py-3 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"><i class="fas fa-bell"></i></button>
            </div>
          </div>

        </div>


        </div>
        <div class="relative">
          <div class="relative h-full min-h-[400px] rounded-2xl overflow-hidden bg-slate-900/50">
            ${
              l.image
                ? `<img src="${l.image}" alt="${l.name}" class="w-full h-full object-cover absolute inset-0" />`
                : `<div class="flex items-center justify-center h-full min-h-[400px] bg-slate-800"><i class="fas fa-rocket text-9xl text-slate-700/50"></i></div>`
            }
            <div class="absolute inset-0 bg-linear-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
        </div>
      </div>
    </div>`;
}

function launchCard(l) {
  const c = statusColor(l.status);
  return `
    <div class="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all group cursor-pointer">
      <div class="relative h-48 bg-slate-900/50 flex items-center justify-center">
        ${
          l.image
            ? `<img src="${l.image}" alt="${l.name}" class="w-full h-full object-cover" />`
            : `<i class="fas fa-rocket text-5xl text-slate-700"></i>`
        }
        <div class="absolute top-3 right-3">
          <span class="px-3 py-1 ${c.badge} text-white backdrop-blur-sm rounded-full text-xs font-semibold">${l.status}</span>
        </div>
      </div>
      <div class="p-5">
        <div class="mb-3">
          <h4 class="font-bold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">${l.name}</h4>
          <p class="text-sm text-slate-400 flex items-center gap-2"><i class="fas fa-building text-xs"></i>${l.provider}</p>
        </div>
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-calendar text-slate-500 w-4"></i><span class="text-slate-300">${l.date}</span></div>
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-clock text-slate-500 w-4"></i><span class="text-slate-300">${l.time}</span></div>
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-rocket text-slate-500 w-4"></i><span class="text-slate-300">${l.rocket}</span></div>
          <div class="flex items-center gap-2 text-sm"><i class="fas fa-map-marker-alt text-slate-500 w-4"></i><span class="text-slate-300 line-clamp-1">${l.pad}</span></div>
        </div>
        <div class="flex items-center gap-2 pt-4 border-t border-slate-700">
          <button class="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors text-sm font-semibold">Details</button>
          <button class="px-3 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"><i class="far fa-heart"></i></button>
        </div>
      </div>
    </div>`;
}

async function loadLaunches() {
  try {
    const data = await fetchLaunches();
    const launches = data.results.map(normalizeLaunch);
    if (!launches.length) return;

    renderFeatured(launches[0]);
    $("launches-grid").innerHTML = launches.map(launchCard).join("");

    $("launches-count").textContent = `${launches.length} Launches`;
    $("launches-count-mobile").textContent = launches.length;
  } catch (err) {
    // لو الـ API وقع، الكروت الثابتة اللي في الـ HTML هتفضل ظاهرة
    console.error(err);
  }
}

/* ---------------------------------------------------------
   4) Planets 
--------------------------------------------------------- */


const PLANETS_URL =
  "https://solar-system-opendata-proxy.vercel.app/api/planets";
let planetsCache = null;


async function fetchPlanets() {
  if (planetsCache) return planetsCache;

  const res = await fetch(PLANETS_URL);
  if (!res.ok) throw new Error("Planets request failed: " + res.status);
  const data = await res.json();

  planetsCache = {};
  data.bodies
    .filter((b) => b.isPlanet)
    .forEach((b) => {
      planetsCache[b.englishName.toLowerCase()] = b;
    });
  return planetsCache;
}

const PLANET_INFO = {
  mercury: {
    description:
      "Mercury is the smallest planet in our solar system and the closest to the Sun. It has almost no atmosphere, so temperatures swing wildly between scorching days and freezing nights.",
    facts: [
      "Smallest planet in the solar system",
      "A year lasts only 88 Earth days",
      "Surface covered in craters, like our Moon",
      "Has no moons and no rings",
    ],
  },
  venus: {
    description:
      "Venus is the hottest planet thanks to a thick carbon-dioxide atmosphere that traps heat. It spins backwards compared to most planets, so the Sun rises in the west.",
    facts: [
      "Hottest planet, hotter than Mercury",
      "Rotates in the opposite direction to Earth",
      "A day on Venus is longer than its year",
      "Atmospheric pressure is about 90x Earth's",
    ],
  },
  earth: {
    description:
      "Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of its surface is covered with water, and it is protected by a strong magnetic field.",
    facts: [
      "Only known planet with liquid water on its surface",
      "Atmosphere contains 78% nitrogen",
      "Magnetic field protects from solar wind",
      "Formed 4.54 billion years ago",
    ],
  },
  mars: {
    description:
      "Mars is a cold desert world with the tallest volcano in the solar system, Olympus Mons. Its red color comes from iron oxide on the surface.",
    facts: [
      "Home to Olympus Mons, the largest volcano known",
      "Has two small moons: Phobos and Deimos",
      "A day lasts about 24.6 hours",
      "Evidence suggests liquid water once flowed there",
    ],
  },
  jupiter: {
    description:
      "Jupiter is the largest planet, a gas giant more than twice as massive as all the other planets combined. Its Great Red Spot is a storm that has raged for centuries.",
    facts: [
      "Largest planet in the solar system",
      "The Great Red Spot is a giant storm",
      "Has dozens of known moons, including Ganymede",
      "Shortest day of all planets, under 10 hours",
    ],
  },
  saturn: {
    description:
      "Saturn is famous for its spectacular ring system made mostly of ice and rock. It is a gas giant so light that it would float in water if there were a big enough ocean.",
    facts: [
      "Has the most extensive ring system",
      "Less dense than water",
      "Its moon Titan has a thick atmosphere",
      "Winds can reach about 1,800 km/h",
    ],
  },
  uranus: {
    description:
      "Uranus is an ice giant that rotates on its side, with an axial tilt of about 98 degrees. Methane in its atmosphere gives it a pale blue-green color.",
    facts: [
      "Rotates on its side",
      "Coldest planetary atmosphere in the solar system",
      "Has faint rings and 27 known moons",
      "Discovered in 1781 with a telescope",
    ],
  },
  neptune: {
    description:
      "Neptune is the farthest planet from the Sun, a dark, cold and windy ice giant. It has the fastest winds in the solar system, reaching over 2,000 km/h.",
    facts: [
      "Farthest known major planet from the Sun",
      "Fastest winds in the solar system",
      "Discovered by mathematical prediction in 1846",
      "Largest moon, Triton, orbits backwards",
    ],
  },
};

const fmt = (n, digits = 2) =>
  Number(n).toLocaleString("en-US", { maximumFractionDigits: digits });

const sciNotation = (value, exp, unit) =>
  `${value} × 10<sup>${exp}</sup> ${unit}`;


async function loadPlanet(id) {
  try {
    const planets = await fetchPlanets();
    const p = planets[id];
    if (!p) throw new Error("Planet not found: " + id);
    const info = PLANET_INFO[id];

    $("planet-detail-image").src = `./assets/images/${id}.png`;
    $("planet-detail-image").alt = `${id} planet`;
    $("planet-detail-name").textContent = p.englishName;
    $("planet-detail-description").textContent =
      p.description || info.description;

    $("planet-distance").textContent = fmt(p.semimajorAxis / 1e6, 1) + "M km";
    $("planet-radius").textContent = fmt(p.meanRadius) + " km";
    $("planet-mass").innerHTML = sciNotation(
      p.mass.massValue,
      p.mass.massExponent,
      "kg"
    );
    $("planet-density").textContent = fmt(p.density) + " g/cm³";
    $("planet-orbital-period").textContent = fmt(p.sideralOrbit) + " days";
    $("planet-rotation").textContent =
      fmt(Math.abs(p.sideralRotation)) + " hours";
    $("planet-moons").textContent = p.moons ? p.moons.length : 0;
    $("planet-gravity").textContent = fmt(p.gravity) + " m/s²";

    $("planet-discoverer").textContent = p.discoveredBy || "Known since antiquity";
    $("planet-discovery-date").textContent = p.discoveryDate || "Ancient";
    $("planet-body-type").textContent = p.bodyType || "Planet";
    $("planet-volume").innerHTML = p.vol
      ? sciNotation(p.vol.volValue, p.vol.volExponent, "km³")
      : "N/A";

    $("planet-perihelion").textContent = fmt(p.perihelion / 1e6, 1) + "M km";
    $("planet-aphelion").textContent = fmt(p.aphelion / 1e6, 1) + "M km";
    $("planet-eccentricity").textContent = p.eccentricity;
    $("planet-inclination").textContent = p.inclination + "°";
    $("planet-axial-tilt").textContent = p.axialTilt + "°";
    $("planet-temp").textContent = Math.round(p.avgTemp - 273.15) + "°C";
    $("planet-escape").textContent = fmt(p.escape / 1000) + " km/s";

    $("planet-facts").innerHTML = info.facts
      .map(
        (f) => `
        <li class="flex items-start">
          <i class="fas fa-check text-green-400 mt-1 mr-2"></i>
          <span class="text-slate-300">${f}</span>
        </li>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    $("planet-detail-description").textContent =
      "حصلت مشكلة في تحميل بيانات الكوكب، جربي تاني.";
  }
}


function highlightPlanet(id) {
  document.querySelectorAll(".planet-card").forEach((card) => {
    card.classList.toggle("ring-2", card.dataset.planetId === id);
    card.classList.toggle("ring-blue-500/50", card.dataset.planetId === id);
  });
}

document.querySelectorAll(".planet-card").forEach((card) => {
  card.addEventListener("click", () => {
    const id = card.dataset.planetId;
    highlightPlanet(id);
    loadPlanet(id);
  });
});

/* ---------------------------------------------------------
   Init
--------------------------------------------------------- */
function init() {
  const today = todayISO();
  dateInput.max = today;
  dateInput.value = today;
  dateInputLabel.textContent = formatDate(today);

  showSection("today-in-space");
  loadApod();
  loadLaunches();

  loadPlanet("earth");
  highlightPlanet("earth");
}

init();