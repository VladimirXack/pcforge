import { cpus } from './cpu.js';
import { gpus } from './gpu.js';
import { rams, motherboards, storageItems, psus, cases, coolers } from './components.js';
export { CATEGORIES, getCategoryById } from './categories.js';

export const ALL_COMPONENTS = {
  cpu:         cpus,
  gpu:         gpus,
  ram:         rams,
  motherboard: motherboards,
  storage:     storageItems,
  psu:         psus,
  case:        cases,
  cooler:      coolers,
};

export function getComponents(catId) {
  return ALL_COMPONENTS[catId] ?? [];
}

export function getComponentById(catId, id) {
  return getComponents(catId).find(c => c.id === id) ?? null;
}

export function getSlug(item) {
  return item.id;
}

/** Returns array of [label, value] pairs for the detail page specs table */
export function getDetailSpecs(catId, item) {
  switch (catId) {
    case 'cpu': return [
      ['Brand', item.brand], ['Socket', item.socket],
      ['Cores / Threads', `${item.cores} / ${item.threads}`],
      ['Base Clock', `${item.base} GHz`], ['Boost Clock', `${item.boost} GHz`],
      ['TDP', `${item.tdp}W`],
    ];
    case 'gpu': return [
      ['Brand', item.brand], ['VRAM', `${item.vram}GB`],
      ['Base Clock', `${item.baseClock} MHz`], ['Boost Clock', `${item.boostClock} MHz`],
      ['TDP', `${item.tdp}W`],
    ];
    case 'ram': return [
      ['Brand', item.brand], ['Type', item.type],
      ['Speed', `${item.speed} MHz`], ['Capacity', `${item.capacity}GB`],
    ];
    case 'motherboard': return [
      ['Brand', item.brand], ['Socket', item.socket],
      ['Form Factor', item.formFactor], ['RAM Type', item.ramType],
    ];
    case 'storage': return [
      ['Brand', item.brand], ['Type', item.type],
      ['Capacity', item.capacity], ['Read Speed', `${item.read} MB/s`],
      ['Write Speed', `${item.write} MB/s`], ['Interface', item.iface],
    ];
    case 'psu': return [
      ['Brand', item.brand], ['Wattage', `${item.wattage}W`],
      ['Efficiency', item.efficiency], ['Modularity', `${item.modular} Modular`],
    ];
    case 'case': return [
      ['Brand', item.brand], ['Form Factor', item.formFactor], ['Color', item.color],
    ];
    case 'cooler': return [
      ['Brand', item.brand], ['Type', item.type], ['Max TDP Capacity', `${item.tdpCapacity}W`],
    ];
    default: return [];
  }
}

/** Returns short chip labels for cards */
export function getSpecChips(catId, item) {
  switch (catId) {
    case 'cpu':         return [`${item.cores}C/${item.threads}T`, `${item.boost}GHz Boost`, `${item.tdp}W`, item.socket];
    case 'gpu':         return [`${item.vram}GB VRAM`, `${item.boostClock}MHz`, `${item.tdp}W`];
    case 'ram':         return [item.type, `${item.speed}MHz`, `${item.capacity}GB`];
    case 'motherboard': return [item.socket, item.formFactor, item.ramType];
    case 'storage':     return [item.type, item.capacity, item.iface];
    case 'psu':         return [`${item.wattage}W`, item.efficiency, `${item.modular} Mod.`];
    case 'case':        return [item.formFactor, item.color];
    case 'cooler':      return [item.type, `Up to ${item.tdpCapacity}W`];
    default: return [];
  }
}

/** Comparable numeric fields for the compare page */
export function getCompareFields(catId) {
  switch (catId) {
    case 'cpu': return [
      { key:'brand', label:'Brand' }, { key:'socket', label:'Socket' },
      { key:'cores', label:'Cores' }, { key:'threads', label:'Threads' },
      { key:'base',  label:'Base Clock (GHz)' }, { key:'boost', label:'Boost Clock (GHz)' },
      { key:'tdp',   label:'TDP (W)' }, { key:'price',  label:'Price ($)' },
    ];
    case 'gpu': return [
      { key:'brand', label:'Brand' }, { key:'vram', label:'VRAM (GB)' },
      { key:'baseClock', label:'Base Clock (MHz)' }, { key:'boostClock', label:'Boost Clock (MHz)' },
      { key:'tdp', label:'TDP (W)' }, { key:'price', label:'Price ($)' },
    ];
    case 'ram': return [
      { key:'brand', label:'Brand' }, { key:'type', label:'Type' },
      { key:'speed', label:'Speed (MHz)' }, { key:'capacity', label:'Capacity (GB)' },
      { key:'price', label:'Price ($)' },
    ];
    case 'motherboard': return [
      { key:'brand', label:'Brand' }, { key:'socket', label:'Socket' },
      { key:'formFactor', label:'Form Factor' }, { key:'ramType', label:'RAM Type' },
      { key:'price', label:'Price ($)' },
    ];
    case 'storage': return [
      { key:'brand', label:'Brand' }, { key:'type', label:'Type' },
      { key:'capacity', label:'Capacity' }, { key:'read', label:'Read (MB/s)' },
      { key:'write', label:'Write (MB/s)' }, { key:'iface', label:'Interface' },
      { key:'price', label:'Price ($)' },
    ];
    case 'psu': return [
      { key:'brand', label:'Brand' }, { key:'wattage', label:'Wattage (W)' },
      { key:'efficiency', label:'Efficiency' }, { key:'modular', label:'Modular' },
      { key:'price', label:'Price ($)' },
    ];
    case 'case': return [
      { key:'brand', label:'Brand' }, { key:'formFactor', label:'Form Factor' },
      { key:'color', label:'Color' }, { key:'price', label:'Price ($)' },
    ];
    case 'cooler': return [
      { key:'brand', label:'Brand' }, { key:'type', label:'Type' },
      { key:'tdpCapacity', label:'Max TDP (W)' }, { key:'price', label:'Price ($)' },
    ];
    default: return [];
  }
}
