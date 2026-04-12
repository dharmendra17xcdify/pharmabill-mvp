'use client';
import { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import Pagination from '@/components/Pagination';
import { formatINR } from '@/utils/currency';
import { formatExpiry, isExpired, isExpiringSoon } from '@/utils/date';
import { Medicine } from '@/types/medicine';
import type { StockProfitReport } from '@/app/api/reports/stock-profit/route';


interface ReportData {
  today: { total: number; count: number };
  month: { total: number; count: number };
  lowStockCount: number;
  lowStockMedicines: Medicine[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [stockProfit, setStockProfit] = useState<StockProfitReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [spLoading, setSpLoading] = useState(true);
  const [stockSearch, setStockSearch] = useState('');
  const [profitSearch, setProfitSearch] = useState('');
  const [profitSort, setProfitSort] = useState<'profit' | 'sales' | 'margin'>('profit');
  const [stockPage, setStockPage] = useState(1);
  const [profitPage, setProfitPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));

    fetch('/api/reports/stock-profit')
      .then(r => r.json())
      .then(setStockProfit)
      .finally(() => setSpLoading(false));
  }, []);

  useEffect(() => { setStockPage(1); }, [stockSearch]);
  useEffect(() => { setProfitPage(1); }, [profitSearch, profitSort]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const filteredStock = (stockProfit?.stock ?? []).filter(i =>
    i.name.toLowerCase().includes(stockSearch.toLowerCase())
  );
  const pagedStock = pageSize === 0 ? filteredStock : filteredStock.slice((stockPage - 1) * pageSize, stockPage * pageSize);

  const filteredProfit = (stockProfit?.profit ?? [])
    .filter(i => i.medicine_name.toLowerCase().includes(profitSearch.toLowerCase()))
    .sort((a, b) => {
      if (profitSort === 'sales')  return b.total_sales - a.total_sales;
      if (profitSort === 'margin') return b.margin_pct - a.margin_pct;
      return b.profit - a.profit;
    });
  const pagedProfit = pageSize === 0 ? filteredProfit : filteredProfit.slice((profitPage - 1) * pageSize, profitPage * pageSize);

  const lowStockMedicines = data?.lowStockMedicines ?? [];
  const pagedLowStock = pageSize === 0 ? lowStockMedicines : lowStockMedicines.slice((lowStockPage - 1) * pageSize, lowStockPage * pageSize);

  const t = stockProfit?.totals;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Reports</h2>

      {/* ── Sales Summary ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sales Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Revenue" value={formatINR(data?.today?.total ?? 0)} sub={`${data?.today?.count ?? 0} bill(s)`} color="primary" />
          <StatCard label="Today's Bills" value={String(data?.today?.count ?? 0)} color="primary" />
          <StatCard label="Month Revenue" value={formatINR(data?.month?.total ?? 0)} sub={`${data?.month?.count ?? 0} bill(s)`} color="success" />
          <StatCard label="Month Bills" value={String(data?.month?.count ?? 0)} color="success" />
        </div>
      </div>

      {/* ── Stock Valuation ───────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stock Valuation</h3>

        {/* Summary cards */}
        {!spLoading && t && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Items in Stock" value={String(filteredStock.length || stockProfit?.stock.length || 0)} color="primary" />
            <StatCard label="Stock Value (Cost)" value={formatINR(t.total_stock_value_cost)} sub="at purchase rate" color="primary" />
            <StatCard label="Stock Value (MRP)" value={formatINR(t.total_stock_value_selling)} sub="at selling price" color="success" />
            <StatCard
              label="Unrealised Gain"
              value={formatINR(t.total_stock_value_selling - t.total_stock_value_cost)}
              sub="if all stock sold"
              color="success"
            />
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-700">Item-wise Stock Value</p>
            <input
              className="input text-sm w-56"
              placeholder="Search item…"
              value={stockSearch}
              onChange={e => setStockSearch(e.target.value)}
            />
          </div>

          {spLoading ? (
            <p className="text-center text-gray-400 py-6 text-sm">Loading…</p>
          ) : filteredStock.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">No stock data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl">Item</th>
                    <th className="table-header text-right">Qty in Stock</th>
                    <th className="table-header text-right">Purchase Rate</th>
                    <th className="table-header text-right">Selling Price</th>
                    <th className="table-header text-right">Value at Cost</th>
                    <th className="table-header text-right rounded-tr">Value at Selling</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStock.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{item.name}</td>
                      <td className="table-cell text-right">{item.total_stock}</td>
                      <td className="table-cell text-right text-gray-600">{formatINR(item.avg_purchase_rate)}</td>
                      <td className="table-cell text-right text-gray-600">{formatINR(item.avg_selling_price)}</td>
                      <td className="table-cell text-right font-medium">{formatINR(item.stock_value_at_cost)}</td>
                      <td className="table-cell text-right font-medium text-success">{formatINR(item.stock_value_at_selling)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t font-bold">
                    <td className="px-4 py-2 text-gray-700" colSpan={4}>Total</td>
                    <td className="px-4 py-2 text-right text-gray-800">
                      {formatINR(filteredStock.reduce((s, i) => s + i.stock_value_at_cost, 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-success">
                      {formatINR(filteredStock.reduce((s, i) => s + i.stock_value_at_selling, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {filteredStock.length > 0 && (
            <Pagination total={filteredStock.length} page={stockPage} pageSize={pageSize} onPageChange={setStockPage} onPageSizeChange={size => { setPageSize(size); setStockPage(1); setProfitPage(1); setLowStockPage(1); }} />
          )}
        </div>
      </div>

      {/* ── Item-wise Profit ──────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Item-wise Profit</h3>

        {!spLoading && t && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Sales" value={formatINR(t.total_sales)} sub="incl. GST" color="primary" />
            <StatCard label="Total COGS" value={formatINR(t.total_cogs)} sub="cost of goods sold" color="primary" />
            <StatCard label="Gross Profit" value={formatINR(t.total_profit)} color="success" />
            <StatCard
              label="Overall Margin"
              value={t.total_sales > 0 ? `${((t.total_profit / t.total_sales) * 100).toFixed(1)}%` : '—'}
              color={t.total_profit >= 0 ? 'success' : 'danger'}
            />
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-700">Item-wise Profit from Sales</p>
            <div className="flex items-center gap-2">
              <select
                className="input text-sm w-36"
                value={profitSort}
                onChange={e => setProfitSort(e.target.value as any)}
              >
                <option value="profit">Sort: Profit</option>
                <option value="sales">Sort: Sales</option>
                <option value="margin">Sort: Margin %</option>
              </select>
              <input
                className="input text-sm w-48"
                placeholder="Search item…"
                value={profitSearch}
                onChange={e => setProfitSearch(e.target.value)}
              />
            </div>
          </div>

          {spLoading ? (
            <p className="text-center text-gray-400 py-6 text-sm">Loading…</p>
          ) : filteredProfit.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">No sales data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="table-header rounded-tl">Item</th>
                    <th className="table-header text-right">Qty Sold</th>
                    <th className="table-header text-right">Avg Purchase Rate</th>
                    <th className="table-header text-right">Sales Revenue</th>
                    <th className="table-header text-right">COGS</th>
                    <th className="table-header text-right">Gross Profit</th>
                    <th className="table-header text-right rounded-tr">Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedProfit.map((item, idx) => (
                    <tr key={`${item.medicine_id}-${idx}`} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{item.medicine_name}</td>
                      <td className="table-cell text-right">{item.total_qty_sold}</td>
                      <td className="table-cell text-right text-gray-500">{formatINR(item.avg_purchase_rate)}</td>
                      <td className="table-cell text-right">{formatINR(item.total_sales)}</td>
                      <td className="table-cell text-right text-gray-600">{formatINR(item.cogs)}</td>
                      <td className={`table-cell text-right font-semibold ${item.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatINR(item.profit)}
                      </td>
                      <td className="table-cell text-right">
                        <span className={`badge ${
                          item.margin_pct >= 20 ? 'bg-green-100 text-success'
                          : item.margin_pct >= 10 ? 'bg-yellow-100 text-warning'
                          : 'bg-red-100 text-danger'
                        }`}>
                          {item.margin_pct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t font-bold">
                    <td className="px-4 py-2 text-gray-700" colSpan={3}>Total</td>
                    <td className="px-4 py-2 text-right text-gray-800">
                      {formatINR(filteredProfit.reduce((s, i) => s + i.total_sales, 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {formatINR(filteredProfit.reduce((s, i) => s + i.cogs, 0))}
                    </td>
                    <td className="px-4 py-2 text-right text-success">
                      {formatINR(filteredProfit.reduce((s, i) => s + i.profit, 0))}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(() => {
                        const ts = filteredProfit.reduce((s, i) => s + i.total_sales, 0);
                        const tp = filteredProfit.reduce((s, i) => s + i.profit, 0);
                        return ts > 0 ? `${((tp / ts) * 100).toFixed(1)}%` : '—';
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {filteredProfit.length > 0 && (
            <Pagination total={filteredProfit.length} page={profitPage} pageSize={pageSize} onPageChange={setProfitPage} onPageSizeChange={size => { setPageSize(size); setStockPage(1); setProfitPage(1); setLowStockPage(1); }} />
          )}
        </div>
      </div>

      {/* ── Top 20 Selling Items ──────────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">Top 20 Selling Items</h3>
        {!stockProfit ? (
          <p className="text-center text-gray-400 py-6 text-sm">Loading…</p>
        ) : (stockProfit.topSellers ?? []).length === 0 ? (
          <p className="text-center text-gray-400 py-6 text-sm">No sales data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl" style={{ width: 36 }}>#</th>
                  <th className="table-header">Item</th>
                  <th className="table-header text-right" style={{ width: 120 }}>Qty Sold</th>
                  <th className="table-header text-right rounded-tr" style={{ width: 140 }}>Sales Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(stockProfit.topSellers ?? []).map((item, idx) => (
                  <tr key={`${item.medicine_id}-${idx}`} className="hover:bg-gray-50">
                    <td className="table-cell text-center text-gray-400 font-medium">{idx + 1}</td>
                    <td className="table-cell font-medium">{item.medicine_name}</td>
                    <td className="table-cell text-right font-semibold text-primary">{item.total_qty_sold}</td>
                    <td className="table-cell text-right">{formatINR(item.total_sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Low Stock ─────────────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-3">
          Low Stock Items
          <span className={`ml-2 badge ${(data?.lowStockCount ?? 0) > 0 ? 'bg-orange-100 text-warning' : 'bg-green-100 text-success'}`}>
            {data?.lowStockCount ?? 0}
          </span>
        </h3>

        {(data?.lowStockMedicines?.length ?? 0) === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">All items have adequate stock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="table-header rounded-tl">Item</th>
                  <th className="table-header">Batch</th>
                  <th className="table-header">Expiry</th>
                  <th className="table-header text-right">MRP</th>
                  <th className="table-header text-right rounded-tr">Stock</th>
                </tr>
              </thead>
              <tbody>
                {pagedLowStock.map(m => {
                  const expired = isExpired(m.expiry_month, m.expiry_year);
                  const expiring = isExpiringSoon(m.expiry_month, m.expiry_year);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="font-medium">{m.name}</div>
                        {m.generic_name && <div className="text-gray-400 text-xs">{m.generic_name}</div>}
                      </td>
                      <td className="table-cell text-gray-500">{m.batch_no || '—'}</td>
                      <td className="table-cell">
                        {m.expiry_month ? (
                          <span className={expired ? 'text-danger font-medium' : expiring ? 'text-warning font-medium' : ''}>
                            {formatExpiry(m.expiry_month, m.expiry_year)}
                            {expired ? ' (Expired)' : expiring ? ' (Soon)' : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="table-cell text-right">{formatINR(Number(m.mrp))}</td>
                      <td className="table-cell text-right">
                        <span className="badge bg-orange-100 text-warning font-bold">{m.stock_qty}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {lowStockMedicines.length > 0 && (
          <Pagination total={lowStockMedicines.length} page={lowStockPage} pageSize={pageSize} onPageChange={setLowStockPage} onPageSizeChange={size => { setPageSize(size); setStockPage(1); setProfitPage(1); setLowStockPage(1); }} />
        )}
      </div>
    </div>
  );
}
