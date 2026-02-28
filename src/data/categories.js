export const CATEGORIES = [
  { id: 'cpu',         name: 'Processors',     icon: '🔲', desc: 'CPUs & APUs' },
  { id: 'gpu',         name: 'Graphics Cards',  icon: '🎮', desc: 'GPUs' },
  { id: 'ram',         name: 'Memory',          icon: '🧩', desc: 'RAM' },
  { id: 'motherboard', name: 'Motherboards',    icon: '📋', desc: 'Motherboards' },
  { id: 'storage',     name: 'Storage',         icon: '💾', desc: 'SSDs & HDDs' },
  { id: 'psu',         name: 'Power Supplies',  icon: '⚡', desc: 'PSUs' },
  { id: 'case',        name: 'Cases',           icon: '🖥',  desc: 'PC Cases' },
  { id: 'cooler',      name: 'CPU Coolers',     icon: '❄️',  desc: 'Cooling Solutions' },
];

export function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id);
}
