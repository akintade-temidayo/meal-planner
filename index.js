// =============================================
// CONSTANTS
// =============================================
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner'];

// Assumed to always be available, never added to the kitchen
const STAPLES = ['oil', 'salt', 'pepper', 'onion', 'onions', 'seasoning', 'maggi', 'knorr',
'curry', 'thyme', 'water', 'tomato', 'tomatoes', 'tomato paste', 'tatashe', 'rodo'];

// Everything is stored under one canonical name so matching works
const ALIASES = {
spag: 'spaghetti', pasta: 'spaghetti', macaroni: 'spaghetti',
gari: 'garri', eggs: 'egg',
bean: 'beans', 'honey beans': 'beans', 'brown beans': 'beans', 'black eyed beans': 'beans',
noodle: 'noodles', indomie: 'noodles',
yams: 'yam', plantains: 'plantain', potatoes: 'potato', 'irish potato': 'potato',
sardine: 'sardines', fishes: 'fish', 'catfish': 'fish', 'titus': 'fish', 'mackerel': 'fish',
'cow meat': 'beef', meat: 'beef', 'goat': 'goat meat',
vegetable: 'vegetables', veg: 'vegetables', 'vegetable leaf': 'vegetables',
'sweet potatoes': 'sweet potato', oat: 'oats', 'corn flakes': 'cornflakes',
ogi: 'pap', 'akamu': 'pap', 'groundnuts': 'groundnut', 'peanut': 'groundnut', 'peanuts': 'groundnut',
carrots: 'carrot', 'bread ': 'bread',
};

const COMMON_ITEMS = ['rice', 'beans', 'spaghetti', 'noodles', 'garri', 'yam', 'plantain',
'egg', 'bread', 'beef', 'chicken', 'fish', 'potato', 'sardines', 'milk', 'butter'];

// =============================================
// STATE + STORAGE
// =============================================
const $ = (id) => document.getElementById(id);
const emptyPlanner = () => Array.from({ length: 3 }, () => Array(7).fill(null));

function load(key, fallback) {
try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
catch { return fallback; }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

let pantry   = load('mealcraft-pantry', []);
let planner  = load('mealcraft-plan-v2', emptyPlanner());   // v2: old key held image-based recipes
let shopping = load('mealcraft-shopping', []);
let shown = [];          // suggestion cards currently on screen
let draggedMeal = null;  // name of the meal being dragged

function toast(msg) {
const t = $('toast');
t.textContent = msg;
t.classList.add('show');
clearTimeout(toast.timer);
toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// =============================================
// TABS
// =============================================
function switchTab(tab) {
document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
$(`${tab}Section`).classList.add('active');
if (tab === 'planner') renderPlanner();
}

function setBadge(id, count) {
const el = $(id);
el.textContent = count;
el.classList.toggle('hidden', count === 0);
}

// =============================================
// KITCHEN
// =============================================
function normalize(raw) {
const t = raw.trim().toLowerCase().replace(/\s+/g, ' ');
return ALIASES[t] || t;
}

function addIngredients() {
const input = $('ingredientInput');
let skipped = [];
input.value.split(',').map(normalize).filter(Boolean).forEach(item => {
    if (STAPLES.includes(item)) { skipped.push(item); return; }
    if (!pantry.includes(item)) pantry.push(item);
});
if (skipped.length) toast(`${skipped.join(', ')} is already assumed, no need to add it`);
input.value = '';
input.focus();
save('mealcraft-pantry', pantry);
renderPantry();
}

function addSuggestion(item) {
if (!pantry.includes(item)) {
    pantry.push(item);
    save('mealcraft-pantry', pantry);
    renderPantry();
}
}

function removeIngredient(item) {
pantry = pantry.filter(i => i !== item);
save('mealcraft-pantry', pantry);
renderPantry();
}

function clearPantry() {
if (pantry.length && !confirm('Remove everything from your kitchen?')) return;
pantry = [];
save('mealcraft-pantry', pantry);
renderPantry();
}

function renderPantry() {
const box = $('tagContainer');
box.innerHTML = '';
pantry.forEach(item => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = item;
    const btn = document.createElement('button');
    btn.textContent = '✕';
    btn.title = `Remove ${item}`;
    btn.onclick = () => removeIngredient(item);
    tag.appendChild(btn);
    box.appendChild(tag);
});
$('pantryCount').textContent = pantry.length;
$('kitchenEmpty').style.display = pantry.length ? 'none' : 'block';
$('kitchenNext').classList.toggle('hidden', pantry.length === 0);
setBadge('kitchenBadge', pantry.length);
}

function renderChips() {
const wrap = $('suggestionChips');
COMMON_ITEMS.forEach(item => {
    const b = document.createElement('button');
    b.className = 'suggestion-chip';
    b.textContent = item;
    b.onclick = () => addSuggestion(item);
    wrap.appendChild(b);
});
}

$('ingredientInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') { e.preventDefault(); addIngredients(); }
});

// =============================================
// SUGGESTION ENGINE
// =============================================
// Checks one meal against the kitchen.
// Each "need" can be "a|b|c": any one of them satisfies it.
function analyze(meal) {
const have = [], missing = [];
meal.needs.forEach(need => {
    const options = need.split('|');
    const hit = options.find(o => pantry.includes(o));
    if (hit) have.push(hit);
    else missing.push(options);
});
return { have, missing };
}

function goSuggest() {
switchTab('planner');
suggest();
}

function suggest() {
if (!pantry.length) {
    toast('Add some items to your kitchen first');
    switchTab('kitchen');
    return;
}
const ready = [], almost = [], addons = [];
MEALS.forEach(m => {
    const r = { ...m, ...analyze(m) };
    if (m.addon) { if (r.missing.length <= 1) addons.push(r); }
    else if (!r.missing.length) ready.push(r);
    else if (r.missing.length <= 2 && r.have.length) almost.push(r);
});
ready.sort((a, b) => b.have.length - a.have.length);
almost.sort((a, b) => a.missing.length - b.missing.length);
addons.sort((a, b) => a.missing.length - b.missing.length);

shown = [];
const card = (r) => {
    const i = shown.push(r) - 1;
    const times = r.meal.join(' / ');
    return `
    <div class="meal-card" draggable="true" data-i="${i}">
        <p class="font-bold" style="font-size:15px; line-height:1.3;">${r.name}</p>
        <p style="font-size:11px; color:var(--warm);">${times}</p>
        <div class="flex flex-wrap gap-1 my-2">
        ${r.have.map(x => `<span class="pill have">${x}</span>`).join('')}
        ${r.missing.map(o => `<span class="pill miss">need ${o.slice(0, 2).join(' / ')}</span>`).join('')}
        </div>
        <div class="flex gap-2">
        <button class="mini" data-act="plan">Add to plan</button>
        ${r.missing.length ? '<button class="mini" data-act="shop">Add missing to list</button>' : ''}
        </div>
    </div>`;
};
const tier = (title, note, list) => !list.length ? '' : `
    <p class="tier-title">${title} <span class="tier-note">${note}</span></p>
    <div class="grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));">
    ${list.map(card).join('')}
    </div>`;

const html =
    tier('You can make these now', `(${ready.length})`, ready) +
    tier('Almost there', 'missing one or two items', almost) +
    tier('Easy add-ons', 'quick extras', addons);

$('suggestContent').innerHTML = html || '<p class="mt-3" style="font-size:13px;">No matches yet. Try adding more items to your kitchen.</p>';
$('suggestPanel').classList.remove('hidden');
$('suggestPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Click and drag handled once for all cards
$('suggestContent').addEventListener('click', (e) => {
const btn = e.target.closest('[data-act]');
const cardEl = e.target.closest('.meal-card');
if (!btn || !cardEl) return;
const r = shown[cardEl.dataset.i];
if (btn.dataset.act === 'plan') {
    const time = MEAL_TIMES.indexOf(r.meal[0]);
    const freeDay = planner[time].findIndex(s => s === null);
    openModal(freeDay === -1 ? 0 : freeDay, time, r.name);
} else {
    const added = r.missing.filter(o => addShopping(o[0])).length;
    toast(added ? `Added ${added} item${added > 1 ? 's' : ''} to your list` : 'Already on your list');
}
});

$('suggestContent').addEventListener('dragstart', (e) => {
const cardEl = e.target.closest('.meal-card');
if (!cardEl) return;
draggedMeal = shown[cardEl.dataset.i].name;
e.dataTransfer.setData('text/plain', draggedMeal);
e.dataTransfer.effectAllowed = 'copy';
});

// Fill every empty slot with meals you can make right now
function autoFill() {
if (!pantry.length) { toast('Add some items to your kitchen first'); switchTab('kitchen'); return; }
let filled = 0;
MEAL_TIMES.forEach((time, ti) => {
    const pool = MEALS.filter(m => m.meal.includes(time) && analyze(m).missing.length === 0);
    if (!pool.length) return;
    let bag = [];
    for (let d = 0; d < 7; d++) {
    if (planner[ti][d]) continue;
    if (!bag.length) bag = [...pool].sort(() => Math.random() - 0.5);   // shuffle, no repeats until used up
    planner[ti][d] = { name: bag.pop().name };
    filled++;
    }
});
savePlanner();
renderPlanner();
toast(filled ? `Filled ${filled} slot${filled > 1 ? 's' : ''}` : 'Nothing to fill. Add more to your kitchen or clear some slots');
}

// =============================================
// PLANNER
// =============================================
function savePlanner() { save('mealcraft-plan-v2', planner); }

function renderPlanner() {
const grid = $('plannerGrid');
grid.innerHTML = '';
const add = (cls, html = '') => {
    const d = document.createElement('div');
    d.className = cls;
    d.innerHTML = html;
    grid.appendChild(d);
    return d;
};

add('planner-header', '—').style.cssText = 'background: transparent; color: transparent;';
DAYS.forEach(d => add('planner-header', d.toUpperCase()));
const emojis = ['🌅', '☀️', '🌙'];

MEAL_TIMES.forEach((time, ti) => {
    add('planner-label', `${emojis[ti]}<br>${time}`);
    for (let di = 0; di < 7; di++) {
    const slot = add('planner-slot');
    const meal = planner[ti][di];

    if (meal) {
        slot.classList.add('has-meal');
        const chip = document.createElement('div');
        chip.className = 'meal-chip';
        const name = document.createElement('span');
        name.textContent = meal.name;
        name.style.flex = '1';
        const x = document.createElement('button');
        x.className = 'remove-meal';
        x.title = 'Remove';
        x.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        x.onclick = (e) => { e.stopPropagation(); planner[ti][di] = null; savePlanner(); renderPlanner(); };
        chip.append(name, x);
        slot.appendChild(chip);
    } else {
        slot.innerHTML = '<p class="slot-empty-hint"><i class="fa-solid fa-plus" style="font-size:10px; display:block; margin-bottom:2px;"></i>add</p>';
    }

    slot.onclick = () => openModal(di, ti, meal ? meal.name : '');
    slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('drag-over'); };
    slot.ondragleave = () => slot.classList.remove('drag-over');
    slot.ondrop = (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        if (!draggedMeal) return;
        planner[ti][di] = { name: draggedMeal };
        draggedMeal = null;
        savePlanner();
        renderPlanner();
    };
    }
});

const count = planner.flat().filter(Boolean).length;
$('plannerEmpty').style.display = count ? 'none' : 'block';
setBadge('plannerBadge', count);
}

function clearPlanner() {
if (!confirm('Clear all planned meals?')) return;
planner = emptyPlanner();
savePlanner();
renderPlanner();
}

// ---- Add meal modal (manual entry) ----
function openModal(day, time, name = '') {
$('mName').value = name;
$('mDay').value = day;
$('mTime').value = time;
$('modalOverlay').classList.add('open');
$('mName').focus();
}
function closeModal() { $('modalOverlay').classList.remove('open'); }

function saveModal() {
const name = $('mName').value.trim();
if (!name) { toast('Type or pick a meal first'); return; }
planner[+$('mTime').value][+$('mDay').value] = { name };
savePlanner();
renderPlanner();
closeModal();
}

$('mName').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

function initModal() {
$('mDay').innerHTML = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map((d, i) => `<option value="${i}">${d}</option>`).join('');
$('mTime').innerHTML = MEAL_TIMES
    .map((t, i) => `<option value="${i}">${t[0].toUpperCase() + t.slice(1)}</option>`).join('');
$('mealList').innerHTML = MEALS.map(m => `<option value="${m.name}">`).join('');
}

// =============================================
// SHOPPING LIST
// =============================================
function saveShopping() { save('mealcraft-shopping', shopping); }

// returns true if a new item was added
function addShopping(text) {
text = text.trim().toLowerCase();
if (!text || shopping.some(s => s.text === text)) return false;
shopping.push({ text, checked: false });
saveShopping();
renderShopping();
return true;
}

function addShoppingFromInput() {
const input = $('shoppingInput');
input.value.split(',').forEach(addShopping);
input.value = '';
input.focus();
}

$('shoppingInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') { e.preventDefault(); addShoppingFromInput(); }
});

function renderShopping() {
const list = $('shoppingList');
list.innerHTML = '';
shopping.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'shopping-item' + (item.checked ? ' checked' : '');

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = `shop-${i}`;
    chk.checked = item.checked;
    chk.onchange = () => { item.checked = chk.checked; saveShopping(); renderShopping(); };

    const label = document.createElement('label');
    label.htmlFor = chk.id;
    label.textContent = item.text;

    const del = document.createElement('button');
    del.className = 'del';
    del.title = 'Delete';
    del.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    del.onclick = () => { shopping.splice(i, 1); saveShopping(); renderShopping(); };

    row.append(chk, label, del);
    list.appendChild(row);
});
$('shoppingEmpty').style.display = shopping.length ? 'none' : 'block';
setBadge('shoppingBadge', shopping.filter(s => !s.checked).length);
}

function clearChecked() {
shopping = shopping.filter(s => !s.checked);
saveShopping();
renderShopping();
}

// =============================================
// INIT
// =============================================
initModal();
renderChips();
renderPantry();
renderPlanner();
renderShopping();