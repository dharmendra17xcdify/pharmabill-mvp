'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { medicineSchema, MedicineFormData } from '@/utils/validators';
import { useMedicineStore } from '@/store/useMedicineStore';
import { GST_RATES } from '@/constants/paymentModes';

export default function AddMedicinePage() {
  const router = useRouter();
  const { addMedicine } = useMedicineStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema) as any,
    defaultValues: { gst_percent: 0, stock_qty: 0, rate: 0, discount: 0, packing_qty: 1 },
  });

  const onSubmit = async (data: MedicineFormData) => {
    await addMedicine({
      ...data,
      generic_name:     data.generic_name     ?? '',
      batch_no:         data.batch_no         ?? '',
      expiry_month:     data.expiry_month      ?? null,
      expiry_year:      data.expiry_year       ?? null,
      packing:          data.packing           ?? '',
      packing_qty:      data.packing_qty       ?? 1,
      hsn:              data.hsn               ?? '',
      rate:             data.rate              ?? 0,
      discount:         data.discount          ?? 0,
      manufacture_name: data.manufacture_name  ?? '',
      group:            data.group             ?? '',
    });
    router.push('/medicines');
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-primary hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">Add Item</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* ── Medicine Catalogue ─────────────────────────────────────────── */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item Details</p>

          <div>
            <label className="label">Item Name *</label>
            <input className="input" placeholder="e.g. Paracetamol 500mg" {...register('name')} />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Generic Name</label>
            <input className="input" placeholder="e.g. Acetaminophen" {...register('generic_name')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Manufacture Name</label>
              <input className="input" placeholder="e.g. Cipla Ltd" {...register('manufacture_name')} />
            </div>
            <div>
              <label className="label">Group</label>
              <input className="input" placeholder="e.g. Antibiotic" {...register('group')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Packing</label>
              <input className="input" placeholder="e.g. Strip of 10" {...register('packing')} />
            </div>
            <div>
              <label className="label">Units / Pack</label>
              <input className="input" type="number" min={1} placeholder="1" {...register('packing_qty')} />
              {errors.packing_qty && <p className="error-text">{errors.packing_qty.message}</p>}
            </div>
            <div>
              <label className="label">HSN Code</label>
              <input className="input" placeholder="e.g. 30049099" {...register('hsn')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GST %</label>
              <select className="input" {...register('gst_percent')}>
                {GST_RATES.map(r => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── First Batch ────────────────────────────────────────────────── */}
          <div className="border-t pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              First Batch (optional — add later via Purchase Order)
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Batch No.</label>
                <input className="input" placeholder="Batch number" {...register('batch_no')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Expiry MM</label>
                  <input className="input" type="number" min={1} max={12} placeholder="MM" {...register('expiry_month')} />
                  {errors.expiry_month && <p className="error-text">{errors.expiry_month.message}</p>}
                </div>
                <div>
                  <label className="label">Expiry YYYY</label>
                  <input className="input" type="number" min={2020} max={2050} placeholder="YYYY" {...register('expiry_year')} />
                  {errors.expiry_year && <p className="error-text">{errors.expiry_year.message}</p>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="label">MRP (₹) *</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" {...register('mrp')} />
                {errors.mrp && <p className="error-text">{errors.mrp.message}</p>}
              </div>
              <div>
                <label className="label">Selling Price (₹) *</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" {...register('selling_price')} />
                {errors.selling_price && <p className="error-text">{errors.selling_price.message}</p>}
              </div>
              <div>
                <label className="label">Purchase Rate (₹)</label>
                <input className="input" type="number" step="0.01" placeholder="0.00" {...register('rate')} />
                {errors.rate && <p className="error-text">{errors.rate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label">Discount %</label>
                <input className="input" type="number" step="0.01" min={0} max={100} placeholder="0.00" {...register('discount')} />
                {errors.discount && <p className="error-text">{errors.discount.message}</p>}
              </div>
              <div>
                <label className="label">Stock Qty</label>
                <input className="input" type="number" min={0} placeholder="0" {...register('stock_qty')} />
                {errors.stock_qty && <p className="error-text">{errors.stock_qty.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Item'}
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
