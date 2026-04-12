'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Supplier } from '@/types/supplier';
import Pagination from '@/components/Pagination';
import SortableHeader, { SortDir } from '@/components/SortableHeader';

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/suppliers');
    setSuppliers(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    setDeleting(id);
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
    await load();
    setDeleting(null);
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.gstin.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let av: any, bv: any;
    switch (sortField) {
      case 'name':  av = a.name.toLowerCase();  bv = b.name.toLowerCase(); break;
      case 'phone': av = a.phone;               bv = b.phone; break;
      case 'gstin': av = a.gstin;               bv = b.gstin; break;
      default: return 0;
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const paged = pageSize === 0 ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Supplier Master</h2>
        <Link href="/suppliers/add" className="btn-primary text-sm">+ Add Supplier</Link>
      </div>

      <div className="card">
        <input
          className="input mb-4"
          placeholder="Search by name, phone, GSTIN…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {search ? 'No suppliers match your search.' : 'No suppliers yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <SortableHeader label="Name"         field="name"  current={sortField} dir={sortDir} onSort={handleSort} className="rounded-tl" />
                  <SortableHeader label="Phone"        field="phone" current={sortField} dir={sortDir} onSort={handleSort} />
                  <SortableHeader label="GSTIN"        field="gstin" current={sortField} dir={sortDir} onSort={handleSort} />
                  <th className="table-header">Drug License</th>
                  <th className="table-header">Address</th>
                  <th className="table-header rounded-tr text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-800">{s.name}</td>
                    <td className="table-cell text-gray-600">{s.phone || '—'}</td>
                    <td className="table-cell text-gray-600">{s.gstin || '—'}</td>
                    <td className="table-cell text-gray-600">{s.drug_license || '—'}</td>
                    <td className="table-cell text-gray-500 max-w-[200px] truncate">{s.address || '—'}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => router.push(`/suppliers/${s.id}`)} className="text-xs text-primary hover:underline">Edit</button>
                        <button onClick={() => handleDelete(s.id!, s.name)} disabled={deleting === s.id} className="text-xs text-danger hover:underline disabled:opacity-40">
                          {deleting === s.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={sorted.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
      </div>
    </div>
  );
}
