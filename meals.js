// =============================================
// LOCAL MEAL DATABASE
// name  : what shows in the app
// needs : main ingredients only (oil, salt, pepper, onions, tomato, seasoning are assumed)
//         "a|b|c" means ANY ONE of these will do
// meal  : when it's eaten: b = breakfast, l = lunch, d = dinner
// addon : true = simple extra, shown under "Easy add-ons"
// To add a meal, just add one line.
// =============================================
const M = (name, needs, meal, addon = false) => ({
name,
needs,
meal: [...meal].map(c => ({ b: 'breakfast', l: 'lunch', d: 'dinner' }[c])),
addon,
});

const PROTEIN = 'beef|chicken|fish|egg|turkey|goat meat';

const MEALS = [
// ---- Rice ----
M('Jollof Rice', ['rice'], 'ld'),
M('Fried Rice', ['rice'], 'ld'),
M('Rice and Stew', ['rice', PROTEIN], 'ld'),
M('Rice and Beans', ['rice', 'beans'], 'ld'),
M('Rice and Spaghetti', ['rice', 'spaghetti'], 'ld'),
M('Rice and Plantain', ['rice', 'plantain'], 'ld'),
M('Rice and Egg Sauce', ['rice', 'egg'], 'ld'),
M('Rice and Moi Moi', ['rice', 'beans'], 'ld'),
M('Coconut Rice', ['rice', 'coconut'], 'ld'),

// ---- Beans ----
M('Akara', ['beans'], 'b'),
M('Moi Moi', ['beans'], 'bl'),
M('Akara and Pap', ['beans', 'pap|ogi|custard'], 'b'),
M('Moi Moi and Pap', ['beans', 'pap|ogi|custard'], 'b'),
M('Beans Porridge', ['beans'], 'ld'),
M('Beans and Plantain', ['beans', 'plantain'], 'ld'),
M('Beans and Garri', ['beans', 'garri'], 'ld'),
M('Beans and Yam Porridge', ['beans', 'yam'], 'ld'),
M('Ewa Agoyin and Bread', ['beans', 'bread'], 'bl'),

// ---- Spaghetti ----
M('Jollof Spaghetti', ['spaghetti'], 'ld'),
M('Spaghetti and Stew', ['spaghetti', PROTEIN], 'ld'),
M('Spaghetti and Egg', ['spaghetti', 'egg'], 'bl'),
M('Spaghetti with Sardines', ['spaghetti', 'sardines'], 'ld'),
M('Spaghetti and Plantain', ['spaghetti', 'plantain'], 'ld'),

// ---- Noodles ----
M('Fried Noodles', ['noodles'], 'ld'),
M('Indomie and Egg', ['noodles', 'egg'], 'bld'),
M('Noodles and Vegetables', ['noodles', 'vegetables|cabbage|carrot|spinach|ugwu'], 'ld'),
M('Noodles with Sardines', ['noodles', 'sardines'], 'ld'),
M('Noodles and Plantain', ['noodles', 'plantain'], 'ld'),

// ---- Garri / Eba ----
M('Eba and Egusi Soup', ['garri', 'egusi'], 'ld'),
M('Eba and Okra Soup', ['garri', 'okra'], 'ld'),
M('Eba and Ogbono Soup', ['garri', 'ogbono'], 'ld'),
M('Eba and Vegetable Soup', ['garri', 'vegetables|ugwu|spinach|efo'], 'ld'),
M('Eba and Stew', ['garri', PROTEIN], 'ld'),
M('Soaked Garri with Groundnut', ['garri', 'groundnut|sugar|milk'], 'bl'),

// ---- Yam ----
M('Boiled Yam and Egg Sauce', ['yam', 'egg'], 'bl'),
M('Fried Yam and Egg', ['yam', 'egg'], 'bl'),
M('Yam and Stew', ['yam', PROTEIN], 'ld'),
M('Yam Porridge (Asaro)', ['yam'], 'ld'),
M('Roasted Yam and Fish', ['yam', 'fish'], 'ld'),
M('Pounded Yam and Egusi Soup', ['yam', 'egusi'], 'ld'),
M('Pounded Yam and Okra Soup', ['yam', 'okra'], 'ld'),

// ---- Plantain ----
M('Fried Plantain and Egg', ['plantain', 'egg'], 'bl'),
M('Plantain Porridge', ['plantain'], 'ld'),
M('Boiled Plantain and Stew', ['plantain', PROTEIN], 'ld'),
M('Roasted Plantain (Boli) and Fish', ['plantain', 'fish'], 'ld'),

// ---- Potato ----
M('Boiled Potatoes and Egg Sauce', ['potato', 'egg'], 'bl'),
M('Fried Potatoes and Egg', ['potato', 'egg'], 'bl'),
M('Potato Porridge', ['potato'], 'ld'),
M('Sweet Potato and Egg', ['sweet potato', 'egg'], 'bl'),

// ---- Bread & breakfast ----
M('Bread and Egg', ['bread', 'egg'], 'b'),
M('Omelette and Bread', ['egg', 'bread'], 'bl'),
M('Bread and Sardines', ['bread', 'sardines'], 'bl'),

// ---- Easy add-ons ----
M('Bread and Butter', ['bread', 'butter'], 'b', true),
M('Bread and Tea', ['bread', 'tea'], 'b', true),
M('Boiled Egg', ['egg'], 'b', true),
M('Scrambled Eggs', ['egg'], 'b', true),
M('Oatmeal', ['oats'], 'b', true),
M('Cornflakes and Milk', ['cornflakes', 'milk'], 'b', true),
M('Pap and Milk', ['pap|ogi', 'milk'], 'b', true),
];