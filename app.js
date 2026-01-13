const lobby = document.getElementById("lobby");
const enterRoom = document.getElementById("enterRoom");
const tableWrapper = document.getElementById("tableWrapper");
const rackSlots = document.getElementById("rackSlots");
const tableDropzone = document.getElementById("tableDropzone");
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
const audioToggle = document.getElementById("audioToggle");
const giftBtn = document.getElementById("giftBtn");
const playerCountSelect = document.getElementById("playerCount");
const roomNameInput = document.getElementById("roomName");
const roomTitle = document.getElementById("roomTitle");
const playerInfo = document.getElementById("playerInfo");

const colors = ["red", "blue", "yellow", "black"];
const players = [];
const approvals = new Map();
let audioOn = true;

const rackSlotCount = 14;
const tileCount = 14;
const tableTiles = [];

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

const createRackSlots = () => {
  rackSlots.innerHTML = "";
  for (let i = 0; i < rackSlotCount; i += 1) {
    const slot = document.createElement("div");
    slot.className = "rack-slot";
    slot.dataset.index = i.toString();
    rackSlots.appendChild(slot);
  }
};

const createTileElement = (number, color) => {
  const tile = document.createElement("div");
  tile.className = `tile ${color}`;
  tile.innerHTML = `<div class="tile-inner">${number}</div>`;
  tile.dataset.origin = "rack";
  tile.dataset.locked = "false";
  return tile;
};

const createTiles = () => {
  const slots = Array.from(document.querySelectorAll(".rack-slot"));
  slots.forEach((slot) => (slot.innerHTML = ""));
  tableDropzone.innerHTML = "";
  tableTiles.length = 0;

  const numbers = Array.from({ length: tileCount }, (_, i) => i + 1);
  numbers.forEach((number, index) => {
    const color = colors[index % colors.length];
    const tile = createTileElement(number, color);
    slots[index].appendChild(tile);
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

const snapToSlot = (tile, slot) => {
  slot.appendChild(tile);
  tile.style.left = "6px";
  tile.style.top = "6px";
  tile.dataset.origin = "rack";
  tile.classList.add("drop-animate");
  setTimeout(() => tile.classList.remove("drop-animate"), 300);
};

const placeOnTable = (tile, x, y) => {
  tableDropzone.appendChild(tile);
  tile.dataset.origin = "table";
  tile.style.left = `${x}px`;
  tile.style.top = `${y}px`;
  tile.classList.add("drop-animate");
  setTimeout(() => tile.classList.remove("drop-animate"), 300);
};

const getClosestSlot = (x, y) => {
  const slots = Array.from(document.querySelectorAll(".rack-slot"));
  let closest = null;
  let distance = Infinity;
  slots.forEach((slot) => {
    const rect = slot.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dist = Math.hypot(centerX - x, centerY - y);
    if (dist < distance) {
      distance = dist;
      closest = slot;
    }
  });
  return distance < 60 ? closest : null;
};

const initDrag = () => {
  let draggingTile = null;
  let offsetX = 0;
  let offsetY = 0;
  let originParent = null;

  const onPointerMove = (event) => {
    if (!draggingTile) return;
    draggingTile.style.left = `${event.clientX - offsetX}px`;
    draggingTile.style.top = `${event.clientY - offsetY}px`;
  };

  const onPointerUp = (event) => {
    if (!draggingTile) return;
    const slot = getClosestSlot(event.clientX, event.clientY);
    const dropzoneRect = tableDropzone.getBoundingClientRect();

    if (slot) {
      snapToSlot(draggingTile, slot);
    } else if (
      event.clientX > dropzoneRect.left &&
      event.clientX < dropzoneRect.right &&
      event.clientY > dropzoneRect.top &&
      event.clientY < dropzoneRect.bottom
    ) {
      const x = event.clientX - dropzoneRect.left - 24;
      const y = event.clientY - dropzoneRect.top - 24;
      placeOnTable(draggingTile, x, y);
    } else if (originParent) {
      originParent.appendChild(draggingTile);
      draggingTile.style.left = "6px";
      draggingTile.style.top = "6px";
    }

    draggingTile.classList.remove("dragging");
    draggingTile = null;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  document.addEventListener("pointerdown", (event) => {
    const target = event.target.closest(".tile");
    if (!target) return;
    draggingTile = target;
    originParent = target.parentElement;
    const rect = target.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    target.classList.add("dragging");
    tableDropzone.appendChild(target);
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  });
};

const setupLobby = () => {
  enterRoom.addEventListener("click", () => {
    const count = Number(playerCountSelect.value);
    const roomName = roomNameInput.value.trim() || "Premium 101 Masası";
    roomTitle.textContent = roomName;
    playerInfo.textContent = `${count} oyuncu`;
    createSeats(count);
    createRackSlots();
    createTiles();
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
    createTiles();
    resetVote();
  });
  audioToggle.addEventListener("click", () => {
    audioOn = !audioOn;
    audioToggle.textContent = `Sesli Sohbet: ${audioOn ? "Açık" : "Kapalı"}`;
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
      createTiles();
      resetVote();
    }
  });
};

const init = () => {
  setupLobby();
  setupActions();
  bindScoreboardEvents();
  initDrag();
  enableNewHand();
};

init();
