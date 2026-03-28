import { getSettings } from '@/lib/settingsRepo';

export default async function Header() {
  let storeName = 'PharmaBill';
  try {
    const settings = await getSettings();
    if (settings?.store_name) storeName = settings.store_name;
  } catch {
    // DB not ready yet — fall back to default
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-primary shadow-md flex items-center px-6 gap-4">
      <div className="w-56 shrink-0" /> {/* spacer matching sidebar width */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-white font-bold text-lg tracking-wide">{storeName}</span>
        <span className="text-white/50 text-sm hidden sm:inline">·</span>
        <span className="text-white/60 text-sm hidden sm:inline">Pharmacy Billing</span>
      </div>
    </header>
  );
}
