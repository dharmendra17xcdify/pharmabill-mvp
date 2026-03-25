import dayjs from 'dayjs';

export function formatDate(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY, hh:mm A');
}

export function formatDateShort(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY');
}

export function formatExpiry(month: number | null, year: number | null): string {
  if (!month || !year) return '';
  return `${String(month).padStart(2, '0')}/${year}`;
}

export function isExpired(month: number | null, year: number | null): boolean {
  if (!month || !year) return false;
  const expiry = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month');
  return expiry.isBefore(dayjs());
}

export function isExpiringSoon(month: number | null, year: number | null): boolean {
  if (!month || !year) return false;
  const expiry = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month');
  return expiry.isBefore(dayjs().add(3, 'month')) && expiry.isAfter(dayjs());
}

export function nowISO(): string {
  return dayjs().toISOString();
}
