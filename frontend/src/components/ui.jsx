import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    danger: 'bg-white border border-red-200 text-red-600 hover:bg-red-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10 bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((col) => (
              <th key={col} className="text-left font-medium text-gray-500 px-4 py-3">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">{children}</tbody>
      </table>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-10 h-10 text-gray-300 mb-3" strokeWidth={1.5} />}
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// Selector de hora en formato 12h (hora, minuto, AM/PM). Expone/recibe un string "HH:MM" en 24h.
export function TimeSelect({ value, onChange }) {
  const [h24, m] = (value || '08:00').split(':').map(Number);
  const periodo = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

  function actualizar(nuevoH12, nuevoM, nuevoPeriodo) {
    let h = nuevoH12 % 12;
    if (nuevoPeriodo === 'PM') h += 12;
    onChange(`${String(h).padStart(2, '0')}:${String(nuevoM).padStart(2, '0')}`);
  }

  return (
    <div className="flex gap-1.5">
      <select className="px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white" value={h12} onChange={(e) => actualizar(Number(e.target.value), m, periodo)}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
      <select className="px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white" value={m} onChange={(e) => actualizar(h12, Number(e.target.value), periodo)}>
        {[0, 15, 30, 45].map((min) => <option key={min} value={min}>{String(min).padStart(2, '0')}</option>)}
      </select>
      <select className="px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white" value={periodo} onChange={(e) => actualizar(h12, m, e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

// Convierte "HH:MM" (24h) a texto legible "5:00 PM"
export function formatHora12(hora24) {
  if (!hora24) return '';
  const [h, m] = hora24.split(':').map(Number);
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
}

export function CintaVisual({ color1, color2, color3, width = 56, height = 18 }) {
  if (!color1) return null;
  const segAncho = (width - 2) / 3;
  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <rect x={1} y={1} width={segAncho} height={height - 2} fill={color1} />
      <rect x={1 + segAncho} y={1} width={segAncho} height={height - 2} fill={color2} />
      <rect x={1 + segAncho * 2} y={1} width={segAncho} height={height - 2} fill={color3} />
      <rect x={0.5} y={0.5} width={width - 1} height={height - 1} fill="none" stroke="#111827" strokeWidth={1} rx={2} />
    </svg>
  );
}

function polarToCartesian(cx, cy, r, angleGrados) {
  const rad = ((angleGrados - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArc, 1, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', rInner, rInner, 0, largeArc, 0, endInner.x, endInner.y,
    'Z',
  ].join(' ');
}

function describeArcLine(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

// Dona donde cada rebanada usa el color base de la cinta (color1), y si tiene
// un color de acento distinto (color2, ej. la franja amarilla del medio),
// dibuja una línea curva encima — así "Blanco con Amarillo" se ve blanco
// con una línea amarilla, en vez de perderse contra el fondo.
export function CintaDonut({ segmentos, size = 150 }) {
  const total = segmentos.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter * 0.55;
  const rMid = (rOuter + rInner) / 2;
  const gap = 2;
  let acumulado = 0;

  return (
    <svg width={size} height={size}>
      {segmentos.map((s, i) => {
        const anguloTotal = (s.value / total) * 360;
        const start = acumulado + gap / 2;
        const end = acumulado + anguloTotal - gap / 2;
        acumulado += anguloTotal;
        const base = s.color1 || '#e5e7eb';
        const acento = s.color2 && s.color2.toUpperCase() !== base.toUpperCase() ? s.color2 : null;
        return (
          <g key={i}>
            <title>{`${s.name}: ${s.value}`}</title>
            <path d={describeDonutSegment(cx, cy, rOuter, rInner, start, end)} fill={base} stroke="#111827" strokeWidth={1} />
            {acento && (
              <path d={describeArcLine(cx, cy, rMid, start, end)} stroke={acento} strokeWidth={3} fill="none" strokeLinecap="round" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const DIAS_SEMANA = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
export const DIAS_LABEL = { LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue', VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom' };

export function DiasSemanaSelect({ selected, onChange }) {
  function toggle(dia) {
    onChange(selected.includes(dia) ? selected.filter((d) => d !== dia) : [...selected, dia]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {DIAS_SEMANA.map((dia) => (
        <button
          type="button"
          key={dia}
          onClick={() => toggle(dia)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
            selected.includes(dia) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'
          }`}
        >
          {DIAS_LABEL[dia]}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// Modal simple con overlay. Cierra al hacer click fuera o en el botón X.
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-medium text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// Dropdown con búsqueda y selección múltiple (ej. seleccionar tutores de un alumno)
export function MultiSelectSearch({ options, selected, onChange, placeholder = 'Buscar...' }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtradas = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const seleccionadas = options.filter((o) => selected.includes(o.id));

  function toggle(id) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full min-h-[38px] px-2 py-1.5 border border-gray-300 rounded-lg flex flex-wrap gap-1 items-center cursor-text"
        onClick={() => setOpen(true)}
      >
        {seleccionadas.map((o) => (
          <span key={o.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md">
            {o.label}
            <button type="button" onClick={(e) => { e.stopPropagation(); toggle(o.id); }} className="text-gray-400 hover:text-gray-700">×</button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[100px] text-sm outline-none px-1"
          placeholder={seleccionadas.length === 0 ? placeholder : ''}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtradas.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
          ) : (
            filtradas.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => toggle(o.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${selected.includes(o.id) ? 'bg-gray-50 font-medium' : ''}`}
              >
                {selected.includes(o.id) ? '✓ ' : ''}{o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
