import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Download, Star } from 'lucide-react';
import { fetchReportData, fetchRatings } from '../services/supabase';

const peso = (n) =>
  '₱' +
  Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const dayKey = (d) => new Date(d).toLocaleDateString('en-CA'); // YYYY-MM-DD (local time)
const parseDay = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const weekStartKey = (k) => {
  const x = parseDay(k);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return dayKey(x);
};
const shortDate = (k) =>
  parseDay(k).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

const categoryLabel = (cat, name) => {
  const text = `${cat || ''} ${name || ''}`.toLowerCase();
  if (text.includes('triple')) return 'Triple Flower';
  if (text.includes('bouquet')) return 'Bouquet';
  if (text.includes('solo')) return 'Solo Flower';
  return 'Other';
};

const RANGES = [
  { label: 'TODAY', value: 1 },
  { label: '7 DAYS', value: 7 },
  { label: '30 DAYS', value: 30 },
  { label: 'ALL TIME', value: 0 }
];

const card = {
  background: 'rgba(255,255,255,0.07)',
  border: '1.5px dashed rgba(147,197,253,0.4)',
  borderRadius: '18px',
  padding: '20px'
};

const Stars = ({ value, size = 16 }) => (
  <span style={{ display: 'inline-flex', gap: '2px' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} color="#f59e0b" fill={n <= value ? '#f59e0b' : 'none'} />
    ))}
  </span>
);

const StatCard = ({ label, value, sub }) => (
  <div style={card}>
    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.05em' }}>
      {label}
    </div>
    <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '6px', color: '#fff' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
  </div>
);

const BarRow = ({ label, value, max, right }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '4px' }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span style={{ color: '#93c5fd', fontWeight: 700 }}>{right}</span>
    </div>
    <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px' }}>
      <div
        style={{
          height: '100%',
          width: `${max ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0}%`,
          background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
          borderRadius: '9999px'
        }}
      />
    </div>
  </div>
);

export const ReportsPanel = ({ onBack }) => {
  const [data, setData] = useState({ orders: [], products: [] });
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState(7);
  const [tableMode, setTableMode] = useState('daily');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      setData(await fetchReportData());
      try {
        setRatings(await fetchRatings());
      } catch {
        setRatings([]);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const report = useMemo(() => {
    const catOf = {};
    data.products.forEach((p) => {
      catOf[p.id] = p.category;
    });

    const now = new Date();
    const since =
      range > 0 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - (range - 1)) : null;

    const isCash = (o) => String(o.payment_reference || '').toUpperCase() === 'CASH';
    const valid = data.orders.filter((o) => o.status !== 'cancelled');
    const inRange = valid.filter((o) => !since || new Date(o.created_at) >= since);

    let revenue = 0;
    let itemsSold = 0;
    const cats = {};
    const prods = {};
    const pay = { cash: { count: 0, amount: 0 }, gcash: { count: 0, amount: 0 } };
    const byDay = {};

    inRange.forEach((o) => {
      const amt = Number(o.total_amount || 0);
      const k = dayKey(o.created_at);
      byDay[k] = byDay[k] || { date: k, orders: 0, items: 0, revenue: 0, cash: 0, gcash: 0 };

      revenue += amt;
      byDay[k].orders += 1;
      byDay[k].revenue += amt;

      if (isCash(o)) {
        pay.cash.count += 1;
        pay.cash.amount += amt;
        byDay[k].cash += amt;
      } else {
        pay.gcash.count += 1;
        pay.gcash.amount += amt;
        byDay[k].gcash += amt;
      }

      (o.order_items || []).forEach((i) => {
        const q = Number(i.quantity || 0);
        itemsSold += q;
        byDay[k].items += q;
        const cat = categoryLabel(catOf[i.product_id], i.product_name);
        cats[cat] = (cats[cat] || 0) + q;
        const p = (prods[i.product_name] = prods[i.product_name] || { name: i.product_name, qty: 0, amount: 0 });
        p.qty += q;
        p.amount += Number(i.subtotal || 0);
      });
    });

    const dailyRows = Object.values(byDay).sort((a, b) => (a.date < b.date ? 1 : -1));

    const weeks = {};
    dailyRows.forEach((r) => {
      const w = weekStartKey(r.date);
      weeks[w] = weeks[w] || { date: w, orders: 0, items: 0, revenue: 0, cash: 0, gcash: 0 };
      ['orders', 'items', 'revenue', 'cash', 'gcash'].forEach((f) => (weeks[w][f] += r[f]));
    });
    const weeklyRows = Object.values(weeks).sort((a, b) => (a.date < b.date ? 1 : -1));

    // Bar chart: last N days (independent of the table range)
    const chartDays = range === 1 ? 7 : range === 0 ? 30 : range;
    const allByDay = {};
    valid.forEach((o) => {
      const k = dayKey(o.created_at);
      allByDay[k] = (allByDay[k] || 0) + Number(o.total_amount || 0);
    });
    const chart = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const k = dayKey(d);
      chart.push({ date: k, value: allByDay[k] || 0 });
    }

    return {
      orders: inRange.length,
      cancelled: data.orders.filter(
        (o) => o.status === 'cancelled' && (!since || new Date(o.created_at) >= since)
      ).length,
      revenue,
      itemsSold,
      avg: inRange.length ? revenue / inRange.length : 0,
      cats: Object.entries(cats).sort((a, b) => b[1] - a[1]),
      top: Object.values(prods).sort((a, b) => b.qty - a.qty).slice(0, 5),
      pay,
      dailyRows,
      weeklyRows,
      chart,
      chartDays
    };
  }, [data, range]);

  const ratingStats = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    ratings.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1] += 1;
    });
    const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    return { dist, avg };
  }, [ratings]);

  const tableRows = tableMode === 'daily' ? report.dailyRows : report.weeklyRows;

  const downloadCsv = () => {
    const header = [tableMode === 'daily' ? 'Date' : 'Week starting', 'Orders', 'Items sold', 'Sales', 'Cash', 'GCash'];
    const lines = tableRows.map((r) =>
      [r.date, r.orders, r.items, r.revenue.toFixed(2), r.cash.toFixed(2), r.gcash.toFixed(2)].join(',')
    );
    const blob = new Blob(['\uFEFF' + [header.join(','), ...lines].join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fleurs-${tableMode}-report.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const maxChart = Math.max(...report.chart.map((c) => c.value), 1);
  const maxCat = Math.max(...report.cats.map((c) => c[1]), 1);
  const maxTop = Math.max(...report.top.map((p) => p.qty), 1);
  const maxDist = Math.max(...ratingStats.dist, 1);

  const pill = (active) => ({
    background: active ? '#3b82f6' : 'rgba(255,255,255,0.08)',
    color: active ? '#fff' : '#93c5fd',
    border: active ? '2px solid #60a5fa' : '1px dashed rgba(147,197,253,0.4)',
    borderRadius: '9999px',
    padding: '8px 18px',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer'
  });

  const th = { textAlign: 'left', padding: '10px 8px', color: '#93c5fd', fontSize: '0.85rem', borderBottom: '1px solid rgba(147,197,253,0.3)' };
  const td = { padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.95rem' };

  return (
    <div
      style={{
        flex: 1,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #07101f 0%, #0d1b30 100%)',
        color: '#ffffff',
        padding: '24px 32px'
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '2px dashed rgba(147, 197, 253, 0.3)',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '2px dashed #93c5fd',
              padding: '10px 20px',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700
            }}
          >
            <ArrowLeft size={20} /> BACK TO ORDERS
          </button>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', fontWeight: 800 }}>
            SALES & FEEDBACK REPORTS
          </h1>
        </div>
        <button
          onClick={load}
          style={{
            background: '#1e3a8a',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '9999px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700
          }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> REFRESH
        </button>
      </div>

      {error && <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '16px' }}>{error}</div>}

      {/* Range */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {RANGES.map((r) => (
          <button key={r.value} style={pill(range === r.value)} onClick={() => setRange(r.value)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <StatCard label="TOTAL SALES" value={peso(report.revenue)} sub="cancelled orders not counted" />
        <StatCard
          label="ORDERS"
          value={report.orders}
          sub={report.cancelled ? `${report.cancelled} cancelled` : 'no cancelled'}
        />
        <StatCard label="ITEMS SOLD" value={report.itemsSold} />
        <StatCard label="AVG PER ORDER" value={peso(report.avg)} />
        <StatCard
          label="AVG RATING"
          value={ratings.length ? `${ratingStats.avg.toFixed(1)} / 5` : '-'}
          sub={`${ratings.length} ${ratings.length === 1 ? 'rating' : 'ratings'} (all time)`}
        />
      </div>

      {/* Daily sales chart */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>
          Daily sales (last {report.chartDays} days)
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '190px' }}>
          {report.chart.map((c, i) => (
            <div
              key={c.date}
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
              title={`${shortDate(c.date)}: ${peso(c.value)}`}
            >
              {report.chartDays <= 14 && c.value > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#93c5fd', marginBottom: '2px' }}>
                  {Math.round(c.value)}
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  maxWidth: '40px',
                  height: `${Math.max((c.value / maxChart) * 140, c.value > 0 ? 4 : 1)}px`,
                  background: c.value > 0 ? 'linear-gradient(180deg,#60a5fa,#3b82f6)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '6px 6px 0 0'
                }}
              />
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', height: '14px', whiteSpace: 'nowrap' }}>
                {report.chartDays <= 14 || i % 5 === 0 ? shortDate(c.date) : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category / Top / Payment */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div style={card}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>Sold per category</h3>
          {report.cats.length === 0 && <p style={{ color: '#94a3b8' }}>No sales in this range.</p>}
          {report.cats.map(([name, qty]) => (
            <BarRow key={name} label={name} value={qty} max={maxCat} right={`${qty} pcs`} />
          ))}
        </div>

        <div style={card}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>Best sellers</h3>
          {report.top.length === 0 && <p style={{ color: '#94a3b8' }}>No sales in this range.</p>}
          {report.top.map((p) => (
            <BarRow key={p.name} label={p.name} value={p.qty} max={maxTop} right={`${p.qty} pcs · ${peso(p.amount)}`} />
          ))}
        </div>

        <div style={card}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>Payment method</h3>
          <BarRow
            label="Cash"
            value={report.pay.cash.amount}
            max={Math.max(report.pay.cash.amount, report.pay.gcash.amount)}
            right={`${report.pay.cash.count} orders · ${peso(report.pay.cash.amount)}`}
          />
          <BarRow
            label="GCash"
            value={report.pay.gcash.amount}
            max={Math.max(report.pay.cash.amount, report.pay.gcash.amount)}
            right={`${report.pay.gcash.count} orders · ${peso(report.pay.gcash.amount)}`}
          />
        </div>
      </div>

      {/* Daily / weekly record */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem' }}>Order record</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button style={pill(tableMode === 'daily')} onClick={() => setTableMode('daily')}>DAILY</button>
            <button style={pill(tableMode === 'weekly')} onClick={() => setTableMode('weekly')}>WEEKLY</button>
            <button
              style={{ ...pill(false), display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={downloadCsv}
              disabled={tableRows.length === 0}
            >
              <Download size={16} /> CSV
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
            <thead>
              <tr>
                <th style={th}>{tableMode === 'daily' ? 'DATE' : 'WEEK OF (MON)'}</th>
                <th style={th}>ORDERS</th>
                <th style={th}>ITEMS</th>
                <th style={th}>CASH</th>
                <th style={th}>GCASH</th>
                <th style={th}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 && (
                <tr>
                  <td style={{ ...td, color: '#94a3b8' }} colSpan={6}>No orders in this range.</td>
                </tr>
              )}
              {tableRows.map((r) => (
                <tr key={r.date}>
                  <td style={td}>{parseDay(r.date).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style={td}>{r.orders}</td>
                  <td style={td}>{r.items}</td>
                  <td style={td}>{peso(r.cash)}</td>
                  <td style={td}>{peso(r.gcash)}</td>
                  <td style={{ ...td, fontWeight: 800, color: '#86efac' }}>{peso(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback */}
      <div style={card}>
        <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '16px' }}>Customer feedback</h3>
        {ratings.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No ratings yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fbbf24' }}>
                {ratingStats.avg.toFixed(1)} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 5</span>
              </div>
              <div style={{ marginBottom: '16px' }}><Stars value={Math.round(ratingStats.avg)} size={22} /></div>
              {[5, 4, 3, 2, 1].map((n) => (
                <BarRow
                  key={n}
                  label={`${n} ★`}
                  value={ratingStats.dist[n - 1]}
                  max={maxDist}
                  right={ratingStats.dist[n - 1]}
                />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ratings.slice(0, 6).map((r) => (
                <div key={r.id} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <Stars value={r.rating} />
                    <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
                      {new Date(r.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontWeight: 800, marginTop: '6px' }}>
                    {r.customer_name} <span style={{ color: '#93c5fd', fontWeight: 600, fontSize: '0.85rem' }}>{r.order_number}</span>
                  </div>
                  <p style={{ color: r.comment ? '#e2e8f0' : '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    {r.comment || 'No comment'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};