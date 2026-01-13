const lobby = document.getElementById("lobby");
const enterRoom = document.getElementById("enterRoom");
const tableWrapper = document.getElementById("tableWrapper");
const rackSlots = document.getElementById("rackSlots");
const tableGrid = document.getElementById("tableGrid");
const drawBtn = document.getElementById("drawBtn");
const pileCount = document.getElementById("pileCount");
const seats = document.getElementById("seats");
const scoreboard = document.getElementById("scoreboard");
const scoreboardBody = document.getElementById("scoreboardBody");
const scoreboardToggle = document.getElementById("scoreboardToggle");
const scoreboardClose = document.getElementById("scoreboardClose");
const votePanel = document.getElementById("votePanel");
const voteToggle = document.getElementById("voteToggle");
const voteList = document.getElementById("voteList");
const closeVote = document.getElementById("closeVote");
const confirmAll = document.getElementById("confirmAll");
const newHandBtn = document.getElementById("newHandBtn");
const autoArrangeBtn = document.getElementById("autoArrange");
const audioToggle = document.getElementById("audioToggle");
const giftBtn = document.getElementById("giftBtn");
const playerCountSelect = document.getElementById("playerCount");
const roomNameInput = document.getElementById("roomName");
const roomTitle = document.getElementById("roomTitle");
const playerInfo = document.getElementById("playerInfo");

const colors = ["red", "blue", "yellow", "black"];
const players = [];
const approvals = new Map();
const state = {
  pile: [],
  rack: [],
  table: [],
  drag: {
    tile: null,
    origin: null,
  },
  audioOn: true,
  currentStarter: "Sen",
  grid: { rows: 4, cols: 14 },
  rackSlotCount: 22,
};

const createSeats = (count) => {
  seats.innerHTML = "";
  players.length = 0;
  const names = ["Sen", "Mert", "Derya", "Ece"];
  for (let index = 0; index < count; index += 1) {
    players.push({ name: names[index], total: 0 });
  }

  const positions = [
    { top: "6%", left: "50%", transform: "translate(-50%, 0)" },
    { top: "50%", left: "92%", transform: "translate(-100%, -50%)" },
    { top: "92%", left: "50%", transform: "translate(-50%, -100%)" },
    { top: "50%", left: "6%", transform: "translate(0, -50%)" },
  ];

  players.forEach((player, index) => {
    const seat = document.createElement("div");
    seat.className = "seat";
    seat.style.top = positions[index].top;
    seat.style.left = positions[index].left;
    seat.style.transform = positions[index].transform;
    seat.innerHTML = `<strong>${player.name}</strong><span>Hazır</span>`;
    seats.appendChild(seat);
  });
};

const createRackSlots = (count) => {
  rackSlots.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const slot = document.createElement("div");
    slot.className = "rack-slot";
    slot.dataset.index = i.toString();
    rackSlots.appendChild(slot);
  }
};

const createTableGrid = (rows, cols) => {
  tableGrid.innerHTML = "";
  state.table = Array.from({ length: rows * cols }, () => null);
  tableGrid.style.setProperty("--grid-cols", cols);
  tableGrid.style.setProperty("--grid-rows", rows);

  for (let i = 0; i < rows * cols; i += 1) {
    const slot = document.createElement("div");
    slot.className = "table-slot";
    slot.dataset.index = i.toString();
    tableGrid.appendChild(slot);
  }
};

const buildTile = (tile) => {
  const tileElement = document.createElement("div");
  tileElement.className = `tile ${tile.color}`;
  tileElement.dataset.id = tile.id;
  tileElement.innerHTML = `<div class="tile-inner">${tile.number}</div>`;
  return tileElement;
};

const shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const createFullSet = () => {
  const tiles = [];
  let id = 0;
  for (let i = 0; i < 106; i += 1) {
    const number = (i % 13) + 1;
    const color = colors[i % colors.length];
    tiles.push({ id: `tile-${id += 1}`, number, color });
  }
  return shuffle(tiles);
};

const dealTiles = () => {
  state.pile = createFullSet();
  const starter = state.currentStarter;
  const starterCount = 22;
  const otherCount = 21;
  const rackTiles = [];

  players.forEach((player) => {
    const count = player.name === starter ? starterCount : otherCount;
    const draw = state.pile.splice(0, count);
    if (player.name === "Sen") {
      rackTiles.push(...draw);
    }
  });

  state.rackSlotCount = starterCount;
  state.rack = Array.from({ length: state.rackSlotCount }, (_, index) => rackTiles[index] || null);
  pileCount.textContent = state.pile.length;
  renderRack();
  renderTable();
};

const renderRack = () => {
  createRackSlots(state.rackSlotCount);
  const slots = Array.from(rackSlots.children);
  state.rack.forEach((tile, index) => {
    if (tile) {
      const tileElement = buildTile(tile);
      slots[index].appendChild(tileElement);
    }
  });
};

const renderTable = () => {
  const slots = Array.from(tableGrid.children);
  slots.forEach((slot, index) => {
    slot.innerHTML = "";
    const tile = state.table[index];
    if (tile) {
      slot.appendChild(buildTile(tile));
    }
  });
};

const updateScoreboard = () => {
  scoreboardBody.innerHTML = "";
  players.forEach((player, index) => {
    const entry = document.createElement("div");
    entry.className = "score-entry";
    entry.innerHTML = `
      <h3>${player.name}</h3>
      <div class="score-controls">
        <input type="number" min="0" placeholder="Puan" data-player="${index}" />
        <button class="primary" data-action="add" data-player="${index}">+ Ekle</button>
        <button class="ghost" data-action="sub" data-player="${index}">- Çıkar</button>
      </div>
      <div class="score-total">Toplam: <span>${player.total}</span></div>
    `;
    scoreboardBody.appendChild(entry);
  });
};

const bindScoreboardEvents = () => {
  scoreboardBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const playerIndex = Number(target.dataset.player);
    const action = target.dataset.action;
    const input = scoreboardBody.querySelector(
      `input[data-player="${playerIndex}"]`
    );
    const value = Number(input.value || 0);
    if (!value) return;
    if (action === "add") {
      players[playerIndex].total += value;
    } else {
      players[playerIndex].total -= value;
    }
    input.value = "";
    updateScoreboard();
  });
};

const setupVoting = () => {
  voteList.innerHTML = "";
  approvals.clear();

  players.forEach((player, index) => {
    approvals.set(index, "Bekliyor");
    const item = document.createElement("div");
    item.className = "vote-item";
    item.innerHTML = `
      <div>
        <strong>${player.name}</strong>
        <div class="vote-status" id="vote-status-${index}">Bekliyor</div>
      </div>
      <div class="vote-buttons">
        <button class="primary" data-vote="approve" data-player="${index}">Onay</button>
        <button class="ghost" data-vote="reject" data-player="${index}">İptal</button>
      </div>
    `;
    voteList.appendChild(item);
  });
};

const updateVoteStatus = (index, status) => {
  approvals.set(index, status);
  const statusNode = document.getElementById(`vote-status-${index}`);
  if (statusNode) {
    statusNode.textContent = status;
    statusNode.style.color =
      status === "Onay" ? "var(--success)" : status === "İptal" ? "var(--danger)" : "var(--muted)";
  }
};

const enableNewHand = () => {
  const allApproved = Array.from(approvals.values()).every(
    (status) => status === "Onay"
  );
  newHandBtn.disabled = !allApproved;
  newHandBtn.classList.toggle("primary", allApproved);
};

const handleVoteClick = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const vote = target.dataset.vote;
  const playerIndex = Number(target.dataset.player);
  if (!vote) return;
  updateVoteStatus(playerIndex, vote === "approve" ? "Onay" : "İptal");
  enableNewHand();
};

const resetVote = () => {
  setupVoting();
  enableNewHand();
};

const getClosestSlotIndex = (slots, x, y, onlyEmpty = false) => {
  let closestIndex = null;
  let distance = Infinity;
  slots.forEach((slot, index) => {
    if (onlyEmpty && slot.firstChild) return;
    const rect = slot.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.hypot(centerX - x, centerY - y);
    if (dist < distance) {
      distance = dist;
      closestIndex = index;
    }
  });
  return { index: closestIndex, distance };
};

const findNearestEmptyTableSlot = (x, y) => {
  const slots = Array.from(tableGrid.children);
  const { index } = getClosestSlotIndex(slots, x, y, true);
  return index;
};

const findTileById = (tileId) => {
  return state.rack.find((item) => item?.id === tileId) || state.table.find((item) => item?.id === tileId);
};

const findRackIndex = (tileId) => state.rack.findIndex((item) => item?.id === tileId);

const findFirstEmptyRackSlot = () => state.rack.findIndex((item) => !item);

const placeTileInRack = (tile, targetIndex) => {
  const currentIndex = findRackIndex(tile.id);
  if (targetIndex === null) return;
  const nextRack = [...state.rack];

  if (currentIndex === -1) {
    nextRack[targetIndex] = tile;
  } else {
    const temp = nextRack[targetIndex];
    nextRack[targetIndex] = tile;
    nextRack[currentIndex] = temp || null;
  }

  state.rack = nextRack;
  state.table = state.table.map((item) => (item?.id === tile.id ? null : item));
  renderRack();
  renderTable();
};

const placeTileOnTable = (tile, slotIndex) => {
  if (slotIndex === null) return;
  const tableTiles = [...state.table];
  const currentIndex = tableTiles.findIndex((item) => item?.id === tile.id);
  if (currentIndex !== -1) {
    tableTiles[currentIndex] = null;
  }

  const rackIndex = findRackIndex(tile.id);
  if (rackIndex !== -1) {
    state.rack[rackIndex] = null;
  }

  tableTiles[slotIndex] = tile;
  state.table = tableTiles;
  renderRack();
  renderTable();
};

const returnTileToRack = (tile) => {
  const currentIndex = findRackIndex(tile.id);
  const emptyIndex = findFirstEmptyRackSlot();
  if (currentIndex === -1 && emptyIndex !== -1) {
    state.rack[emptyIndex] = tile;
    state.table = state.table.map((item) => (item?.id === tile.id ? null : item));
  }
  renderRack();
  renderTable();
};

const setHoverSlot = (slot) => {
  document.querySelectorAll(".rack-slot, .table-slot").forEach((el) => {
    el.classList.remove("highlight");
    el.classList.remove("active");
  });
  if (slot) {
    slot.classList.add(slot.classList.contains("rack-slot") ? "highlight" : "active");
  }
};

const addGhostToOrigin = (tileElement) => {
  const originSlot = tileElement.parentElement;
  if (!originSlot || !originSlot.classList.contains("rack-slot")) return;
  const ghost = tileElement.cloneNode(true);
  ghost.classList.add("ghost");
  ghost.dataset.ghost = "true";
  originSlot.appendChild(ghost);
};

const removeGhosts = () => {
  document.querySelectorAll(".tile.ghost").forEach((ghost) => ghost.remove());
};

const startDrag = (tileElement, event) => {
  const tileId = tileElement.dataset.id;
  const tile = findTileById(tileId);
  if (!tile) return;
  state.drag.tile = tile;
  state.drag.origin = tileElement.parentElement;
  tileElement.classList.add("dragging");
  addGhostToOrigin(tileElement);
  tileElement.setPointerCapture(event.pointerId);
  moveDraggedTile(tileElement, event.clientX, event.clientY);
};

const moveDraggedTile = (tileElement, x, y) => {
  tileElement.style.left = `${x - tileElement.offsetWidth / 2}px`;
  tileElement.style.top = `${y - tileElement.offsetHeight / 2}px`;
};

const endDrag = (tileElement, event) => {
  const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
  const rackSlot = dropTarget?.closest(".rack-slot");
  const tableSlot = dropTarget?.closest(".table-slot");

  if (rackSlot) {
    const targetIndex = Number(rackSlot.dataset.index);
    placeTileInRack(state.drag.tile, targetIndex);
  } else if (tableSlot) {
    const tableIndex = Number(tableSlot.dataset.index);
    const emptyIndex = state.table[tableIndex]
      ? findNearestEmptyTableSlot(event.clientX, event.clientY)
      : tableIndex;
    if (emptyIndex === null) {
      returnTileToRack(state.drag.tile);
    } else {
      placeTileOnTable(state.drag.tile, emptyIndex);
    }
  } else {
    returnTileToRack(state.drag.tile);
  }

  tileElement.classList.remove("dragging");
  tileElement.style.left = "";
  tileElement.style.top = "";
  state.drag.tile = null;
  state.drag.origin = null;
  removeGhosts();
  setHoverSlot(null);
};

const handlePointerMove = (event) => {
  if (!state.drag.tile) return;
  const tileElement = document.querySelector(".tile.dragging");
  if (!tileElement) return;
  moveDraggedTile(tileElement, event.clientX, event.clientY);
  const hovered = document.elementFromPoint(event.clientX, event.clientY);
  const slot = hovered?.closest(".rack-slot, .table-slot");
  setHoverSlot(slot);
};

const handlePointerUp = (event) => {
  if (!state.drag.tile) return;
  const tileElement = document.querySelector(".tile.dragging");
  if (!tileElement) return;
  endDrag(tileElement, event);
};

const bindDragEvents = () => {
  document.addEventListener("pointerdown", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile || tile.dataset.ghost) return;
    startDrag(tile, event);
  });

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
};

const drawFromPile = () => {
  const tile = state.pile.shift();
  if (!tile) return;
  const emptyIndex = findFirstEmptyRackSlot();
  if (emptyIndex === -1) {
    state.rack.push(tile);
    state.rackSlotCount += 1;
  } else {
    state.rack[emptyIndex] = tile;
  }
  pileCount.textContent = state.pile.length;
  renderRack();
};

const groupRuns = (tiles) => {
  const runs = [];
  const groupedByColor = colors.reduce((acc, color) => {
    acc[color] = tiles.filter((tile) => tile.color === color).sort((a, b) => a.number - b.number);
    return acc;
  }, {});

  Object.values(groupedByColor).forEach((group) => {
    let current = [];
    group.forEach((tile, index) => {
      if (!current.length || tile.number === group[index - 1].number + 1) {
        current.push(tile);
      } else {
        if (current.length >= 3) runs.push(current);
        current = [tile];
      }
    });
    if (current.length >= 3) runs.push(current);
  });

  return runs;
};

const groupSets = (tiles) => {
  const sets = [];
  const byNumber = tiles.reduce((acc, tile) => {
    acc[tile.number] = acc[tile.number] || [];
    acc[tile.number].push(tile);
    return acc;
  }, {});

  Object.values(byNumber).forEach((group) => {
    const uniqueColors = [];
    group.forEach((tile) => {
      if (!uniqueColors.some((item) => item.color === tile.color)) uniqueColors.push(tile);
    });
    if (uniqueColors.length >= 3) sets.push(uniqueColors.slice(0, 4));
  });
  return sets;
};

const autoArrange = () => {
  const tiles = state.rack.filter(Boolean);
  const used = new Set();
  const layout = [];

  groupRuns(tiles).forEach((run) => {
    run.forEach((tile) => used.add(tile.id));
    layout.push(run);
  });

  const remaining = tiles.filter((tile) => !used.has(tile.id));
  groupSets(remaining).forEach((set) => {
    set.forEach((tile) => used.add(tile.id));
    layout.push(set);
  });

  const leftovers = tiles.filter((tile) => !used.has(tile.id));
  if (leftovers.length) {
    layout.push(leftovers);
  }

  const totalSlots = state.grid.rows * state.grid.cols;
  const tableTiles = Array.from({ length: totalSlots }, () => null);
  let cursor = 0;

  layout.forEach((group) => {
    group.forEach((tile) => {
      if (cursor < totalSlots) {
        tableTiles[cursor] = tile;
        cursor += 1;
      }
    });
    if (cursor % state.grid.cols !== 0) {
      cursor += state.grid.cols - (cursor % state.grid.cols);
    }
  });

  state.table = tableTiles;
  const usedOnTable = new Set(tableTiles.filter(Boolean).map((tile) => tile.id));
  state.rack = state.rack.map((tile) => (tile && !usedOnTable.has(tile.id) ? tile : null));
  renderRack();
  renderTable();
};

const setupLobby = () => {
  enterRoom.addEventListener("click", () => {
    const count = Number(playerCountSelect.value);
    const roomName = roomNameInput.value.trim() || "Premium 101 Masası";
    roomTitle.textContent = roomName;
    playerInfo.textContent = `${count} oyuncu`;
    createSeats(count);
    createTableGrid(state.grid.rows, state.grid.cols);
    dealTiles();
    updateScoreboard();
    setupVoting();
    tableWrapper.classList.add("active");
    lobby.classList.add("hidden");
  });
};

const setupActions = () => {
  scoreboardToggle.addEventListener("click", () => {
    scoreboard.classList.toggle("active");
  });
  scoreboardClose.addEventListener("click", () => {
    scoreboard.classList.remove("active");
  });
  voteToggle.addEventListener("click", () => {
    votePanel.classList.add("active");
  });
  closeVote.addEventListener("click", () => {
    votePanel.classList.remove("active");
  });
  voteList.addEventListener("click", handleVoteClick);
  confirmAll.addEventListener("click", () => {
    players.forEach((_, index) => updateVoteStatus(index, "Onay"));
    enableNewHand();
  });
  newHandBtn.addEventListener("click", () => {
    dealTiles();
    resetVote();
  });
  autoArrangeBtn.addEventListener("click", autoArrange);
  drawBtn.addEventListener("click", drawFromPile);
  audioToggle.addEventListener("click", () => {
    state.audioOn = !state.audioOn;
    audioToggle.textContent = `Sesli Sohbet: ${state.audioOn ? "Açık" : "Kapalı"}`;
  });
  giftBtn.addEventListener("click", () => {
    giftBtn.textContent = "Hediye Gönderildi";
    setTimeout(() => (giftBtn.textContent = "Hediye Gönder"), 1600);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "y") {
      scoreboard.classList.toggle("active");
    }
    if (event.key.toLowerCase() === "v") {
      votePanel.classList.toggle("active");
    }
    if (event.key.toLowerCase() === "n") {
      dealTiles();
      resetVote();
    }
  });
};

const init = () => {
  setupLobby();
  setupActions();
  bindScoreboardEvents();
  bindDragEvents();
  enableNewHand();
};

init();
