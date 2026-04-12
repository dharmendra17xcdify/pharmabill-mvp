'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', gstin: '', drug_license: '', phone: '', email: '', address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Supplier name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push('/suppliers');
    } catch (err: any) {
      alert(err.message || 'Failed to save supplier');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-primary hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">Add Supplier</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Supplier Name *</label>
            <input className="input" placeholder="e.g. ABC Pharma Distributors" value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="Contact number" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GSTIN</label>
              <input className="input" placeholder="e.g. 07AAAAA0000A1Z5" value={form.gstin} onChange={e => set('gstin', e.target.value)} />
            </div>
            <div>
              <label className="label">Drug License No.</label>
              <input className="input" placeholder="e.g. DL-UP-12345" value={form.drug_license} onChange={e => set('drug_license', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={3} placeholder="Full address" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save Supplier'}
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
