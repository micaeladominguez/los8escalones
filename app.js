// Estado del juego
let players = []; // {id, name, step}
let history = []; // para deshacer

const MAX_PLAYERS = 10;
const MAX_STEP = 8;

const el = (id) => document.getElementById(id);

window.addEventListener("DOMContentLoaded", () => {
    el("startBtn").addEventListener("click", startGame);
    el("resetAllBtn").addEventListener("click", resetAll);
    el("undoBtn").addEventListener("click", undo);
    renderSteps(); // dibuja las 8 bandas vacías
});

/* === Inicialización === */
function startGame() {
    const raw = el("namesInput").value.trim();
    const names = raw
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

    if (names.length === 0) {
        showError("Ingresá al menos 1 nombre.");
        return;
    }
    if (names.length > MAX_PLAYERS) {
        showError(`Máximo ${MAX_PLAYERS} participantes.`);
        return;
    }

    clearError();

    // Inicializa: todos en escalón 1
    players = names.map((n, i) => ({ id: i + 1, name: n, step: 1 }));
    history = [];

    // UI
    el("setup").classList.add("hidden");
    el("game").classList.remove("hidden");

    renderAll();
}

/* === Render === */
function renderAll() {
    renderSteps();
    renderRoster();
}

function renderSteps() {
    const stepsEl = el("steps");
    stepsEl.innerHTML = "";

    for (let s = 1; s <= MAX_STEP; s++) {
        const stepBox = document.createElement("div");
        stepBox.className = "step";
        // resalta el escalón con más movimiento reciente
        if (history.length && history[history.length - 1].to === s) {
            stepBox.classList.add("active");
        }

        const title = document.createElement("div");
        title.className = "step-title";
        title.textContent = `ESCALÓN ${s}`;

        const peopleWrap = document.createElement("div");
        peopleWrap.className = "step-people";

        const here = players.filter((p) => p.step === s);
        if (here.length === 0) {
            const none = document.createElement("span");
            none.className = "tag";
            none.textContent = "— vacío —";
            peopleWrap.appendChild(none);
        } else {
            here.forEach((p) => {
                const chip = document.createElement("span");
                chip.className = "chip";
                chip.innerHTML = `<strong>${escapeHtml(p.name)}</strong><small>(${p.step})</small>`;
                peopleWrap.appendChild(chip);
            });
        }

        stepBox.appendChild(title);
        stepBox.appendChild(peopleWrap);
        stepsEl.appendChild(stepBox);
    }
}

function renderRoster() {
    const ul = el("roster");
    ul.innerHTML = "";
    players.forEach((p) => {
        const li = document.createElement("li");
        li.innerHTML = `
      <div>
        <div><strong>${escapeHtml(p.name)}</strong></div>
        <div class="tag">Escalón ${p.step}</div>
      </div>
      <div class="row">
        <button class="iconbtn" title="Bajar" data-act="down" data-id="${p.id}">−</button>
        <button class="iconbtn" title="Subir" data-act="up" data-id="${p.id}">+</button>
        <button class="iconbtn" title="Resetear a 1" data-act="reset" data-id="${p.id}">↺</button>
        <button class="iconbtn" title="Eliminar" data-act="remove" data-id="${p.id}">✕</button>
      </div>
    `;
        ul.appendChild(li);
    });

    // Delegación de eventos
    ul.querySelectorAll("button.iconbtn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const act = btn.dataset.act;
            if (act === "up") moveUp(id);
            if (act === "down") moveDown(id);
            if (act === "reset") resetOne(id);
            if (act === "remove") removeOne(id);
        });
    });
}

/* === Acciones === */
function moveUp(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    if (p.step >= MAX_STEP) return;

    history.push({ id, from: p.step, to: p.step + 1 });
    p.step += 1;
    renderAll();
}

function moveDown(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    if (p.step <= 1) return;

    history.push({ id, from: p.step, to: p.step - 1 });
    p.step -= 1;
    renderAll();
}

function resetOne(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    if (p.step === 1) return;

    history.push({ id, from: p.step, to: 1 });
    p.step = 1;
    renderAll();
}

function removeOne(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    history.push({ id, removed: true, snapshot: structuredClone(players) });
    players = players.filter((x) => x.id !== id);
    renderAll();
}

function resetAll() {
    history.push({ allReset: true, snapshot: structuredClone(players) });
    players = players.map((p) => ({ ...p, step: 1 }));
    renderAll();
}

function undo() {
    const last = history.pop();
    if (!last) return;

    if (last.snapshot) {
        players = last.snapshot; // para remove/resetAll
    } else {
        const p = players.find((x) => x.id === last.id);
        if (p) p.step = last.from;
    }
    renderAll();
}

/* === Utils === */
function showError(msg){ el("error").textContent = msg; }
function clearError(){ el("error").textContent = ""; }
function escapeHtml(s){
    return s.replace(/[&<>"']/g, (m) => (
        { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[m]
    ));
}
