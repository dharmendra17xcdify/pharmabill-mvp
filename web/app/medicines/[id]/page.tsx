'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { medicineSchema, MedicineFormData } from '@/utils/validators';
import { useMedicineStore } from '@/store/useMedicineStore';
import { GST_RATES } from '@/constants/paymentModes';

export default function EditMedicinePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { updateMedicine, deleteMedicine, medicines, loadMedicines } = useMedicineStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MedicineFormData>({ resolver: zodResolver(medicineSchema) });

  useEffect(() => {
    if (medicines.length === 0) loadMedicines();
  }, []);

  useEffect(() => {
    const m = medicines.find(x => x.id === id);
    if (m) {
      reset({
        name: m.name,
        generic_name: m.generic_name,
        batch_no: m.batch_no,
        expiry_month: m.expiry_month ?? undefined,
        expiry_year: m.expiry_year ?? undefined,
        mrp: m.mrp,
        selling_price: m.selling_price,
        gst_percent: m.gst_percent,
        stock_qty: m.stock_qty,
      });
    }
  }, [medicines, id]);

  const onSubmit = async (data: MedicineFormData) => {
    await updateMedicine({
      id,
      ...data,
      generic_name: data.generic_name ?? '',
      batch_no: data.batch_no ?? '',
      expiry_month: data.expiry_month ?? null,
      expiry_year: data.expiry_year ?? null,
    });
    router.push('/medicines');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this medicine?')) return;
    await deleteMedicine(id);
    router.push('/medicines');
  };

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-primary hover:underline text-sm">← Back</button>
        <h2 className="text-xl font-bold text-gray-800">Edit Medicine</h2>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Medicine Name *</label>
            <input className="input" {...register('name')} />
            {errors.name && <p className="error-text">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Generic Name</label>
            <input className="input" {...register('generic_name')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Batch No.</label>
              <input className="input" {...register('batch_no')} />
            </div>
            <div>
              <label className="label">GST %</label>
              <select className="input" {...register('gst_percent')}>
                {GST_RATES.map(r => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Expiry Month</label>
              <input className="input" type="number" min={1} max={12} {...register('expiry_month')} />
            </div>
            <div>
              <label className="label">Expiry Year</label>
              <input className="input" type="number" min={2020} max={2050} {...register('expiry_year')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">MRP (₹) *</label>
              <input className="input" type="number" step="0.01" {...register('mrp')} />
              {errors.mrp && <p className="error-text">{errors.mrp.message}</p>}
            </div>
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input className="input" type="number" step="0.01" {...register('selling_price')} />
              {errors.selling_price && <p className="error-text">{errors.selling_price.message}</p>}
            </div>
            <div>
              <label className="label">Stock Qty</label>
              <input className="input" type="number" min={0} {...register('stock_qty')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn-danger" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
