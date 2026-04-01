'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { settingsSchema, SettingsFormData } from '@/utils/validators';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function SetupPage() {
  const router = useRouter();
  const { saveSettings } = useSettingsStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: { invoice_prefix: 'MED' },
  });

  const onSubmit = async (data: SettingsFormData) => {
    await saveSettings(data as import('@/types/settings').StoreSettings);
    router.push('/');
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="card">
        <h2 className="text-xl font-bold text-primary mb-1">Welcome to PharmaBill</h2>
        <p className="text-gray-500 text-sm mb-6">Set up your pharmacy details to get started.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Store Name *</label>
            <input className="input" placeholder="e.g. City Pharmacy" {...register('store_name')} />
            {errors.store_name && <p className="error-text">{errors.store_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Owner Name</label>
              <input className="input" placeholder="Owner's name" {...register('owner_name')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 XXXXX XXXXX" {...register('phone')} />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} placeholder="Store address" {...register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GSTIN</label>
              <input className="input" placeholder="GST number" {...register('gstin')} />
            </div>
            <div>
              <label className="label">Drug License No.</label>
              <input className="input" placeholder="License number" {...register('drug_license')} />
            </div>
          </div>

          <div>
            <label className="label">Invoice Prefix *</label>
            <input className="input" placeholder="e.g. MED" {...register('invoice_prefix')} />
            {errors.invoice_prefix && <p className="error-text">{errors.invoice_prefix.message}</p>}
            <p className="text-xs text-gray-400 mt-1">Bills will be numbered as MED-0001, MED-0002, …</p>
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save & Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
