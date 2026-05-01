import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../api/axiosInstance';
import { toCSV, downloadCSV } from '../utils/csvExport';
import { DollarSign, ShoppingCart, TrendingUp, Users, Download, RefreshCw } from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const CHART_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#84CC16'];

const CHART_TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#F3F4F6' },
};

// ─── Sub Components ────────────────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0">
      <Icon size={22} />
    </div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, onExport, children }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-base font-semibold text-gray-200">{title}</h3>
      {onExport && (
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-400 transition-colors px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg"
        >
          <Download size={13} /> Export CSV
        </button>
      )}
    </div>
    {children}
  </div>
);

// ─── Date Range Presets ────────────────────────────────────────────────────────
const getPresetDates = (preset) => {
  const today = new Date();
  const fmt = (d) => d.toISOString().split('T')[0];
  switch (preset) {
    case 'today': return { dateFrom: fmt(today), dateTo: fmt(today) };
    case '7d': {
      const d = new Date(today); d.setDate(d.getDate() - 7);
      return { dateFrom: fmt(d), dateTo: fmt(today) };
    }
    case '30d': {
      const d = new Date(today); d.setDate(d.getDate() - 30);
      return { dateFrom: fmt(d), dateTo: fmt(today) };
    }
    default: return { dateFrom: '2000-01-01', dateTo: fmt(today) };
  }
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Reports = () => {
  const [datePreset, setDatePreset] = useState('30d');
  const [customDates, setCustomDates] = useState({ dateFrom: '', dateTo: '' });
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [customerLtv, setCustomerLtv] = useState([]);

  const activeDates = datePreset === 'custom' ? customDates : getPresetDates(datePreset);

  const fetchAll = useCallback(async () => {
    const { dateFrom, dateTo } = activeDates;
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const params = `dateFrom=${dateFrom}&dateTo=${dateTo}`;
      const [salesRes, catRes, prodRes, funnelRes, ltvRes] = await Promise.all([
        api.get(`/reports/sales-summary?${params}&period=daily`),
        api.get(`/reports/revenue-by-category?${params}`),
        api.get(`/reports/top-products?${params}&limit=10`),
        api.get(`/reports/order-funnel?${params}`),
        api.get(`/reports/customer-ltv?${params}`),
      ]);
      setSummary(salesRes.data.data.summary);
      setTimeline(salesRes.data.data.timeline.map(d => ({
        ...d,
        period: new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(d.revenue || 0).toFixed(2),
      })));
      setCategoryRevenue(catRes.data.data.map(d => ({ ...d, revenue: parseFloat(d.revenue || 0).toFixed(2) })));
      setTopProducts(prodRes.data.data.map(d => ({ ...d, revenue: parseFloat(d.revenue || 0).toFixed(2) })));
      setFunnel(funnelRes.data.data);
      setCustomerLtv(ltvRes.data.data.map(d => ({ ...d, lifetime_value: parseFloat(d.lifetime_value || 0).toFixed(2) })));
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  }, [activeDates.dateFrom, activeDates.dateTo]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formatCurrency = (v) => v !== undefined ? `$${parseFloat(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—';

  const presets = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: 'all', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Analytics & Reports</h2>
          <p className="text-gray-400 mt-1">Insights cached every 15 minutes for performance.</p>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors text-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Date Range Picker ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => setDatePreset(p.id)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              datePreset === p.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customDates.dateFrom}
              onChange={e => setCustomDates(d => ({ ...d, dateFrom: e.target.value }))}
              className="bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={customDates.dateTo}
              onChange={e => setCustomDates(d => ({ ...d, dateTo: e.target.value }))}
              className="bg-gray-950 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard icon={DollarSign} label="Total Revenue" value={formatCurrency(summary?.total_revenue)} sub="Excludes cancelled orders" />
        <KPICard icon={ShoppingCart} label="Total Orders" value={summary?.total_orders ?? '—'} />
        <KPICard icon={TrendingUp} label="Avg Order Value" value={formatCurrency(summary?.avg_order_value)} />
        <KPICard icon={Users} label="Top Customers" value={customerLtv.length} sub="In selected period" />
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="xl:col-span-2">
          <ChartCard title="Revenue Over Time">
            {timeline.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data for selected period</div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="period" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`$${v}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5}
                      dot={{ r: 3, fill: '#6366F1', strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* Order Funnel */}
        <ChartCard title="Order Funnel">
          {funnel.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={funnel}
                    dataKey="count"
                    nameKey="status"
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {funnel.map((entry, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-gray-400 text-xs capitalize">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Products */}
        <ChartCard
          title="Top 10 Products by Revenue"
          onExport={() => downloadCSV(
            toCSV(topProducts, ['name', 'sku', 'units_sold', 'revenue'], ['Product', 'SKU', 'Units Sold', 'Revenue']),
            'top-products.csv'
          )}
        >
          {topProducts.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.length > 18 ? v.substring(0, 18) + '…' : v} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`$${v}`, 'Revenue']} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {topProducts.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Revenue by Category */}
        <ChartCard title="Revenue by Category">
          {categoryRevenue.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500 text-sm">No data</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="category" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.length > 10 ? v.substring(0, 10) + '…' : v} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={v => [`$${v}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Customer LTV Table ── */}
      <ChartCard
        title="Top 20 Customers by Lifetime Value"
        onExport={() => downloadCSV(
          toCSV(customerLtv, ['name', 'email', 'order_count', 'lifetime_value', 'avg_order_value'],
            ['Name', 'Email', 'Orders', 'Lifetime Value', 'Avg Order Value']),
          'customer-ltv.csv'
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800">
                {['#', 'Customer', 'Email', 'Orders', 'Lifetime Value', 'Avg Order'].map(h => (
                  <th key={h} className="pb-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {customerLtv.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No customer data for selected period</td></tr>
              ) : customerLtv.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 pr-4 text-sm text-gray-500">{i + 1}</td>
                  <td className="py-3 pr-4 font-medium text-gray-200">{c.name}</td>
                  <td className="py-3 pr-4 text-sm text-gray-400">{c.email}</td>
                  <td className="py-3 pr-4 text-sm text-gray-300">{c.order_count}</td>
                  <td className="py-3 pr-4 text-sm font-semibold text-indigo-400">{formatCurrency(c.lifetime_value)}</td>
                  <td className="py-3 text-sm text-gray-400">{formatCurrency(c.avg_order_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};

export default Reports;
