'use client';

export type SortDir = 'asc' | 'desc';

interface Props {
  label: string;
  field: string;
  current: string;
  dir: SortDir;
  onSort: (field: string) => void;
  className?: string;
}

export default function SortableHeader({ label, field, current, dir, onSort, className = '' }: Props) {
  const active = current === field;
  return (
    <th
      className={`table-header cursor-pointer select-none hover:bg-gray-100 ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-xs ${active ? 'text-primary' : 'text-gray-300'}`}>
          {active ? (dir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  );
}
