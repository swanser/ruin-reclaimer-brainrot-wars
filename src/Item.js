// === EXPANDED ITEM DATABASE ===
export const ItemDatabase = {
  // === FOOD & DRINK ===
  'canned_beans': { name: 'Canned Beans', type: 'food', nutrition: 28, weight: 0.8, desc: 'Still edible. Barely.' },
  'canned_tuna': { name: 'Canned Tuna', type: 'food', nutrition: 35, weight: 0.7, desc: 'Better protein.' },
  'dirty_water': { name: 'Dirty Water', type: 'drink', hydration: 18, weight: 1.0, desc: 'Risk of radiation poisoning.' },
  'purified_water': { name: 'Purified Water', type: 'drink', hydration: 35, weight: 1.0, desc: 'Clean enough.' },

  // === MEDICAL ===
  'bandage': { name: 'Bandage', type: 'medical', heal: 15, weight: 0.2, desc: 'Stops bleeding, somewhat.' },
  'rad_pill': { name: 'Rad-X Pill', type: 'medical', radiationReduce: 25, weight: 0.1, desc: 'Reduces radiation buildup.' },
  'stim': { name: 'Combat Stim', type: 'medical', fatigueReduce: 40, weight: 0.15, desc: 'Keeps you going a bit longer.' },

  // === WEAPONS ===
  'rusted_pipe': { name: 'Rusted Pipe', type: 'melee', damage: 9, weight: 2.5, desc: 'Better than fists.' },
  'makeshift_pistol': { name: 'Makeshift Pistol', type: 'ranged', damage: 22, weight: 1.8, ammoType: '9mm', desc: 'Unreliable but loud.' },
  'spiked_bat': { name: 'Spiked Bat', type: 'melee', damage: 16, weight: 3.2, desc: 'Nasty in close quarters.' },

  // === ARMOR ===
  'scrap_vest': { name: 'Scrap Vest', type: 'armor', defense: 7, weight: 4.5, slot: 'torso', desc: 'Better than being naked.' },
  'gas_mask': { name: 'Gas Mask', type: 'armor', defense: 3, radiationResist: 20, weight: 1.6, slot: 'head', desc: 'Filters the ash... mostly.' },
  'leather_jacket': { name: 'Leather Jacket', type: 'armor', defense: 5, weight: 3, slot: 'torso', desc: 'Pre-war relic. Still tough.' },

  // === CRAFTING MATERIALS ===
  'scrap_metal': { name: 'Scrap Metal', type: 'material', weight: 1.5, desc: 'The blood of the old world.' },
  'duct_tape': { name: 'Duct Tape', type: 'material', weight: 0.3, desc: 'Holds the world together.' },
  'cloth': { name: 'Cloth', type: 'material', weight: 0.4, desc: 'Torn from old clothes.' },
  'wire': { name: 'Wire', type: 'material', weight: 0.5, desc: 'Electrical salvage.' },
  'chem': { name: 'Chem', type: 'material', weight: 0.3, desc: 'Pharmaceutical salvage.' },
  'plastic': { name: 'Plastic', type: 'material', weight: 0.6, desc: 'Still useful for something.' }
};

// === CRAFTING RECIPES (Early Game) ===
export const Recipes = {
  'bandage': {
    name: 'Bandage',
    ingredients: { 'cloth': 2, 'chem': 1 },
    result: 'bandage',
    resultCount: 2,
    time: 8, // seconds (prototype)
    desc: 'Basic wound dressing'
  },
  'makeshift_armor_plate': {
    name: 'Makeshift Armor Plate',
    ingredients: { 'scrap_metal': 5, 'duct_tape': 2 },
    result: 'scrap_vest',
    resultCount: 1,
    time: 15,
    desc: 'Rough but effective torso protection'
  },
  'spiked_bat': {
    name: 'Spiked Bat',
    ingredients: { 'rusted_pipe': 1, 'scrap_metal': 3, 'duct_tape': 2 },
    result: 'spiked_bat',
    resultCount: 1,
    time: 12,
    desc: 'Turn desperation into a weapon'
  },
  'rad_pill': {
    name: 'Rad-X Pill',
    ingredients: { 'chem': 3, 'plastic': 1 },
    result: 'rad_pill',
    resultCount: 3,
    time: 10,
    desc: 'Crude anti-radiation medication'
  }
};

// Helper to create item instance
export function createItem(key) {
  const base = ItemDatabase[key];
  if (!base) return null;
  return { ...base, id: key + '_' + Date.now() + '_' + Math.floor(Math.random()*1000) };
}

// Check if pawn has enough materials for a recipe
export function canCraft(pawn, recipeKey) {
  const recipe = Recipes[recipeKey];
  if (!recipe) return false;

  for (const [mat, amount] of Object.entries(recipe.ingredients)) {
    const count = pawn.inventory.filter(i => i.type === 'material' && i.name.toLowerCase().includes(mat.replace('_',' ')) || i.id?.includes(mat)).length;
    // Simple count for prototype
    let have = 0;
    pawn.inventory.forEach(item => {
      if (item.name.toLowerCase().replace(' ', '_').includes(mat)) have++;
    });
    if (have < amount) return false;
  }
  return true;
}

// Perform crafting (removes ingredients, adds result)
export function craftItem(pawn, recipeKey) {
  const recipe = Recipes[recipeKey];
  if (!recipe || !canCraft(pawn, recipeKey)) return false;

  // Remove ingredients (simplified for prototype)
  Object.keys(recipe.ingredients).forEach(matKey => {
    for (let i = 0; i < recipe.ingredients[matKey]; i++) {
      const idx = pawn.inventory.findIndex(item => 
        item.name.toLowerCase().replace(' ', '_').includes(matKey)
      );
      if (idx !== -1) pawn.inventory.splice(idx, 1);
    }
  });

  // Add result(s)
  for (let i = 0; i < recipe.resultCount; i++) {
    const newItem = createItem(recipe.result);
    if (newItem) pawn.inventory.push(newItem);
  }

  console.log(`%c[RUIN] ${pawn.name} crafted ${recipe.name}`, 'color:#aadd88');
  return true;
}
