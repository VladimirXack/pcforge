import { useState, useMemo } from 'react';

const SORT_OPTIONS = [
  { value: 'price-asc',  label: 'Price: Low → High' },
  { value: 'price-desc', label: 'Price: High → Low' },
  { value: 'name-asc',   label: 'Name: A → Z' },
  { value: 'brand-asc',  label: 'Brand: A → Z' },
];

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

function getBrands(items) {
  return [...new Set(items.map(i => i.brand))].sort();
}

export default function CategoryBrowser({ catId, items }) {
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState('price-asc');
  const [brand,   setBrand]   = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page,    setPage]    = useState(1);

  const brands = useMemo(() => getBrands(items), [items]);

  const filtered = useMemo(() => {
    let res = items.filter(i => {
      const q = search.toLowerCase();
      const matchSearch = !q || i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q);
      const matchBrand  = !brand || i.brand === brand;
      return matchSearch && matchBrand;
    });
    res = [...res].sort((a, b) => {
      switch (sort) {
        case 'price-asc':  return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-asc':   return a.name.localeCompare(b.name);
        case 'brand-asc':  return a.brand.localeCompare(b.brand);
        default: return 0;
      }
    });
    return res;
  }, [items, search, sort, brand]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage   = Math.min(page, totalPages);
  const paged      = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const resetPage  = () => setPage(1);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 4)   return [1,2,3,4,5,'…',totalPages];
    if (safePage >= totalPages - 3) return [1,'…',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,'…',safePage-1,safePage,safePage+1,'…',totalPages];
  }, [totalPages, safePage]);

  return (
    <>
      <div className="toolbar">
        <div className="toolbar__left">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input type="search" placeholder="Search..." value={search}
              onChange={e => { setSearch(e.target.value); resetPage(); }} />
          </div>
          <select className="select-styled" value={brand}
            onChange={e => { setBrand(e.target.value); resetPage(); }}>
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="toolbar__right">
          <select className="select-styled" value={sort}
            onChange={e => { setSort(e.target.value); resetPage(); }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <span className="label-sm">Show:</span>
          <select className="select-styled" value={perPage}
            onChange={e => { setPerPage(Number(e.target.value)); resetPage(); }}>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="label-sm">{filtered.length} results</span>
        </div>
      </div>

      <div className="grid-border grid-components" style={{ borderTop: 'none' }}>
        {paged.length === 0 ? (
          <div style={{ padding:'3rem', color:'var(--text3)', gridColumn:'1/-1', textAlign:'center' }}>
            No components match your search.
          </div>
        ) : paged.map(item => (
          <a key={item.id} href={`/components/${catId}-${item.id}`} className="comp-card">
            <div className="comp-card__brand">{item.brand}</div>
            <div className="comp-card__name">{item.name}</div>
            <div className="comp-card__chips">
              {getSpecChips(catId, item).map(c => (
                <span key={c} className="spec-chip">{c}</span>
              ))}
            </div>
            <div className="comp-card__footer">
              <span className="comp-card__price">${item.price}</span>
              <a href={`/builder?add=${catId}:${item.id}`} className="comp-card__add"
                onClick={e => e.stopPropagation()}>+ Add to Build</a>
            </div>
          </a>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button className="page-btn" disabled={safePage === 1}
            onClick={() => setPage(p => p - 1)}>←</button>
          {pageNumbers.map((p, i) =>
            p === '…'
              ? <span key={`e${i}`} className="page-btn" style={{ cursor:'default', opacity:0.4 }}>…</span>
              : <button key={p} className={`page-btn ${p === safePage ? 'page-btn--active' : ''}`}
                  onClick={() => setPage(p)}>{p}</button>
          )}
          <button className="page-btn" disabled={safePage === totalPages}
            onClick={() => setPage(p => p + 1)}>→</button>
        </nav>
      )}
    </>
  );
}
