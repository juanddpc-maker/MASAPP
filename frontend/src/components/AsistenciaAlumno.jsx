import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../lib/api';
import { Select } from './ui';

const COLOR_ASISTIO = '#0f766e';
const COLOR_RETARDO = '#d97706';
const COLOR_FALTA = '#b91c1c';

const etiquetaMes = (mes) =>
  new Date(`${mes}-01T00:00:00Z`).toLocaleDateString('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' });

function Dato({ etiqueta, valor, color, detalle }) {
  return (
    <div className="flex-1 min-w-[90px] bg-gray-50 rounded-lg px-3 py-2 text-center">
      <p className="text-xl font-semibold" style={{ color }}>{valor ?? '-'}</p>
      <p className="text-[11px] text-gray-500">{etiqueta}</p>
      {detalle && <p className="text-[10px] text-gray-400">{detalle}</p>}
    </div>
  );
}

// Asistencias, retardos y faltas del alumno por mes + porcentaje de los últimos 30 días.
export default function AsistenciaAlumno({ alumnoId, grande = false }) {
  const [meses, setMeses] = useState('6');
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setCargando(true);
    setError('');
    api.get(`/asistencia/resumen/${alumnoId}`, { params: { meses } })
      .then((r) => setDatos(r.data))
      .catch(() => setError('No se pudo cargar la asistencia'))
      .finally(() => setCargando(false));
  }, [alumnoId, meses]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (cargando && !datos) return <p className="text-sm text-gray-400">Cargando asistencia...</p>;
  if (!datos) return null;

  const { total, ultimos30 } = datos;
  const grafica = datos.meses.map((m) => ({ mes: etiquetaMes(m.mes), Asistió: m.presentes, Retardo: m.retardos, Falta: m.faltas }));
  const pct = ultimos30.porcentaje;
  const colorPct = pct === null ? '#6b7280' : pct >= 80 ? COLOR_ASISTIO : pct >= 60 ? COLOR_RETARDO : COLOR_FALTA;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700">Asistencia</p>
        <Select value={meses} onChange={(e) => setMeses(e.target.value)} className="!py-1 !w-auto text-xs">
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Últimos 12 meses</option>
        </Select>
      </div>

      {total.sesiones === 0 ? (
        <p className="text-sm text-gray-400">Todavía no hay clases registradas en este periodo.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Dato etiqueta="Últimos 30 días" valor={pct === null ? '-' : `${pct}%`} color={colorPct} detalle={pct === null ? 'sin clases' : `${ultimos30.asistencias} de ${ultimos30.sesiones} clases`} />
            <Dato etiqueta="Asistencias" valor={total.presentes} color={COLOR_ASISTIO} />
            <Dato etiqueta="Retardos" valor={total.retardos} color={COLOR_RETARDO} />
            <Dato etiqueta="Faltas" valor={total.faltas} color={COLOR_FALTA} />
          </div>

          <ResponsiveContainer width="100%" height={grande ? 300 : 220}>
            <BarChart data={grafica} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Asistió" stackId="a" fill={COLOR_ASISTIO} />
              <Bar dataKey="Retardo" stackId="a" fill={COLOR_RETARDO} />
              <Bar dataKey="Falta" stackId="a" fill={COLOR_FALTA} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-gray-400">El retardo cuenta como asistencia en el porcentaje. Una falta es una clase registrada en la que el alumno no quedó marcado.</p>
        </>
      )}
    </div>
  );
}
