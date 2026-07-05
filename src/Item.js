// === BASIC ITEM DEFINITIONS ===
// This will grow into a full item database + crafting recipes
export const ItemDatabase = {
  // Food & Water
  'canned_beans': { name: 'Canned Beans', type: 'food', nutrition: 25, weight: 0.8, desc: 'Still edible. Barely.' },
  'dirty_water': { name: 'Dirty Water', type: 'drink', hydration: 15, weight: 1.0, desc: 'Risk of radiation.' },
  
  // Weapons
  'rusted_pipe': { name: 'Rusted Pipe', type: 'melee', damage: 8, weight: 2.5, desc: 'Better than nothing.' },
  'makeshift_pistol': { name: 'Makeshift Pistol', type: 'ranged', damage: 18, weight: 1.8, ammoType: '9mm', desc: 'Unreliable but loud.' },
  
  // Armor & Clothing
  'scrap_vest': { name: 'Scrap Vest', type: 'armor', defense: 6, weight: 4, slot: 'torso', desc: 'Better than being naked.' },
  'gas_mask': { name: 'Gas Mask', type: 'armor', defense: 2, radiationResist: 15, weight: 1.5, slot: 'head', desc: 'Filters the ash... mostly.' },
  
  // Crafting Materials
  'scrap_metal': { name: 'Scrap Metal', type: 'material', weight: 1.5, desc: 'The blood of the old world.' },
  'plastic': { name: 'Plastic', type: 'material', weight: 0.5, desc: 'Still useful for something.' },
  'chem': { name: 'Chem', type: 'material', weight: 0.3, desc: 'Pharmaceutical salvage.' }
};

// Helper to create an item instance
export function createItem(key) {
  const base = ItemDatabase[key];
  if (!base) return null;
  return { ...base, id: key + '_' + Date.now() };
}
