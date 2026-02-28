import { useState, useMemo, useEffect } from 'react';

// ─── UTILS ───────────────────────────────────────────────────────────────────
const FORM_RANK = { mATX: 1, ATX: 2, 'E-ATX': 3 };

function checkCompatibility(build) {
  const issues = [];
  const { cpu, motherboard, ram, gpu, psu, case: pcCase, cooler } = build;

  if (cpu && motherboard && cpu.socket !== motherboard.socket)
    issues.push({ type:'error', msg:`CPU socket (${cpu.socket}) doesn't match motherboard (${motherboard.socket})` });

  if (ram && motherboard && ram.type !== motherboard.ramType)
    issues.push({ type:'error', msg:`RAM type (${ram.type}) incompatible with motherboard (${motherboard.ramType})` });

  if (cpu && cooler) {
    if (cpu.tdp > cooler.tdpCapacity)
      issues.push({ type:'error', msg:`CPU TDP (${cpu.tdp}W) exceeds cooler capacity (${cooler.tdpCapacity}W)` });
    else if (cpu.tdp > cooler.tdpCapacity * 0.85)
      issues.push({ type:'warning', msg:`CPU TDP (${cpu.tdp}W) close to cooler limit (${cooler.tdpCapacity}W)` });
  }

  if (psu && (cpu || gpu)) {
    const estimated = (cpu?.tdp ?? 0) + (gpu?.tdp ?? 0) + 75;
    if (psu.wattage < estimated)
      issues.push({ type:'error', msg:`PSU (${psu.wattage}W) too low — estimated draw ~${estimated}W` });
    else if (psu.wattage < estimated + 100)
      issues.push({ type:'warning', msg:`PSU headroom tight: ${psu.wattage}W vs ~${estimated}W needed` });
  }

  if (pcCase && motherboard) {
    if ((FORM_RANK[pcCase.formFactor] ?? 2) < (FORM_RANK[motherboard.formFactor] ?? 2))
      issues.push({ type:'error', msg:`Case (${pcCase.formFactor}) too small for motherboard (${motherboard.formFactor})` });
  }

  if (issues.length === 0 && Object.values(build).some(Boolean))
    issues.push({ type:'ok', msg:'No compatibility issues detected ✓' });

  return issues;
}

function itemCompatStatus(build, catId, item, freeMode) {
  if (freeMode) return 'free';
  const tempBuild = { ...build, [catId]: item };
  const issues = checkCompatibility(tempBuild).filter(i => i.type === 'error');
  return issues.length > 0 ? 'incompat' : 'ok';
}

function estimateWattage(build) {
  const cpu    = build.cpu?.tdp    ?? 0;
  const gpu    = build.gpu?.tdp    ?? 0;
  const system = 75;
  return { cpu, gpu, system, total: cpu + gpu + system };
}

function getSpecChips(catId, item) {
  switch (catId) {
    case 'cpu':         return [`${item.cores}C/${item.threads}T`, `${item.boost}GHz`, `${item.tdp}W`, item.socket];
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

const EMPTY_BUILD = { cpu:null, gpu:null, ram:null, motherboard:null, storage:null, psu:null, case:null, cooler:null };

const SLOTS = [
  { id:'cpu',         label:'Processor',     icon:'🔲' },
  { id:'motherboard', label:'Motherboard',   icon:'📋' },
  { id:'ram',         label:'Memory',        icon:'🧩' },
  { id:'gpu',         label:'Graphics Card', icon:'🎮' },
  { id:'storage',     label:'Storage',       icon:'💾' },
  { id:'psu',         label:'Power Supply',  icon:'⚡' },
  { id:'case',        label:'Case',          icon:'🖥' },
  { id:'cooler',      label:'CPU Cooler',    icon:'❄️' },
];

// ─── WATTAGE DISPLAY ─────────────────────────────────────────────────────────
function WattageCalc({ build, psu }) {
  const w = estimateWattage(build);
  const psuW = psu?.wattage ?? 0;
  const pct = psuW > 0 ? Math.min(100, Math.round((w.total / psuW) * 100)) : 0;
  const barColor = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="watt-calc">
      <div className="watt-calc__title">// Power Estimate</div>
      <div className="watt-row"><span className="watt-row__label">CPU</span><span className="watt-row__val">{w.cpu}W</span></div>
      <div className="watt-row"><span className="watt-row__label">GPU</span><span className="watt-row__val">{w.gpu}W</span></div>
      <div className="watt-row"><span className="watt-row__label">System (est.)</span><span className="watt-row__val">{w.system}W</span></div>
      <div className="watt-row" style={{ borderTop:'1px solid var(--border)', paddingTop:'0.4rem', marginTop:'0.3rem' }}>
        <span className="watt-row__label" style={{ color:'var(--text2)', fontWeight:600 }}>Total Draw</span>
        <span className="watt-row__val" style={{ color:'var(--text)' }}>{w.total}W</span>
      </div>
      {psuW > 0 && (
        <>
          <div className="watt-bar-track">
            <div className="watt-bar-fill" style={{ width:`${pct}%`, background: barColor }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text3)' }}>
            <span>0W</span>
            <span style={{ color: barColor }}>{pct}% of PSU</span>
            <span>{psuW}W</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── PICKER MODAL ─────────────────────────────────────────────────────────────
function PickerModal({ catId, catLabel, components, build, freeMode, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState('price-asc');

  const items = useMemo(() => {
    let res = (components[catId] ?? []).filter(i => {
      const q = search.toLowerCase();
      return !q || i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q);
    });
    res = [...res].sort((a, b) => {
      if (sort === 'price-asc')  return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'name-asc')   return a.name.localeCompare(b.name);
      return 0;
    });
    return res.map(item => ({ item, compat: itemCompatStatus(build, catId, item, freeMode) }));
  }, [components, catId, search, sort, build, freeMode]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-label={`Select ${catLabel}`}>
        <div className="modal__header">
          <div className="modal__title">
            Select {catLabel}
            {freeMode && <span className="modal__free-badge">FREE MODE</span>}
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__search">
          <div className="search-box" style={{ width:'100%' }}>
            <span className="search-icon">⌕</span>
            <input
              autoFocus
              type="search"
              placeholder={`Search ${catLabel}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex:1 }}
            />
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.6rem 1.5rem', borderBottom:'1px solid var(--border)' }}>
          <span className="label-sm">Sort:</span>
          <select className="select-styled" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="name-asc">Name A→Z</option>
          </select>
          <span className="label-sm" style={{ marginLeft:'auto' }}>{items.length} results</span>
        </div>

        <div className="modal__list">
          {items.length === 0 && (
            <div style={{ padding:'2rem', textAlign:'center', color:'var(--text3)' }}>No results</div>
          )}
          {items.map(({ item, compat }) => (
            <div
              key={item.id}
              className={`modal-item ${!freeMode && compat === 'incompat' ? 'modal-item--incompat' : ''}`}
              onClick={() => {
                if (!freeMode && compat === 'incompat') return;
                onSelect(catId, item);
              }}
            >
              <div className="modal-item__info">
                <div className="modal-item__name">{item.brand} {item.name}</div>
                <div className="modal-item__specs">{getSpecChips(catId, item).join(' · ')}</div>
              </div>
              <div className="modal-item__price">${item.price}</div>
              {!freeMode && compat !== 'free' && (
                <span className={`compat-badge compat-badge--${compat}`}>
                  {compat === 'ok' ? '✓ COMPAT' : compat === 'warn' ? '⚠ WARN' : '✗ INCOMPAT'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN BUILDER ─────────────────────────────────────────────────────────────
export default function Builder({ categoriesData, componentsData }) {
  const [build,     setBuild]     = useState(EMPTY_BUILD);
  const [freeMode,  setFreeMode]  = useState(false);
  const [picker,    setPicker]    = useState(null); // catId | null
  const [copied,    setCopied]    = useState(false);

  // Read URL params on mount — support ?add=cpu:cpu1 from detail/category pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const add    = params.get('add'); // e.g. "cpu:cpu1"
    const load   = params.get('build'); // JSON-encoded build IDs

    if (add) {
      const [catId, itemId] = add.split(':');
      const item = (componentsData[catId] ?? []).find(i => i.id === itemId);
      if (item) setBuild(prev => ({ ...prev, [catId]: item }));
      window.history.replaceState({}, '', '/builder');
    }

    if (load) {
      try {
        const ids = JSON.parse(decodeURIComponent(load));
        const restored = {};
        for (const [catId, itemId] of Object.entries(ids)) {
          const item = (componentsData[catId] ?? []).find(i => i.id === itemId);
          if (item) restored[catId] = item;
        }
        setBuild(prev => ({ ...prev, ...restored }));
      } catch {}
      window.history.replaceState({}, '', '/builder');
    }
  }, []);

  const compatIssues = useMemo(() => checkCompatibility(build), [build]);
  const totalPrice   = useMemo(() =>
    Object.values(build).filter(Boolean).reduce((s, i) => s + i.price, 0), [build]);

  const getRowState = (catId) => {
    if (!build[catId]) return '';
    const errors   = compatIssues.filter(i => i.type === 'error'   && i.msg.toLowerCase().includes(catId));
    const warnings = compatIssues.filter(i => i.type === 'warning' && i.msg.toLowerCase().includes(catId));
    if (errors.length)   return 'builder-row--error';
    if (warnings.length) return 'builder-row--warn';
    return 'builder-row--selected';
  };

  const shareBuild = () => {
    const ids = {};
    for (const [catId, item] of Object.entries(build)) {
      if (item) ids[catId] = item.id;
    }
    const url = `${window.location.origin}/builder?build=${encodeURIComponent(JSON.stringify(ids))}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const exportList = () => {
    const lines = ['PCForge Build Export', '='.repeat(40), ''];
    for (const slot of SLOTS) {
      const item = build[slot.id];
      if (item) lines.push(`${slot.label}: ${item.brand} ${item.name} — $${item.price}`);
    }
    lines.push('', `Total: $${totalPrice.toLocaleString()}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'pcforge-build.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="page-header">
        <p className="page-header__tag">// PC Builder</p>
        <h1 className="page-header__title">Configure Your Build</h1>
        <p className="page-header__sub">Click any slot to select a component</p>
      </div>

      <div className="builder-layout">
        {/* ── LEFT: Slots ── */}
        <div className="builder-main">
          {/* Compatibility toggle */}
          <div className="compat-toggle">
            <label className="toggle-switch">
              <input type="checkbox" checked={freeMode} onChange={e => setFreeMode(e.target.checked)} />
              <div className="toggle-slider" />
            </label>
            <div>
              <div className="toggle-label__title">Free Selection Mode</div>
              <div className={`toggle-label__note ${freeMode ? 'toggle-label__note--warn' : ''}`}>
                {freeMode
                  ? '⚠️  Compatibility filtering disabled. Incompatible parts will not be blocked — verify manually before purchasing.'
                  : 'Compatibility checking is ON. Incompatible parts are greyed out in the picker.'}
              </div>
            </div>
          </div>

          {/* Component slots */}
          {SLOTS.map(slot => {
            const selected = build[slot.id];
            const rowClass = getRowState(slot.id);
            return (
              <div
                key={slot.id}
                className={`builder-row ${rowClass}`}
                onClick={() => setPicker(slot.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setPicker(slot.id)}
                aria-label={`Select ${slot.label}`}
              >
                <span className="builder-row__icon">{slot.icon}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="builder-row__cat">{slot.label}</div>
                  {selected
                    ? <div className="builder-row__name">{selected.brand} {selected.name}</div>
                    : <div className="builder-row__name builder-row__name--empty">Choose {slot.label}…</div>
                  }
                </div>
                {selected && (
                  <>
                    <span className="builder-row__price">${selected.price}</span>
                    <button
                      className="builder-row__remove"
                      aria-label={`Remove ${slot.label}`}
                      onClick={e => { e.stopPropagation(); setBuild(prev => ({ ...prev, [slot.id]: null })); }}
                    >✕</button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="builder-sidebar">
          {/* Summary */}
          <div className="summary-block">
            <div className="summary-block__title">// Build Summary</div>
            {SLOTS.map(slot => build[slot.id] && (
              <div className="summary-row" key={slot.id}>
                <span className="summary-row__label">{slot.label}</span>
                <span className="summary-row__val">${build[slot.id].price}</span>
              </div>
            ))}
            {!Object.values(build).some(Boolean) && (
              <div style={{ color:'var(--text3)', fontSize:'0.83rem', fontStyle:'italic' }}>No components selected yet</div>
            )}
            <div className="summary-total">
              <span className="summary-total__label">Total</span>
              <span className="summary-total__price">${totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Wattage */}
          <WattageCalc build={build} psu={build.psu} />

          {/* Compatibility */}
          <div style={{ marginBottom:'1rem' }}>
            {compatIssues.map((issue, i) => (
              <div key={i} className={`compat-issue compat-issue--${issue.type === 'ok' ? 'ok' : issue.type === 'warning' ? 'warn' : 'error'}`}>
                <span style={{ flexShrink:0 }}>
                  {issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : '✓'}
                </span>
                <span>{issue.msg}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <button className="btn btn--primary btn--full" onClick={exportList} style={{ marginBottom:'0.5rem' }}>
            Export Build List ↓
          </button>
          <button className="btn btn--secondary btn--full" onClick={shareBuild} style={{ marginBottom:'0.5rem' }}>
            {copied ? '✓ Link Copied!' : 'Share Build 🔗'}
          </button>
          <button
            className="btn btn--ghost btn--full"
            onClick={() => setBuild(EMPTY_BUILD)}
          >
            Clear Build
          </button>
        </div>
      </div>

      {/* Picker modal */}
      {picker && (
        <PickerModal
          catId={picker}
          catLabel={SLOTS.find(s => s.id === picker)?.label ?? picker}
          components={componentsData}
          build={build}
          freeMode={freeMode}
          onSelect={(catId, item) => {
            setBuild(prev => ({ ...prev, [catId]: item }));
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </>
  );
}
