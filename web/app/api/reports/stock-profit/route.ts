import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export interface StockValueItem {
  id: number;
  name: string;
  total_stock: number;
  avg_purchase_rate: number;
  avg_selling_price: number;
  stock_value_at_cost: number;
  stock_value_at_selling: number;
}

export interface ProfitItem {
  medicine_id: number | null;
  medicine_name: string;
  total_qty_sold: number;
  total_sales: number;
  avg_purchase_rate: number;
  cogs: number;
  profit: number;
  margin_pct: number;
}

export interface TopSellerItem {
  medicine_id: number | null;
  medicine_name: string;
  total_qty_sold: number;
  total_sales: number;
}

export interface StockProfitReport {
  stock: StockValueItem[];
  profit: ProfitItem[];
  topSellers: TopSellerItem[];
  totals: {
    total_stock_value_cost: number;
    total_stock_value_selling: number;
    total_sales: number;
    total_cogs: number;
    total_profit: number;
  };
}

export async function GET() {
  try {
    const pool = await getPool();

    // ── Stock valuation per item (all batches with stock > 0) ──────────────
    const stockResult = await pool.request().query(`
      SELECT
        m.id,
        m.name,
        SUM(mb.stock_qty)                       AS total_stock,
        ROUND(AVG(CAST(mb.rate          AS FLOAT)), 2) AS avg_purchase_rate,
        ROUND(AVG(CAST(mb.selling_price AS FLOAT)), 2) AS avg_selling_price,
        ROUND(SUM(mb.stock_qty * mb.rate),          2) AS stock_value_at_cost,
        ROUND(SUM(mb.stock_qty * mb.selling_price), 2) AS stock_value_at_selling
      FROM medicines m
      JOIN medicine_batches mb ON mb.medicine_id = m.id
      GROUP BY m.id, m.name
      HAVING SUM(mb.stock_qty) > 0
      ORDER BY stock_value_at_cost DESC
    `);

    // ── Top 20 selling items by qty ───────────────────────────────────────
    const topSellersResult = await pool.request().query(`
      SELECT TOP 20
        bi.medicine_id,
        bi.medicine_name,
        SUM(bi.qty)                                 AS total_qty_sold,
        ROUND(SUM(CAST(bi.line_total AS FLOAT)), 2) AS total_sales
      FROM bill_items bi
      GROUP BY bi.medicine_id, bi.medicine_name
      ORDER BY total_qty_sold DESC
    `);

    // ── Item-wise profit from sales ────────────────────────────────────────
    // Revenue = sum(line_total) from bill_items
    // COGS    = qty_sold × avg purchase rate from medicine_batches
    const profitResult = await pool.request().query(`
      SELECT
        bi.medicine_id,
        bi.medicine_name,
        SUM(bi.qty)                                         AS total_qty_sold,
        ROUND(SUM(CAST(bi.line_total AS FLOAT)), 2)         AS total_sales,
        ROUND(ISNULL(AVG(CAST(mb_avg.avg_rate AS FLOAT)),0),2) AS avg_purchase_rate,
        ROUND(SUM(bi.qty) * ISNULL(AVG(CAST(mb_avg.avg_rate AS FLOAT)),0), 2) AS cogs,
        ROUND(
          SUM(CAST(bi.line_total AS FLOAT))
          - SUM(bi.qty) * ISNULL(AVG(CAST(mb_avg.avg_rate AS FLOAT)),0),
          2
        ) AS profit
      FROM bill_items bi
      LEFT JOIN (
        SELECT medicine_id, AVG(rate) AS avg_rate
        FROM medicine_batches
        GROUP BY medicine_id
      ) mb_avg ON mb_avg.medicine_id = bi.medicine_id
      GROUP BY bi.medicine_id, bi.medicine_name
      ORDER BY profit DESC
    `);

    const stock: StockValueItem[] = stockResult.recordset.map(r => ({
      id: r.id,
      name: r.name,
      total_stock: Number(r.total_stock),
      avg_purchase_rate: Number(r.avg_purchase_rate),
      avg_selling_price: Number(r.avg_selling_price),
      stock_value_at_cost: Number(r.stock_value_at_cost),
      stock_value_at_selling: Number(r.stock_value_at_selling),
    }));

    const profit: ProfitItem[] = profitResult.recordset.map(r => {
      const total_sales = Number(r.total_sales);
      const margin_pct = total_sales > 0 ? Math.round((Number(r.profit) / total_sales) * 10000) / 100 : 0;
      return {
        medicine_id: r.medicine_id,
        medicine_name: r.medicine_name,
        total_qty_sold: Number(r.total_qty_sold),
        total_sales,
        avg_purchase_rate: Number(r.avg_purchase_rate),
        cogs: Number(r.cogs),
        profit: Number(r.profit),
        margin_pct,
      };
    });

    const topSellers: TopSellerItem[] = topSellersResult.recordset.map(r => ({
      medicine_id: r.medicine_id,
      medicine_name: r.medicine_name,
      total_qty_sold: Number(r.total_qty_sold),
      total_sales: Number(r.total_sales),
    }));

    const totals = {
      total_stock_value_cost:    stock.reduce((s, i) => s + i.stock_value_at_cost, 0),
      total_stock_value_selling: stock.reduce((s, i) => s + i.stock_value_at_selling, 0),
      total_sales:  profit.reduce((s, i) => s + i.total_sales, 0),
      total_cogs:   profit.reduce((s, i) => s + i.cogs, 0),
      total_profit: profit.reduce((s, i) => s + i.profit, 0),
    };

    return NextResponse.json({ stock, profit, topSellers, totals } satisfies StockProfitReport);
  } catch (err) {
    console.error('GET /api/reports/stock-profit', err);
    return NextResponse.json({ error: 'Failed to load report' }, { status: 500 });
  }
}
