const OPEN_VIDEO_SRC = "Open part.mp4";
const CLOSE_VIDEO_SRC = "Closing part.mp4";
const ANNIVERSARY_CODE = "0307";

const screens = {
  cover: document.getElementById("coverScreen"),
  map: document.getElementById("mapScreen"),
  level: document.getElementById("levelScreen")
};

const app = document.getElementById("app");
const coverVideo = document.getElementById("coverVideo");
const bookClickBox = document.getElementById("bookClickBox");
const coverHint = document.getElementById("coverHint");
const transitionCurtain = document.getElementById("transitionCurtain");
const mapCard = document.getElementById("mapCard");
const galleryItems = document.getElementById("galleryItems");
const galleryCount = document.getElementById("galleryCount");
const mapPath = document.querySelector(".map-path");
const routePaths = [...document.querySelectorAll(".map-route path")];
const mapNodes = [...document.querySelectorAll(".map-node[data-level]")];
const chestNode = document.getElementById("chestNode");
const closeBook = document.getElementById("closeBook");
const levelScreen = document.getElementById("levelScreen");
const backToMap = document.getElementById("backToMap");
const skipLevel = document.getElementById("skipLevel");
const levelKicker = document.getElementById("levelKicker");
const levelTitle = document.getElementById("levelTitle");
const levelStatus = document.getElementById("levelStatus");
const gameArea = document.getElementById("gameArea");
const rewardOverlay = document.getElementById("rewardOverlay");
const rewardKicker = document.getElementById("rewardKicker");
const rewardImage = document.getElementById("rewardImage");
const rewardTitle = document.getElementById("rewardTitle");
const rewardBody = document.getElementById("rewardBody");
const rewardContinue = document.getElementById("rewardContinue");
const lockOverlay = document.getElementById("lockOverlay");
const lockClose = document.getElementById("lockClose");
const lockForm = document.getElementById("lockForm");
const codeInput = document.getElementById("codeInput");
const lockMessage = document.getElementById("lockMessage");
const endingOverlay = document.getElementById("endingOverlay");
const endingCloseBook = document.getElementById("endingCloseBook");

const levelData = [
  {
    id: 1,
    title: "Janice's on a run",
    kicker: "Level 1",
    mapBody: "Help 5-year-old Janice jump over Monmon while kenneth keeps chasing from behind.",
    reward: "Level 1 polaroid.png"
  },
  {
    id: 2,
    title: "Whack-a-Me",
    kicker: "Level 2",
    mapBody: "Catch 12-year-old kenneth six times in 30 seconds, but leave the Hachi alone.",
    reward: "Level 2 polaroid.png"
  },
  {
    id: 3,
    title: "Doggo Dodgers",
    kicker: "Level 3",
    mapBody: "Move us around the page and survive 30 seconds while Monmon and Hachi fly in.",
    reward: "Level 3 polaroid.png"
  }
];

const galleryTilts = ["-3deg", "2deg", "-1deg"];
const PRELOAD_IMAGES = [
  "Game design 1.png",
  "5 Year old me.png",
  "5 Year old Janice.png",
  "Pomeranian.png",
  "12 Year Old me.png",
  "Akita.png",
  "20 year old me with jan.png",
  "Level 3 design enviroment.jpg",
  "Level 1 polaroid.png",
  "Level 2 polaroid.png",
  "Level 3 polaroid.png"
];

PRELOAD_IMAGES.forEach(preloadImage);

const state = {
  unlocked: 1,
  completed: new Set(),
  selectedLevel: 1,
  activeLevel: null,
  coverLocked: false,
  treasureUnlocked: false
};

let currentGame = null;
let rewardAction = null;

function showScreen(name) {
  Object.entries(screens).forEach(([screenName, element]) => {
    const active = screenName === name;
    element.classList.toggle("is-active", active);
    element.setAttribute("aria-hidden", String(!active));
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setCurtain(visible, duration = 620) {
  transitionCurtain.classList.toggle("is-visible", visible);
  await wait(duration);
}

function isLevelPlayable(id) {
  return id <= state.unlocked || state.completed.has(id);
}

function getRewardBody(levelId) {
  const messages = {
    1: "Our first memory together. I'll treasure it forever.",
    2: "I'm so glad we found each other. I'll love you forever.",
    3: "Holding your hand feels like a world with no end."
  };

  return messages[levelId] || "";
}

function updateGallery() {
  if (!galleryItems || !galleryCount) return;

  const completedLevels = levelData.filter((level) => state.completed.has(level.id));
  const itemCount = completedLevels.length + (state.treasureUnlocked ? 1 : 0);
  galleryCount.textContent = `${itemCount} saved`;

  if (!itemCount) {
    galleryItems.innerHTML = `<p class="gallery-empty">Beat a level to pin its polaroid here.</p>`;
    return;
  }

  const polaroids = completedLevels.map((level, index) => `
    <button class="gallery-polaroid" type="button" data-gallery-level="${level.id}" aria-label="Open ${level.kicker} polaroid" style="--tilt: ${galleryTilts[index % galleryTilts.length]}">
      <img src="${level.reward}" alt="${level.title} polaroid" />
      <span class="gallery-caption">${level.kicker}</span>
    </button>
  `).join("");

  const treasure = state.treasureUnlocked ? `
    <button class="gallery-polaroid gallery-treasure" type="button" data-gallery-treasure="true" aria-label="Open the treasure" style="--tilt: 2.5deg">
      <video src="Treasure video.mp4" autoplay loop muted playsinline preload="metadata" aria-label="Unlocked treasure video"></video>
      <span class="gallery-caption">The treasure</span>
    </button>
  ` : "";

  galleryItems.innerHTML = `${polaroids}${treasure}`;
}

function updateMap() {
  mapNodes.forEach((node) => {
    const id = Number(node.dataset.level);
    node.classList.toggle("locked", !isLevelPlayable(id));
    node.classList.toggle("unlocked", isLevelPlayable(id) && !state.completed.has(id));
    node.classList.toggle("completed", state.completed.has(id));
    node.classList.toggle("selected", id === state.selectedLevel);
  });

  const chestReady = state.completed.size === levelData.length;
  chestNode.classList.toggle("locked", !chestReady);
  chestNode.classList.toggle("unlocked", chestReady);
  updateGallery();
  requestAnimationFrame(updateMapRoute);
}

function updateMapRoute() {
  if (!mapPath || routePaths.length < 3) return;

  const parentRect = mapPath.getBoundingClientRect();
  if (!parentRect.width || !parentRect.height) return;

  const stops = [
    mapNodes.find((node) => Number(node.dataset.level) === 1),
    mapNodes.find((node) => Number(node.dataset.level) === 2),
    mapNodes.find((node) => Number(node.dataset.level) === 3),
    chestNode
  ];

  if (stops.some((stop) => !stop)) return;

  const stopRects = stops.map((stop) => stop.getBoundingClientRect());
  const route = mapPath.querySelector(".map-route");
  route.setAttribute("viewBox", `0 0 ${parentRect.width} ${parentRect.height}`);

  const bends = [-0.18, 0.26, -0.14];
  routePaths.forEach((path, index) => {
    const start = edgePoint(stopRects[index], stopRects[index + 1], parentRect);
    const end = edgePoint(stopRects[index + 1], stopRects[index], parentRect);
    path.setAttribute("d", curvedRoute(start, end, bends[index]));
  });
}

function edgePoint(fromRect, toRect, parentRect) {
  const from = centerPoint(fromRect, parentRect);
  const to = centerPoint(toRect, parentRect);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const insetGap = 10;
  const radiusX = fromRect.width / 2 + insetGap;
  const radiusY = fromRect.height / 2 + insetGap;

  return {
    x: from.x + Math.cos(angle) * radiusX,
    y: from.y + Math.sin(angle) * radiusY
  };
}

function centerPoint(rect, parentRect) {
  return {
    x: rect.left - parentRect.left + rect.width / 2,
    y: rect.top - parentRect.top + rect.height / 2
  };
}

function curvedRoute(start, end, bendRatio) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  const normal = { x: -dy / distance, y: dx / distance };
  const bend = Math.max(24, Math.min(86, distance * Math.abs(bendRatio))) * Math.sign(bendRatio || 1);
  const c1 = {
    x: start.x + dx * 0.34 + normal.x * bend,
    y: start.y + dy * 0.34 + normal.y * bend
  };
  const c2 = {
    x: start.x + dx * 0.68 + normal.x * bend,
    y: start.y + dy * 0.68 + normal.y * bend
  };

  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function selectLevel(id) {
  const level = levelData.find((item) => item.id === id);
  if (!level || !isLevelPlayable(id)) {
    shake(mapNodes.find((node) => Number(node.dataset.level) === id));
    return;
  }

  state.selectedLevel = id;
  updateMap();
  mapCard.innerHTML = `
    <p class="small-label">${level.kicker}</p>
    <h2>${level.title}</h2>
    <p>${level.mapBody}</p>
    <button class="primary-button" type="button" data-play-level="${level.id}">
      ${state.completed.has(level.id) ? "Replay" : "Play"}
    </button>
  `;
  mapCard.querySelector("[data-play-level]").addEventListener("click", () => startLevel(level.id));
}

function completeLevel(id) {
  state.completed.add(id);
  state.unlocked = Math.min(levelData.length, Math.max(state.unlocked, id + 1));
  state.selectedLevel = Math.min(levelData.length, id + 1);
  updateMap();
  selectLevel(state.selectedLevel);
  showScreen("map");
}

function setCoverTime(seconds) {
  return new Promise((resolve) => {
    const seek = () => {
      coverVideo.currentTime = seconds;
    };

    if (coverVideo.readyState >= 1) {
      seek();
    } else {
      coverVideo.addEventListener("loadedmetadata", seek, { once: true });
    }

    const done = () => {
      coverVideo.removeEventListener("seeked", done);
      resolve();
    };
    coverVideo.addEventListener("seeked", done, { once: true });
    setTimeout(resolve, 420);
  });
}

function setCoverSource(src) {
  return new Promise((resolve) => {
    if (coverVideo.getAttribute("src") === src) {
      resolve();
      return;
    }

    const done = () => {
      coverVideo.removeEventListener("loadedmetadata", done);
      resolve();
    };
    coverVideo.addEventListener("loadedmetadata", done, { once: true });
    coverVideo.src = src;
    coverVideo.load();
    setTimeout(resolve, 520);
  });
}

async function prepareCoverStart() {
  coverVideo.pause();
  coverVideo.muted = true;
  await setCoverSource(OPEN_VIDEO_SRC);
  await setCoverTime(0);
  bookClickBox.disabled = false;
}

function monitorVideoEnd(done) {
  let raf = 0;
  let finished = false;
  const tick = () => {
    if (finished) return;
    if (coverVideo.ended || (coverVideo.duration && coverVideo.currentTime >= coverVideo.duration - 0.05)) {
      finished = true;
      coverVideo.pause();
      cancelAnimationFrame(raf);
      done();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

async function playCoverClip(src) {
  coverVideo.pause();
  await setCoverSource(src);
  await setCoverTime(0);
  await coverVideo.play().catch(() => {});
  return new Promise((resolve) => monitorVideoEnd(resolve));
}

async function openBookSequence() {
  if (state.coverLocked) return;
  state.coverLocked = true;
  bookClickBox.disabled = true;
  coverHint.textContent = "Opening...";
  app.classList.add("opening-book");
  app.classList.remove("map-revealed");
  transitionCurtain.classList.remove("is-visible");
  await setCoverSource(OPEN_VIDEO_SRC);
  await setCoverTime(0);
  await coverVideo.play().catch(() => {});

  monitorVideoEnd(async () => {
    await setCurtain(true, 560);
    showScreen("map");
    app.classList.remove("opening-book");
    app.classList.add("map-revealed");
    updateMap();
    selectLevel(state.selectedLevel);
    await wait(120);
    await setCurtain(false, 660);
    state.coverLocked = false;
  });
}

async function closeBookSequence() {
  if (state.coverLocked) return;
  state.coverLocked = true;
  stopCurrentGame();
  hideOverlay(rewardOverlay);
  hideOverlay(lockOverlay);
  hideOverlay(endingOverlay);
  coverHint.textContent = "Closing...";
  bookClickBox.disabled = true;
  app.classList.add("closing-book");
  await setCurtain(true, 560);
  showScreen("cover");
  app.classList.remove("map-revealed");
  await setCoverSource(CLOSE_VIDEO_SRC);
  await setCoverTime(0);
  await wait(120);
  await setCurtain(false, 560);
  await playCoverClip(CLOSE_VIDEO_SRC);
  await resetCover();
}

async function resetCover() {
  coverVideo.pause();
  await setCoverSource(OPEN_VIDEO_SRC);
  await setCoverTime(0);
  app.classList.remove("map-revealed", "opening-book", "closing-book");
  transitionCurtain.classList.remove("is-visible");
  coverHint.textContent = "Tap the book to open our map.";
  state.coverLocked = false;
  bookClickBox.disabled = false;
}

function startLevel(id) {
  const level = levelData.find((item) => item.id === id);
  if (!level || !isLevelPlayable(id)) return;

  stopCurrentGame();
  state.activeLevel = id;
  showScreen("level");
  levelKicker.textContent = level.kicker;
  levelTitle.textContent = level.title;
  levelStatus.textContent = "Ready";

  if (id === 1) currentGame = createRunnerGame();
  if (id === 2) currentGame = createWhackGame();
  if (id === 3) currentGame = createDodgeGame();
}

function stopCurrentGame() {
  if (currentGame && currentGame.stop) currentGame.stop();
  currentGame = null;
}

function showReward(levelId) {
  const level = levelData.find((item) => item.id === levelId);
  stopCurrentGame();
  rewardKicker.textContent = "Memory complete";
  rewardImage.hidden = false;
  rewardImage.src = level.reward;
  rewardImage.alt = `${level.title} polaroid`;
  rewardTitle.textContent = `Level ${levelId} polaroid unlocked`;
  rewardBody.textContent = getRewardBody(levelId);
  rewardContinue.textContent = "Continue";
  rewardAction = () => {
    hideOverlay(rewardOverlay);
    completeLevel(levelId);
  };
  showOverlay(rewardOverlay);
}

function showGalleryReward(levelId) {
  const level = levelData.find((item) => item.id === levelId);
  if (!level || !state.completed.has(levelId)) return;

  stopCurrentGame();
  rewardKicker.textContent = "Saved memory";
  rewardImage.hidden = false;
  rewardImage.src = level.reward;
  rewardImage.alt = `${level.title} polaroid`;
  rewardTitle.textContent = `Level ${levelId} polaroid unlocked`;
  rewardBody.textContent = getRewardBody(levelId);
  rewardContinue.textContent = "Close";
  rewardAction = () => {
    hideOverlay(rewardOverlay);
    showScreen("map");
    updateMap();
  };
  showOverlay(rewardOverlay);
}

function showFailure(title, body, retry) {
  stopCurrentGame();
  rewardKicker.textContent = "Try again";
  rewardImage.hidden = true;
  rewardImage.removeAttribute("src");
  rewardImage.alt = "";
  rewardTitle.textContent = title;
  rewardBody.textContent = body;
  rewardContinue.textContent = "Retry";
  rewardAction = () => {
    hideOverlay(rewardOverlay);
    retry();
  };
  showOverlay(rewardOverlay);
}

function showOverlay(overlay) {
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
}

function hideOverlay(overlay) {
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
}

function showTreasure() {
  stopCurrentGame();
  hideOverlay(lockOverlay);
  showScreen("map");
  updateMap();
  showOverlay(endingOverlay);
}

function shake(element) {
  if (!element) return;
  element.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-10px)" },
      { transform: "translateX(10px)" },
      { transform: "translateX(0)" }
    ],
    { duration: 260, easing: "ease-out" }
  );
}

function rectsOverlap(a, b, padding = 0) {
  const paddingX = typeof padding === "number" ? padding : padding.x || 0;
  const paddingY = typeof padding === "number" ? padding : padding.y || 0;
  return (
    a.left + paddingX < b.right &&
    a.right - paddingX > b.left &&
    a.top + paddingY < b.bottom &&
    a.bottom - paddingY > b.top
  );
}

function preloadImage(src) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  if (image.decode) image.decode().catch(() => {});
  return image;
}

function setText(element, value) {
  if (element && element.textContent !== value) {
    element.textContent = value;
  }
}

function setSpritePosition(element, x, y = 0) {
  element.style.setProperty("--sprite-x", `${x}px`);
  element.style.setProperty("--sprite-y", `${y}px`);
}

function spriteSize(element, fallbackWidth, fallbackHeight) {
  return {
    width: element.offsetWidth || fallbackWidth,
    height: element.offsetHeight || fallbackHeight
  };
}

function rectFromBottom(sceneSize, left, bottomRatio, width, height, lift = 0) {
  const bottom = sceneSize.height - sceneSize.height * bottomRatio - lift;
  return {
    left,
    right: left + width,
    top: bottom - height,
    bottom,
    width,
    height
  };
}

function centeredRect(x, y, width, height) {
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2,
    width,
    height
  };
}

function createSprite(src, className, alt) {
  const image = document.createElement("img");
  image.decoding = "async";
  image.loading = "eager";
  image.src = src;
  image.className = className;
  image.alt = alt;
  draggableFalse(image);
  return image;
}

function draggableFalse(element) {
  element.draggable = false;
}

function createRunnerGame() {
  setText(levelStatus, "Distance: 0 / 700");
  gameArea.innerHTML = `
    <div class="runner-scene game-scene">
      <div class="runner-bg bg-far"></div>
      <div class="runner-bg bg-near"></div>
      <div class="runner-ground"></div>
      <div class="hud">
        <span class="hud-pill" data-distance>0 / 700</span>
        <span class="hud-pill">Space or tap to jump</span>
      </div>
      <img class="runner-chaser" src="5 Year old me.png" alt="5 year old me" />
      <img class="runner-player" src="5 Year old Janice.png" alt="5 year old Janice" />
    </div>
  `;

  const scene = gameArea.querySelector(".runner-scene");
  const player = gameArea.querySelector(".runner-player");
  const distanceEl = gameArea.querySelector("[data-distance]");
  const obstacles = [];
  let sceneSize = {
    width: scene.clientWidth || gameArea.clientWidth || window.innerWidth,
    height: scene.clientHeight || gameArea.clientHeight || window.innerHeight
  };
  let playerSize = spriteSize(player, 220, 220);
  let distance = 0;
  let y = 0;
  let velocity = 0;
  let isJumping = false;
  let spawnTimer = 0.95;
  let lastHudDistance = -1;
  let last = performance.now();
  let stopped = false;
  let raf = 0;

  function measureScene() {
    sceneSize = {
      width: scene.clientWidth || gameArea.clientWidth || sceneSize.width,
      height: scene.clientHeight || gameArea.clientHeight || sceneSize.height
    };
    playerSize = spriteSize(player, playerSize.width || 220, playerSize.height || 220);
  }

  function jump() {
    if (stopped || isJumping) return;
    isJumping = true;
    velocity = 880;
    player.classList.add("is-jumping");
  }

  function spawnObstacle() {
    const obstacle = createSprite("Pomeranian.png", "runner-obstacle", "Pomeranian obstacle");
    scene.append(obstacle);
    const obstacleData = {
      el: obstacle,
      x: sceneSize.width + 80,
      speed: 430 + Math.random() * 90,
      ...spriteSize(obstacle, 96, 76)
    };
    setSpritePosition(obstacle, obstacleData.x);
    obstacle.addEventListener("load", () => {
      Object.assign(obstacleData, spriteSize(obstacle, obstacleData.width, obstacleData.height));
    }, { once: true });
    obstacles.push(obstacleData);
  }

  function onKey(event) {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      jump();
    }
  }

  function lose() {
    if (stopped) return;
    stopped = true;
    player.classList.add("is-hit");
    setTimeout(() => showFailure(
      "Janice got tagged",
      "Jump a little earlier when Monmon reaches the book path.",
      () => startLevel(1)
    ), 420);
  }

  function win() {
    if (stopped) return;
    stopped = true;
    setTimeout(() => showReward(1), 380);
  }

  function loop(now) {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.045);
    last = now;
    distance += 42 * dt;
    const visibleDistance = Math.min(700, Math.floor(distance));
    if (visibleDistance !== lastHudDistance) {
      setText(distanceEl, `${visibleDistance} / 700`);
      setText(levelStatus, `Distance: ${visibleDistance} / 700`);
      lastHudDistance = visibleDistance;
    }

    if (isJumping) {
      y += velocity * dt;
      velocity -= 2100 * dt;
      if (y <= 0) {
        y = 0;
        velocity = 0;
        isJumping = false;
        player.classList.remove("is-jumping");
      }
      player.style.setProperty("--jump-y", `${-y}px`);
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 1.05 + Math.random() * 0.8;
    }

    for (let index = obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = obstacles[index];
      obstacle.x -= obstacle.speed * dt;
      setSpritePosition(obstacle.el, obstacle.x);
      if (obstacle.x < -obstacle.width - 24) {
        obstacle.el.remove();
        obstacles.splice(index, 1);
      } else {
        const playerRect = rectFromBottom(sceneSize, sceneSize.width * 0.22, 0.15, playerSize.width, playerSize.height, y);
        const obstacleRect = rectFromBottom(sceneSize, obstacle.x, 0.15, obstacle.width, obstacle.height);
        const hitboxInset = {
          x: playerRect.width * 0.38,
          y: playerRect.height * 0.22
        };
        if (!rectsOverlap(playerRect, obstacleRect, hitboxInset)) continue;
        lose();
        return;
      }
    }

    if (distance >= 700) {
      win();
      return;
    }

    raf = requestAnimationFrame(loop);
  }

  measureScene();
  player.addEventListener("load", measureScene, { once: true });
  window.addEventListener("resize", measureScene);
  window.addEventListener("keydown", onKey);
  gameArea.addEventListener("pointerdown", jump);
  raf = requestAnimationFrame(loop);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measureScene);
      window.removeEventListener("keydown", onKey);
      gameArea.removeEventListener("pointerdown", jump);
    }
  };
}

function createWhackGame() {
  levelStatus.textContent = "Catch 0 / 6";
  gameArea.innerHTML = `
    <div class="whack-scene game-scene">
      <div class="hud">
        <span class="hud-pill" data-catches>0 / 6 caught</span>
        <span class="hud-pill" data-timer>30s</span>
      </div>
      <div class="holes" aria-label="Whack-a-mole holes">
        ${Array.from({ length: 6 }, (_, index) => `<button class="hole" type="button" data-hole="${index}" aria-label="Hole ${index + 1}"></button>`).join("")}
      </div>
    </div>
  `;

  const holes = [...gameArea.querySelectorAll(".hole")];
  const catchesEl = gameArea.querySelector("[data-catches]");
  const timerEl = gameArea.querySelector("[data-timer]");
  let catches = 0;
  let timeLeft = 30;
  let stopped = false;
  let activePopup = null;
  let spawnTimeout = 0;
  let timerInterval = 0;

  function updateHud() {
    catchesEl.textContent = `${catches} / 6 caught`;
    timerEl.textContent = `${timeLeft}s`;
    levelStatus.textContent = `Catch ${catches} / 6`;
  }

  function clearPopup() {
    if (!activePopup) return;
    activePopup.button.innerHTML = "";
    activePopup.button.classList.remove("has-popup", "is-target", "is-penalty");
    activePopup = null;
  }

  function schedulePopup(delay = 360) {
    clearTimeout(spawnTimeout);
    spawnTimeout = window.setTimeout(spawnPopup, delay);
  }

  function spawnPopup() {
    if (stopped) return;
    clearPopup();
    const button = holes[Math.floor(Math.random() * holes.length)];
    const isTarget = Math.random() > 0.32;
    button.classList.add("has-popup", isTarget ? "is-target" : "is-penalty");
    const image = createSprite(
      isTarget ? "12 Year Old me.png" : "Akita.png",
      "popup-character",
      isTarget ? "12 year old me" : "Akita"
    );
    button.append(image);
    activePopup = { button, isTarget };
    schedulePopup(780 + Math.random() * 420);
  }

  function onHoleClick(event) {
    if (stopped) return;
    const button = event.currentTarget;
    if (!activePopup || activePopup.button !== button) {
      shake(button);
      return;
    }

    if (!activePopup.isTarget) {
      lose("You tapped the Hachi", "Only catch 12-year-old me. Hachi is the instant-reset decoy.");
      return;
    }

    catches += 1;
    button.classList.add("caught-flash");
    setTimeout(() => button.classList.remove("caught-flash"), 220);
    clearPopup();
    updateHud();

    if (catches >= 6) {
      win();
      return;
    }

    schedulePopup(260);
  }

  function lose(title, body) {
    if (stopped) return;
    stopped = true;
    clearTimeout(spawnTimeout);
    clearInterval(timerInterval);
    clearPopup();
    showFailure(title, body, () => startLevel(2));
  }

  function win() {
    if (stopped) return;
    stopped = true;
    clearTimeout(spawnTimeout);
    clearInterval(timerInterval);
    clearPopup();
    setTimeout(() => showReward(2), 300);
  }

  holes.forEach((hole) => hole.addEventListener("click", onHoleClick));
  updateHud();
  schedulePopup(450);
  timerInterval = window.setInterval(() => {
    if (stopped) return;
    timeLeft -= 1;
    updateHud();
    if (timeLeft <= 0 && catches < 6) {
      lose("Time ran out", "Catch 12-year-old me six times before the countdown reaches zero.");
    }
  }, 1000);

  return {
    stop() {
      stopped = true;
      clearTimeout(spawnTimeout);
      clearInterval(timerInterval);
      holes.forEach((hole) => hole.removeEventListener("click", onHoleClick));
    }
  };
}

function createDodgeGame() {
  setText(levelStatus, "Survive 30s");
  gameArea.innerHTML = `
    <div class="dodge-scene game-scene">
      <div class="hud">
        <span class="hud-pill" data-survive>30.0s</span>
        <span class="hud-pill">Drag, touch, or use arrows</span>
      </div>
      <img class="dodge-player" src="20 year old me with jan.png" alt="Me with Janice" />
    </div>
  `;

  const scene = gameArea.querySelector(".dodge-scene");
  const player = gameArea.querySelector(".dodge-player");
  const surviveEl = gameArea.querySelector("[data-survive]");
  const keys = new Set();
  const hazards = [];
  let position = { x: 50, y: 78 };
  let sceneRect = scene.getBoundingClientRect();
  let sceneSize = {
    width: sceneRect.width || scene.clientWidth || gameArea.clientWidth || window.innerWidth,
    height: sceneRect.height || scene.clientHeight || gameArea.clientHeight || window.innerHeight
  };
  let playerSize = spriteSize(player, 140, 110);
  let elapsed = 0;
  let spawnTimer = 0.5;
  let lastTimerText = "";
  let last = performance.now();
  let stopped = false;
  let raf = 0;

  function measureScene() {
    sceneRect = scene.getBoundingClientRect();
    sceneSize = {
      width: sceneRect.width || scene.clientWidth || gameArea.clientWidth || sceneSize.width,
      height: sceneRect.height || scene.clientHeight || gameArea.clientHeight || sceneSize.height
    };
    playerSize = spriteSize(player, playerSize.width || 140, playerSize.height || 110);
    renderPlayer();
  }

  function playerCenter() {
    return {
      x: (position.x / 100) * sceneSize.width,
      y: (position.y / 100) * sceneSize.height
    };
  }

  function renderPlayer() {
    const center = playerCenter();
    setSpritePosition(player, center.x, center.y);
  }

  function spawnHazard() {
    const isPom = Math.random() > 0.5;
    const hazard = createSprite(isPom ? "Pomeranian.png" : "Akita.png", "hazard", isPom ? "Pomeranian hazard" : "Akita hazard");
    scene.append(hazard);
    const hazardData = {
      el: hazard,
      x: (8 + Math.random() * 84) / 100 * sceneSize.width,
      y: -0.14 * sceneSize.height,
      vx: (-18 + Math.random() * 36) / 100 * sceneSize.width,
      speed: (26 + Math.random() * 22) / 100 * sceneSize.height,
      ...spriteSize(hazard, isPom ? 84 : 92, isPom ? 72 : 82)
    };
    setSpritePosition(hazard, hazardData.x, hazardData.y);
    hazard.addEventListener("load", () => {
      Object.assign(hazardData, spriteSize(hazard, hazardData.width, hazardData.height));
    }, { once: true });
    hazards.push(hazardData);
  }

  function onKeyDown(event) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d"].includes(event.key)) {
      event.preventDefault();
      keys.add(event.key.toLowerCase());
    }
  }

  function onKeyUp(event) {
    keys.delete(event.key.toLowerCase());
  }

  function moveToPointer(event) {
    const pointer = event.touches ? event.touches[0] : event;
    if (!sceneRect.width || !sceneRect.height) measureScene();
    position.x = ((pointer.clientX - sceneRect.left) / sceneRect.width) * 100;
    position.y = ((pointer.clientY - sceneRect.top) / sceneRect.height) * 100;
    position.x = Math.max(8, Math.min(92, position.x));
    position.y = Math.max(22, Math.min(88, position.y));
    renderPlayer();
  }

  function lose() {
    if (stopped) return;
    stopped = true;
    player.classList.add("is-hit");
    setTimeout(() => showFailure(
      "A hazard hit you",
      "Keep the photo moving and dodge every Monmon and Hachi for the full 30 seconds.",
      () => startLevel(3)
    ), 360);
  }

  function win() {
    if (stopped) return;
    stopped = true;
    setTimeout(() => showReward(3), 360);
  }

  function loop(now) {
    if (stopped) return;
    const dt = Math.min((now - last) / 1000, 0.045);
    last = now;
    elapsed += dt;
    const remaining = Math.max(0, 30 - elapsed);
    const timerText = `${remaining.toFixed(1)}s`;
    if (timerText !== lastTimerText) {
      setText(surviveEl, timerText);
      setText(levelStatus, `Survive ${timerText}`);
      lastTimerText = timerText;
    }

    const speed = 48 * dt;
    if (keys.has("arrowleft") || keys.has("a")) position.x -= speed;
    if (keys.has("arrowright") || keys.has("d")) position.x += speed;
    if (keys.has("arrowup") || keys.has("w")) position.y -= speed;
    if (keys.has("arrowdown") || keys.has("s")) position.y += speed;
    position.x = Math.max(8, Math.min(92, position.x));
    position.y = Math.max(22, Math.min(88, position.y));
    renderPlayer();

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnHazard();
      spawnTimer = 0.45 + Math.random() * 0.42;
    }

    for (let index = hazards.length - 1; index >= 0; index -= 1) {
      const hazard = hazards[index];
      hazard.y += hazard.speed * dt;
      hazard.x += hazard.vx * dt;
      setSpritePosition(hazard.el, hazard.x, hazard.y);
      hazard.el.style.setProperty("--sprite-rotation", `${(hazard.y / sceneSize.height) * 220}deg`);

      if (hazard.y > sceneSize.height + hazard.height || hazard.x < -hazard.width || hazard.x > sceneSize.width + hazard.width) {
        hazard.el.remove();
        hazards.splice(index, 1);
      } else {
        const center = playerCenter();
        const playerRect = centeredRect(center.x, center.y, playerSize.width, playerSize.height);
        const hazardRect = centeredRect(hazard.x, hazard.y, hazard.width, hazard.height);
        const hitboxInset = {
          x: playerRect.width * 0.3,
          y: playerRect.height * 0.24
        };
        if (!rectsOverlap(playerRect, hazardRect, hitboxInset)) continue;
        lose();
        return;
      }
    }

    if (elapsed >= 30) {
      win();
      return;
    }

    raf = requestAnimationFrame(loop);
  }

  measureScene();
  player.addEventListener("load", measureScene, { once: true });
  window.addEventListener("resize", measureScene);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  scene.addEventListener("pointermove", moveToPointer);
  scene.addEventListener("pointerdown", moveToPointer);
  scene.addEventListener("touchmove", moveToPointer, { passive: true });
  raf = requestAnimationFrame(loop);

  return {
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", measureScene);
      scene.removeEventListener("pointermove", moveToPointer);
      scene.removeEventListener("pointerdown", moveToPointer);
      scene.removeEventListener("touchmove", moveToPointer);
    }
  };
}

function openChest() {
  if (state.completed.size < levelData.length) {
    shake(chestNode);
    mapCard.innerHTML = `
      <p class="small-label">Still locked</p>
      <h2>The chest is waiting.</h2>
      <p>Finish all three memories first, then the final lock will wake up.</p>
    `;
    return;
  }

  if (state.treasureUnlocked) {
    showTreasure();
    return;
  }

  lockMessage.textContent = "Hint: DD/MM.";
  codeInput.value = "";
  showOverlay(lockOverlay);
  setTimeout(() => codeInput.focus(), 80);
}

bookClickBox.addEventListener("click", openBookSequence);
closeBook.addEventListener("click", closeBookSequence);
endingCloseBook.addEventListener("click", () => {
  hideOverlay(endingOverlay);
  showScreen("map");
  updateMap();
});
backToMap.addEventListener("click", () => {
  stopCurrentGame();
  showScreen("map");
  updateMap();
});

skipLevel.addEventListener("click", () => {
  if (!state.activeLevel) return;
  showReward(state.activeLevel);
});

mapNodes.forEach((node) => {
  node.addEventListener("click", () => selectLevel(Number(node.dataset.level)));
});

chestNode.addEventListener("click", openChest);

galleryItems.addEventListener("click", (event) => {
  const item = event.target.closest("[data-gallery-level], [data-gallery-treasure]");
  if (!item) return;

  if (item.dataset.galleryLevel) {
    showGalleryReward(Number(item.dataset.galleryLevel));
    return;
  }

  if (item.dataset.galleryTreasure && state.treasureUnlocked) {
    showTreasure();
  }
});

rewardContinue.addEventListener("click", () => {
  if (rewardAction) rewardAction();
});

lockClose.addEventListener("click", () => hideOverlay(lockOverlay));
lockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = codeInput.value.replace(/\D/g, "");
  if (code === ANNIVERSARY_CODE) {
    state.treasureUnlocked = true;
    updateGallery();
    showTreasure();
    return;
  }

  lockMessage.textContent = "Not quite. Try the anniversary date as DD/MM.";
  shake(codeInput);
  codeInput.select();
});

codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 4);
});

window.addEventListener("resize", () => requestAnimationFrame(updateMapRoute));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (lockOverlay.classList.contains("is-open")) hideOverlay(lockOverlay);
    if (endingOverlay.classList.contains("is-open")) hideOverlay(endingOverlay);
  }
});

coverVideo.addEventListener("loadedmetadata", prepareCoverStart, { once: true });
if (coverVideo.readyState >= 1) prepareCoverStart();
updateMap();
selectLevel(1);
