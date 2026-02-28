import { useState, useMemo, useEffect } from 'react';

function getCompareFields(catId) {
  switch (catId) {
    case 'cpu': return [
      { key:'brand', label:'Brand' }, { key:'socket', label:'Socket' },
      { key:'cores', label:'Cores' }, { key:'threads', label:'Threads' },
      { key:'base', label:'Base Clock (GHz)' }, { key:'boost', label:'Boost Clock (GHz)' },
      { key:'tdp', label:'TDP (W)' }, { key:'price', label:'Price ($)' },
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

// Numeric fields for highlighting best value
const NUMERIC_HIGHER_BETTER = new Set(['cores','threads','base','boost','vram','baseClock','boostClock','speed','capacity','read','write','wattage','tdpCapacity']);
const NUMERIC_LOWER_BETTER  = new Set(['tdp','price']);

function getBestIdx(items, key) {
  const vals = items.map(i => Number(i[key]));
  if (vals.some(isNaN)) return -1;
  if (NUMERIC_HIGHER_BETTER.has(key)) return vals.indexOf(Math.max(...vals));
  if (NUMERIC_LOWER_BETTER.has(key))  return vals.indexOf(Math.min(...vals));
  return -1;
}

export default function Compare({ categoriesData, componentsData }) {
  const [catId,   setCatId]   = useState('cpu');
  const [slots,   setSlots]   = useState([null, null, null, null]); // up to 4 items
  const [picker,  setPicker]  = useState(null); // slot index
  const [search,  setSearch]  = useState('');

  // Read URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    const a   = params.get('a');
    if (cat && componentsData[cat]) {
      setCatId(cat);
      const item = (componentsData[cat] ?? []).find(i => i.id === a);
      if (item) setSlots([item, null, null, null]);
    }
  }, []);

  // Reset slots when category changes
  const handleCatChange = (newCat) => {
    setCatId(newCat);
    setSlots([null, null, null, null]);
  };

  const fields = useMemo(() => getCompareFields(catId), [catId]);
  const filledSlots = slots.filter(Boolean);

  const pickerItems = useMemo(() => {
    if (picker === null) return [];
    return (componentsData[catId] ?? []).filter(i => {
      const q = search.toLowerCase();
      return !q || i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q);
    });
  }, [componentsData, catId, picker, search]);

  const selectItem = (item) => {
    setSlots(prev => {
      const next = [...prev];
      next[picker] = item;
      return next;
    });
    setPicker(null);
    setSearch('');
  };

  return (
    <>
      {/* Category selector */}
      <div className="toolbar" style={{ borderTop:'1px solid var(--border)' }}>
        <div className="toolbar__left">
          <span className="label-sm">Category:</span>
          <select className="select-styled" value={catId} onChange={e => handleCatChange(e.target.value)}>
            {categoriesData.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <span className="label-sm">{filledSlots.length} of 4 slots filled</span>
      </div>

      {/* Slots */}
      <div className="compare-slots" style={{ margin:'1.5rem 2rem' }}>
        {slots.map((item, idx) => (
          <div
            key={idx}
            className={`compare-slot ${item ? 'compare-slot--filled' : ''}`}
            onClick={() => !item && setPicker(idx)}
          >
            <div className="compare-slot__label">Slot {idx + 1}</div>
            {item ? (
              <>
                <div className="compare-slot__name">{item.brand} {item.name}</div>
                <div className="compare-slot__price">${item.price}</div>
                <button
                  className="compare-slot__remove"
                  onClick={() => setSlots(prev => { const n = [...prev]; n[idx] = null; return n; })}
                >
                  [remove]
                </button>
              </>
            ) : (
              <>
                <div className="compare-slot__empty">Click to add component</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Compare table */}
      {filledSlots.length >= 2 && (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Spec</th>
                {filledSlots.map((item, i) => (
                  <th key={i}>{item.brand} {item.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map(field => {
                const bestIdx = getBestIdx(filledSlots, field.key);
                return (
                  <tr key={field.key}>
                    <td>{field.label}</td>
                    {filledSlots.map((item, i) => (
                      <td key={i} className={i === bestIdx ? 'compare-highlight' : ''}>
                        {item[field.key] ?? '—'}
                        {i === bestIdx && <span style={{ marginLeft:'0.4rem', fontSize:'0.65rem', color:'var(--green)' }}>▲</span>}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filledSlots.length < 2 && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', color:'var(--text3)' }}>
          Add at least 2 components to see the comparison table.
        </div>
      )}

      {/* Picker modal */}
      {picker !== null && (
        <div className="modal-overlay" onClick={() => { setPicker(null); setSearch(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__title">Add to Slot {picker + 1}</div>
              <button className="modal__close" onClick={() => { setPicker(null); setSearch(''); }}>✕</button>
            </div>
            <div className="modal__search">
              <div className="search-box" style={{ width:'100%' }}>
                <span className="search-icon">⌕</span>
                <input
                  autoFocus
                  type="search"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex:1 }}
                />
              </div>
            </div>
            <div className="modal__list">
              {pickerItems.map(item => (
                <div
                  key={item.id}
                  className="modal-item"
                  onClick={() => selectItem(item)}
                >
                  <div className="modal-item__info">
                    <div className="modal-item__name">{item.brand} {item.name}</div>
                  </div>
                  <div className="modal-item__price">${item.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
