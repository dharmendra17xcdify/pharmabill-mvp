'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { settingsSchema, SettingsFormData } from '@/utils/validators';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function SettingsPage() {
  const { settings, loadSettings, saveSettings } = useSettingsStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { invoice_prefix: 'MED' },
  });

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    if (settings) {
      reset({
        store_name: settings.store_name,
        owner_name: settings.owner_name,
        phone: settings.phone,
        address: settings.address,
        gstin: settings.gstin,
        drug_license: settings.drug_license,
        invoice_prefix: settings.invoice_prefix,
      });
    }
  }, [settings]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      await saveSettings(data as import('@/types/settings').StoreSettings);
      alert('Settings saved successfully.');
      reset(data);
    } catch {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="max-w-lg space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Settings</h2>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Store Information</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Store Name *</label>
            <input className="input" {...register('store_name')} />
            {errors.store_name && <p className="error-text">{errors.store_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Owner Name</label>
              <input className="input" {...register('owner_name')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" {...register('phone')} />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} {...register('address')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GSTIN</label>
              <input className="input" {...register('gstin')} />
            </div>
            <div>
              <label className="label">Drug License No.</label>
              <input className="input" {...register('drug_license')} />
            </div>
          </div>

          <div>
            <label className="label">Invoice Prefix *</label>
            <input className="input" {...register('invoice_prefix')} />
            {errors.invoice_prefix && <p className="error-text">{errors.invoice_prefix.message}</p>}
            <p className="text-xs text-gray-400 mt-1">e.g. "MED" → bills numbered MED-0001, MED-0002…</p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
