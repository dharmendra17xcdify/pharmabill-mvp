export const PAYMENT_MODES = ['Cash', 'UPI', 'Card'] as const;
export type PaymentMode = typeof PAYMENT_MODES[number];

export const LOW_STOCK_THRESHOLD = 5;

export const GST_RATES = [0, 5, 12, 18, 28];

export const MEDICINE_CATEGORIES = [
  'Medicine',
  'General',
  'Surgical',
  'Cosmetic',
  'Ayurvedic',
  'Homeopathic',
  'Veterinary',
  'Equipment',
  'Other',
] as const;

export const COLORS = {
  primary: '#1565C0',
  primaryLight: '#E3F2FD',
  secondary: '#00897B',
  danger: '#D32F2F',
  warning: '#F57C00',
  success: '#388E3C',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
};
