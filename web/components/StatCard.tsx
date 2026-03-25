interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary: 'border-l-primary bg-primary-light',
  success: 'border-l-success bg-green-50',
  warning: 'border-l-warning bg-orange-50',
  danger: 'border-l-danger bg-red-50',
};

const valueColorMap = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export default function StatCard({ label, value, sub, color = 'primary' }: StatCardProps) {
  return (
    <div className={`card border-l-4 ${colorMap[color]}`}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueColorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}
