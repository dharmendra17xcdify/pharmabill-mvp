import Image from 'next/image';
import { getSettings } from '@/lib/settingsRepo';
import logo from '@/assets/logo.png';

export default async function Header() {
  let storeName = '';
  try {
    const settings = await getSettings();
    if (settings?.store_name) storeName = settings.store_name;
  } catch {}

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-blue-700 shadow flex items-center px-4 gap-3">
      <Image src={logo} alt="PharmaFlow" width={240} height={96} className="h-12 w-auto object-contain" />
      {storeName && (
        <span className="text-white font-bold text-sm border-l border-white/20 pl-3">{storeName}</span>
      )}
    </header>
  );
}
