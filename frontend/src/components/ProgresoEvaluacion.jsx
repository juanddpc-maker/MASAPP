import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import api from '../lib/api';
import { Select } from './ui';

const COLOR_TOTAL = '#185fa5';
const COLOR_GENERAL = '#0f766e';
const COLOR_PERSONAL = '#b45309';

function Dato({ etiqueta, valor, color }) {
  return (
    <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-center">
      <p className="text-lg font-semibold" style={{ color }}>{valor ?? '-'}</p>
      <p className="text-[11px] text-gray-500">{etiqueta}</p>
    </div>
  );
}

// Progreso de evaluaciones mensuales: radar del periodo elegido + evolución del promedio mes a mes.
export default function ProgresoEvaluacion({ alumnoId, grande = false }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [periodoId, setPeriodoId] = useState('');

  useEffect(() => {
    setCargando(true);
    api.get(`/evaluacion-mensual/alumno/${alumnoId}`)
      .then((res) => {
        setEvaluaciones(res.data);
        setPeriodoId(res.data.length ? res.data[res.data.length - 1].periodoId : '');
      })
      .catch(() => setError('No se pudo cargar la evaluación'))
      .finally(() => setCargando(false));
  }, [alumnoId]);

  if (cargando) return <p className="text-sm text-gray-400">Cargando evaluaciones...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const titulo = <p className="text-sm font-medium text-gray-700 mb-2">Evaluación de habilidades</p>;
  if (evaluaciones.length === 0) {
    return (
      <div className="pt-2 border-t border-gray-100">
        {titulo}
        <p className="text-sm text-gray-400">Sin evaluaciones mensuales todavía. Se capturan en el menú Evaluaciones.</p>
      </div>
    );
  }

  const actual = evaluaciones.find((e) => e.periodoId === periodoId) || evaluaciones[evaluaciones.length - 1];
  const radar = actual.valores.map((v) => ({ nombre: v.alcance === 'PERSONAL' ? `${v.nombre} ★` : v.nombre, valor: v.valor }));
  const hayPersonales = evaluaciones.some((e) => e.promedioPersonal !== null);
  const linea = evaluaciones.map((e) => ({
    periodo: e.periodo,
    Promedio: e.promedio,
    Generales: e.promedioGeneral,
    Personales: e.promedioPersonal,
  }));

  return (
    <div className="pt-2 border-t border-gray-100 space-y-3">
      <div className="flex items-center justify-between gap-3">
        {titulo}
        <Select value={actual.periodoId} onChange={(e) => setPeriodoId(e.target.value)} className="!py-1 !w-auto text-xs">
          {[...evaluaciones].reverse().map((e) => <option key={e.periodoId} value={e.periodoId}>{e.periodo}</option>)}
        </Select>
      </div>

      <div className="flex gap-2">
        <Dato etiqueta="Promedio" valor={actual.promedio} color={COLOR_TOTAL} />
        <Dato etiqueta="Generales" valor={actual.promedioGeneral} color={COLOR_GENERAL} />
        {hayPersonales && <Dato etiqueta="Personales ★" valor={actual.promedioPersonal} color={COLOR_PERSONAL} />}
      </div>

      {radar.length >= 3 ? (
        <ResponsiveContainer width="100%" height={grande ? 400 : 230}>
          <RadarChart data={radar} outerRadius={grande ? '75%' : '70%'}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="nombre" tick={{ fontSize: grande ? 13 : 11, fill: '#374151' }} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#9ca3af' }} tickCount={6} />
            <Radar dataKey="valor" stroke={COLOR_TOTAL} fill={COLOR_TOTAL} fillOpacity={0.3} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="space-y-1">
          {radar.map((r) => (
            <div key={r.nombre} className="flex justify-between text-sm"><span className="text-gray-600">{r.nombre}</span><span className="font-medium">{r.valor}/10</span></div>
          ))}
        </div>
      )}

      {actual.notas && <p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2"><span className="font-medium">Notas:</span> {actual.notas}</p>}

      {evaluaciones.length > 1 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">Progreso mes a mes</p>
          <ResponsiveContainer width="100%" height={grande ? 300 : 200}>
            <LineChart data={linea} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Promedio" stroke={COLOR_TOTAL} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="Generales" stroke={COLOR_GENERAL} strokeWidth={1.5} dot={{ r: 2 }} connectNulls />
              {hayPersonales && <Line type="monotone" dataKey="Personales" stroke={COLOR_PERSONAL} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2 }} connectNulls />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
