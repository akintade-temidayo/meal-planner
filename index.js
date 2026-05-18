// =============================================
// MEAL DB API BASE URL
// =============================================
const MEAL_DB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';


// =============================================
// MOCK RECIPES (fallback / drawer lookup)
// =============================================
const mockRecipes = [
{
id: '1', name: 'Garlic Butter Chicken', category: 'Chicken', area: 'American',
image: 'https://www.themealdb.com/images/media/meals/sytuqu1511553755.jpg',
ingredients: ['Chicken', 'Butter', 'Garlic', 'Parsley', 'Lemon', 'Salt', 'Pepper'],
instructions: 'Season chicken with salt and pepper. Melt butter in a pan over medium heat. Add garlic and sauté until fragrant. Cook chicken for 6-7 minutes per side. Finish with fresh parsley and a squeeze of lemon. Serve hot.'
},
{
id: '2', name: 'Spaghetti Carbonara', category: 'Pasta', area: 'Italian',
image: 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
ingredients: ['Spaghetti', 'Eggs', 'Parmesan', 'Pancetta', 'Black Pepper', 'Salt'],
instructions: 'Cook pasta al dente. Fry pancetta until crispy. Mix eggs and parmesan in a bowl. Combine hot pasta with pancetta, remove from heat and fold in egg mixture quickly. Season generously with black pepper.'
},
{
id: '3', name: 'Beef Tacos', category: 'Beef', area: 'Mexican',
image: 'https://www.themealdb.com/images/media/meals/uvuyxu1503067369.jpg',
ingredients: ['Beef Mince', 'Taco Shells', 'Tomato', 'Lettuce', 'Cheese', 'Sour Cream', 'Cumin', 'Chili Powder'],
instructions: 'Brown beef in a skillet with cumin and chili powder. Season to taste. Warm taco shells in oven. Fill shells with beef, top with tomato, lettuce, cheese, and sour cream.'
},
{
id: '4', name: 'Salmon Teriyaki', category: 'Seafood', area: 'Japanese',
image: 'https://www.themealdb.com/images/media/meals/xxyupu1511297187.jpg',
ingredients: ['Salmon', 'Soy Sauce', 'Mirin', 'Sugar', 'Ginger', 'Sesame Seeds'],
instructions: 'Mix soy sauce, mirin, and sugar for teriyaki sauce. Marinate salmon for 20 minutes. Sear salmon skin-side up for 3 minutes, flip and glaze with sauce. Cook until caramelised. Garnish with sesame seeds.'
},
{
id: '5', name: 'Vegetable Fried Rice', category: 'Vegetarian', area: 'Chinese',
image: 'https://www.themealdb.com/images/media/meals/1bsv1q1560459826.jpg',
ingredients: ['Rice', 'Eggs', 'Carrots', 'Peas', 'Soy Sauce', 'Sesame Oil', 'Garlic', 'Spring Onion'],
instructions: 'Cook rice and cool completely. Heat oil in wok, scramble eggs and set aside. Stir-fry vegetables with garlic. Add cold rice, breaking up clumps. Season with soy sauce and sesame oil. Fold in eggs.'
},
{
id: '6', name: 'Shakshuka', category: 'Vegetarian', area: 'Tunisian',
image: 'https://www.themealdb.com/images/media/meals/g373701551450225.jpg',
ingredients: ['Eggs', 'Tomatoes', 'Pepper', 'Onion', 'Garlic', 'Cumin', 'Paprika', 'Chilli'],
instructions: 'Sauté onion and pepper until soft. Add garlic and spices, cook 1 minute. Add crushed tomatoes and simmer 10 minutes. Make wells in sauce and crack in eggs. Cover and cook until whites set. Serve with crusty bread.'
},
];


// =============================================
// STATE
// =============================================
let tags          = [];
let recipes       = [];   // current search results (API or mock)
let activeDrawer  = null;
let draggedRecipe = null;

let planner = [
[null, null, null, null, null, null, null], // breakfast
[null, null, null, null, null, null, null], // lunch
[null, null, null, null, null, null, null], // dinner
];

const MEALS = ['breakfast', 'lunch', 'dinner'];
const DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];


// =============================================
// LOCALSTORAGE
// =============================================
function savePlanner() {
localStorage.setItem('mealcraft-planner', JSON.stringify(planner));
}

function loadPlanner() {
const saved = localStorage.getItem('mealcraft-planner');
if (saved) planner = JSON.parse(saved);
}

function saveTags() {
localStorage.setItem('mealcraft-tags', JSON.stringify(tags));
}

function loadTags() {
const saved = localStorage.getItem('mealcraft-tags');
if (saved) { tags = JSON.parse(saved); renderTags(); }
}


// =============================================
// INGREDIENT TAG SYSTEM
// =============================================
function addTag() {
const input = document.getElementById('ingredientInput');
const value = input.value.trim().toLowerCase();
if (!value || tags.includes(value)) { input.value = ''; return; }
tags.push(value);
renderTags();
saveTags();
input.value = '';
input.focus();
}

function removeTag(tag) {
tags = tags.filter(t => t !== tag);
renderTags();
saveTags();
}

function addSuggestion(ingredient) {
if (!tags.includes(ingredient)) {
tags.push(ingredient);
renderTags();
saveTags();
}
}

function renderTags() {
const container = document.getElementById('tagContainer');
container.innerHTML = tags.map(tag => `
<span class="tag">
    ${tag}
    <button onclick="removeTag('${tag}')">✕</button>
</span>
`).join('');
}

document.getElementById('ingredientInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') { e.preventDefault(); addTag(); }
});


// =============================================
// FETCH FULL RECIPE DETAILS FROM API
// The /filter endpoint only returns basic info
// (id, name, image). This fetches full details
// including ingredients and instructions.
// =============================================
async function fetchFullRecipe(mealId) {
const res  = await fetch(`${MEAL_DB_BASE_URL}/lookup.php?i=${mealId}`);
const data = await res.json();
if (!data.meals || data.meals.length === 0) return null;

const meal = data.meals[0];

// The MealDB stores ingredients as strIngredient1 … strIngredient20
// Loop through all 20 slots and collect non-empty ones
const ingredients = [];
for (let i = 1; i <= 20; i++) {
const ing    = meal[`strIngredient${i}`];
const measure = meal[`strMeasure${i}`];
if (ing && ing.trim()) {
    // Combine measure + ingredient e.g. "2 cups Flour"
    ingredients.push(measure ? `${measure.trim()} ${ing.trim()}` : ing.trim());
}
}

return {
id:           meal.idMeal,
name:         meal.strMeal,
category:     meal.strCategory,
area:         meal.strArea,
image:        meal.strMealThumb,
instructions: meal.strInstructions,
ingredients,
};
}


// =============================================
// SEARCH RECIPES — REAL API (your tutor's logic, corrected)
//
// HOW IT WORKS:
// 1. For each ingredient tag, call /filter.php?i=<ingredient>
//    → returns a list of meals that contain that ingredient
// 2. Store results in a Map keyed by meal ID
// 3. Each time a meal appears again (for another ingredient),
//    increment its matchCount
// 4. Sort by matchCount so meals matching MORE of your
//    ingredients appear first
// 5. Fetch full details for the top results
// =============================================
async function searchFoodIngredientRecipes() {

// Guard: need at least one tag
if (tags.length === 0) {
alert('Please add at least one ingredient first!');
return;
}

// Show loading spinner, hide everything else
document.getElementById('searchEmpty').classList.add('hidden');
document.getElementById('noResults').classList.add('hidden');
document.getElementById('recipeGrid').innerHTML = '';
document.getElementById('resultCount').classList.add('hidden');
document.getElementById('searchLoading').classList.remove('hidden');

try {
// ---- STEP A: collect meals per ingredient ----
const resultMap = new Map();
// resultMap stores: { idMeal, strMeal, strMealThumb, matchCount }

for (const ingredient of tags) {
    const res = await fetch(
    `${MEAL_DB_BASE_URL}/filter.php?i=${encodeURIComponent(ingredient)}`
    );
    const data = await res.json();

    if (data.meals) {
    data.meals.forEach((meal) => {
        if (!resultMap.has(meal.idMeal)) {
        // First time we see this meal — add it with matchCount 1
        resultMap.set(meal.idMeal, { ...meal, matchCount: 1 });
        } else {
        // Already in map — this meal matches another ingredient too
        resultMap.get(meal.idMeal).matchCount++;
        }
    });
    }
}

// ---- STEP B: sort by how many ingredients match ----
const sortedMeals = [...resultMap.values()]
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 12); // limit to 12 results so we don't make 100 API calls

// ---- STEP C: fetch full details for each matched meal ----
const fullRecipes = [];
for (const meal of sortedMeals) {
    const full = await fetchFullRecipe(meal.idMeal);
    if (full) fullRecipes.push(full);
}

// ---- STEP D: update UI ----
document.getElementById('searchLoading').classList.add('hidden');
recipes = fullRecipes; // save to global state so drawer can access them

if (recipes.length === 0) {
    document.getElementById('noResults').classList.remove('hidden');
} else {
    document.getElementById('resultCount').classList.remove('hidden');
    document.getElementById('countNum').textContent = recipes.length;
    renderRecipeGrid(recipes);
}

} catch (err) {
// Something went wrong (network error, bad response, etc.)
console.error('API error:', err);
document.getElementById('searchLoading').classList.add('hidden');
document.getElementById('noResults').classList.remove('hidden');
document.getElementById('noResults').querySelector('p').textContent =
    'Something went wrong. Please check your connection and try again.';
}
}

// Keep the old name working too — your HTML calls searchRecipes()
function searchRecipes() {
searchFoodIngredientRecipes();
}


// =============================================
// RENDER RECIPE CARDS
// =============================================
function renderRecipeGrid(recipes) {
const grid = document.getElementById('recipeGrid');

grid.innerHTML = recipes.map(recipe => `
<div
    class="recipe-card"
    draggable="true"
    data-id="${recipe.id}"
    ondragstart="onDragStart(event, '${recipe.id}')"
    ondragend="onDragEnd(event)"
    onclick="openDrawer('${recipe.id}')"
>
    <div class="relative" style="height: 160px; overflow: hidden;">
    <img
        src="${recipe.image}"
        alt="${recipe.name}"
        class="w-full h-full"
        style="object-fit: cover; transition: transform 0.4s ease;"
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
    />
    <span
        class="absolute top-3 right-3 px-2 py-1 rounded-full text-white text-xs font-bold"
        style="background: rgba(45,27,14,0.7); backdrop-filter: blur(4px);"
    >
        ${recipe.area}
    </span>
    </div>

    <div class="p-4">
    <p class="font-bold mb-1" style="font-size: 15px; color: var(--brown); line-height: 1.3;">
        ${recipe.name}
    </p>
    <p class="mb-3" style="font-size: 12px; color: var(--warm);">
        ${recipe.category} · ${recipe.ingredients.length} ingredients
    </p>

    <div class="flex flex-wrap gap-1 mb-3">
        ${recipe.ingredients.slice(0, 4).map(ing => `
        <span style="background: var(--light); border-radius: 999px; padding: 2px 8px; font-size: 11px; color: var(--warm);">
            ${ing}
        </span>
        `).join('')}
        ${recipe.ingredients.length > 4 ? `
        <span style="border-radius: 999px; padding: 2px 8px; font-size: 11px; color: var(--border);">
            +${recipe.ingredients.length - 4} more
        </span>
        ` : ''}
    </div>

    <div class="flex gap-2">
        <button
        onclick="event.stopPropagation(); openDrawer('${recipe.id}')"
        style="flex: 1; background: var(--light); border: none; border-radius: 8px; padding: 7px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--brown); font-family: 'DM Sans', sans-serif;"
        >
        View Recipe
        </button>
        <div
        style="background: var(--accent); border-radius: 8px; padding: 7px 10px; color: white; font-size: 11px; cursor: grab;"
        title="Drag to planner"
        >
        <i class="fa-solid fa-grip-vertical"></i>
        </div>
    </div>
    </div>
</div>
`).join('');
}


// =============================================
// DRAG AND DROP
// =============================================
function onDragStart(event, recipeId) {
draggedRecipe = recipes.find(r => r.id === recipeId);
event.dataTransfer.effectAllowed = 'move';
event.dataTransfer.setData('text/plain', recipeId);
event.target.classList.add('dragging');
}

function onDragEnd(event) {
event.target.classList.remove('dragging');
document.querySelectorAll('.planner-slot').forEach(slot => slot.classList.remove('drag-over'));
}

function onDragOver(event, mealIdx, dayIdx) {
event.preventDefault();
event.dataTransfer.dropEffect = 'move';
event.currentTarget.classList.add('drag-over');
}

function onDragLeave(event) {
if (!event.currentTarget.contains(event.relatedTarget)) {
event.currentTarget.classList.remove('drag-over');
}
}

function onDrop(event, mealIdx, dayIdx) {
event.preventDefault();
event.stopPropagation();
event.currentTarget.classList.remove('drag-over');

if (draggedRecipe) {
planner[mealIdx][dayIdx] = draggedRecipe;
draggedRecipe = null;
renderPlanner();
updateBadges();
generateShoppingList();
savePlanner();
}
}


// =============================================
// RENDER PLANNER GRID
// =============================================
function rebuildPlannerGrid() {
const grid = document.getElementById('plannerGrid');
grid.innerHTML = '';

const corner = document.createElement('div');
corner.className = 'planner-header';
corner.style.cssText = 'background: transparent; color: transparent;';
corner.textContent = '—';
grid.appendChild(corner);

DAYS.forEach(day => {
const h = document.createElement('div');
h.className = 'planner-header';
h.textContent = day.toUpperCase();
grid.appendChild(h);
});

const emojis = ['🌅', '☀️', '🌙'];

MEALS.forEach((meal, mealIdx) => {
const label = document.createElement('div');
label.className = 'planner-label';
label.innerHTML = `${emojis[mealIdx]}<br>${meal.charAt(0).toUpperCase() + meal.slice(1)}`;
grid.appendChild(label);

for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const slot = document.createElement('div');
    slot.className = 'planner-slot';
    slot.dataset.meal = mealIdx;
    slot.dataset.day  = dayIdx;

    slot.addEventListener('dragover',  (e) => onDragOver(e, mealIdx, dayIdx));
    slot.addEventListener('dragleave', (e) => onDragLeave(e));
    slot.addEventListener('drop',      (e) => onDrop(e, mealIdx, dayIdx));

    const recipe = planner[mealIdx][dayIdx];

    if (recipe) {
    slot.classList.add('has-meal');
    slot.innerHTML = `
        <div class="meal-chip">
        <img src="${recipe.image}" alt="${recipe.name}" />
        <div style="flex: 1; min-width: 0; overflow: hidden;">
            <p style="font-size: 10px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${recipe.name}
            </p>
            <p style="font-size: 9px; color: var(--warm);">${recipe.category}</p>
        </div>
        <button class="remove-meal" onclick="removeMeal(${mealIdx}, ${dayIdx})" title="Remove meal">
            <i class="fa-solid fa-xmark"></i>
        </button>
        </div>
    `;
    } else {
    slot.innerHTML = `
        <p class="slot-empty-hint">
        <i class="fa-solid fa-plus" style="font-size: 10px; display: block; margin-bottom: 2px;"></i>
        drop here
        </p>
    `;
    }

    grid.appendChild(slot);
}
});
}

function renderPlanner() {
rebuildPlannerGrid();
const hasMeals = planner.flat().some(m => m !== null);
const emptyEl  = document.getElementById('plannerEmpty');
if (emptyEl) emptyEl.style.display = hasMeals ? 'none' : 'block';
}

function removeMeal(mealIdx, dayIdx) {
planner[mealIdx][dayIdx] = null;
renderPlanner();
updateBadges();
generateShoppingList();
savePlanner();
}

function clearPlanner() {
if (!confirm('Clear all planned meals?')) return;
planner = [
[null, null, null, null, null, null, null],
[null, null, null, null, null, null, null],
[null, null, null, null, null, null, null],
];
renderPlanner();
updateBadges();
generateShoppingList();
savePlanner();
}


// =============================================
// RECIPE DETAIL DRAWER
// =============================================
function openDrawer(recipeId) {
// Check both API results and mock recipes
const recipe = recipes.find(r => r.id === recipeId)
            || mockRecipes.find(r => r.id === recipeId);
if (!recipe) return;

activeDrawer = recipe;

document.getElementById('drawerImage').src            = recipe.image;
document.getElementById('drawerImage').alt            = recipe.name;
document.getElementById('drawerTitle').textContent    = recipe.name;
document.getElementById('drawerArea').textContent     = `${recipe.area} cuisine · ${recipe.category}`;
document.getElementById('drawerCategory').textContent = recipe.category;

const rawDesc   = recipe.instructions.replace(/<[^>]*>/g, '');
const shortDesc = rawDesc.length > 400 ? rawDesc.slice(0, 400) + '...' : rawDesc;
document.getElementById('drawerInstructions').textContent = shortDesc;

document.getElementById('drawerIngredients').innerHTML = recipe.ingredients.map(ing => `
<span style="background: var(--light); border-radius: 999px; padding: 4px 12px; font-size: 12px; color: var(--warm); font-weight: 500;">
    ${ing}
</span>
`).join('');

const overlay = document.getElementById('drawerOverlay');
overlay.classList.add('open');
requestAnimationFrame(() => overlay.classList.add('visible'));
document.body.style.overflow = 'hidden';
}

function closeDrawer(event) {
if (event && event.target !== document.getElementById('drawerOverlay')) return;
_closeDrawer();
}

function _closeDrawer() {
const overlay = document.getElementById('drawerOverlay');
overlay.classList.remove('visible');
setTimeout(() => overlay.classList.remove('open'), 350);
document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
if (e.key === 'Escape') {
const overlay = document.getElementById('drawerOverlay');
if (overlay.classList.contains('open')) _closeDrawer();
}
});

function addFromDrawer() {
if (!activeDrawer) return;
const day  = parseInt(document.getElementById('drawerDay').value);
const meal = parseInt(document.getElementById('drawerMeal').value);
planner[meal][day] = activeDrawer;
renderPlanner();
updateBadges();
generateShoppingList();
savePlanner();
_closeDrawer();
switchTab('planner');
}


// =============================================
// SHOPPING LIST
// =============================================
function generateShoppingList() {
const allMeals       = planner.flat().filter(m => m !== null);
const allIngredients = [...new Set(allMeals.flatMap(m => m.ingredients))];

const listEl  = document.getElementById('shoppingList');
const emptyEl = document.getElementById('shoppingEmpty');
const badge   = document.getElementById('shoppingBadge');

if (allIngredients.length === 0) {
listEl.innerHTML = '';
if (emptyEl) emptyEl.style.display = 'block';
if (badge)   badge.classList.add('hidden');
return;
}

if (emptyEl) emptyEl.style.display = 'none';
if (badge) {
badge.classList.remove('hidden');
badge.textContent = allIngredients.length;
}

listEl.innerHTML = allIngredients.map((ing, i) => `
<div class="shopping-item" id="item-${i}">
    <input type="checkbox" id="check-${i}" onchange="toggleCheck(${i})" />
    <label for="check-${i}">${ing}</label>
</div>
`).join('');
}

function toggleCheck(idx) {
const item = document.getElementById(`item-${idx}`);
const chk  = document.getElementById(`check-${idx}`);
if (item && chk) item.classList.toggle('checked', chk.checked);
}

function clearChecked() {
document.querySelectorAll('.shopping-item').forEach(item => {
const chk = item.querySelector('input[type="checkbox"]');
if (chk && chk.checked) item.remove();
});
}


// =============================================
// TABS & BADGES
// =============================================
function switchTab(tab) {
document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
const tabMap = { search: 0, planner: 1, shopping: 2 };
document.querySelectorAll('.tab-btn')[tabMap[tab]].classList.add('active');

document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
document.getElementById(`${tab}Section`).classList.add('active');

if (tab === 'planner') renderPlanner();
}

function updateBadges() {
const mealCount = planner.flat().filter(m => m !== null).length;
const badge = document.getElementById('plannerBadge');
if (badge) {
if (mealCount > 0) {
    badge.classList.remove('hidden');
    badge.textContent = mealCount;
} else {
    badge.classList.add('hidden');
}
}
}


// =============================================
// INIT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
loadPlanner();
loadTags();
rebuildPlannerGrid();
generateShoppingList();
updateBadges();
});