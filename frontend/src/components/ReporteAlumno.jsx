import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import api from '../lib/api';
import { CintaVisual } from './ui';
import LineaCintas from './LineaCintas';

const AZUL = '#185fa5';
const VERDE = '#0f766e';
const AMBAR = '#d97706';
const OCRE = '#b45309';
const ROJO = '#b91c1c';

const ESTILOS = `
  .reporte-hoja, .reporte-hoja * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  @page { size: A4; margin: 14mm; }
  @media print {
    #root { display: none !important; }
    html, body { background: #fff !important; }
    .reporte-overlay { position: static !important; inset: auto !important; overflow: visible !important; background: #fff !important; padding: 0 !important; }
    .reporte-toolbar { display: none !important; }
    .reporte-hoja { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: auto !important; max-width: none !important; }
  }
`;

const fmtLarga = (f, utc = true) =>
  new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', ...(utc ? { timeZone: 'UTC' } : {}) });
const etiquetaMes = (mes) => new Date(`${mes}-01T00:00:00Z`).toLocaleDateString('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' });

function calcularEdad(f) {
  const hoy = new Date();
  const n = new Date(f);
  let e = hoy.getUTCFullYear() - n.getUTCFullYear();
  const m = hoy.getUTCMonth() - n.getUTCMonth();
  if (m < 0 || (m === 0 && hoy.getUTCDate() < n.getUTCDate())) e--;
  return e;
}

function esperarImagenes(raiz) {
  const imgs = [...(raiz?.querySelectorAll('img') || [])].filter((i) => !i.complete);
  if (imgs.length === 0) return Promise.resolve();
  const todas = Promise.all(imgs.map((i) => new Promise((ok) => { i.onload = ok; i.onerror = ok; })));
  return Promise.race([todas, new Promise((ok) => setTimeout(ok, 3000))]);
}

function Seccion({ titulo, children }) {
  return (
    <section className="mt-6 avoid-break">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200 pb-1 mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor, color }) {
  return (
    <div className="flex-1 min-w-[90px] rounded-lg px-3 py-2 text-center" style={{ background: '#f3f4f6' }}>
      <p className="text-xl font-semibold" style={{ color }}>{valor ?? '-'}</p>
      <p className="text-[11px] text-gray-500">{etiqueta}</p>
    </div>
  );
}

// Reporte profesional del alumno. Se muestra como "hoja" en pantalla y se imprime / guarda como PDF
// con el botón (en el cuadro de impresión elegir "Guardar como PDF").
export default function ReporteAlumno({ alumnoId, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const hojaRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get(`/alumnos/${alumnoId}`),
      api.get(`/evaluacion-mensual/alumno/${alumnoId}`),
      api.get(`/asistencia/resumen/${alumnoId}`, { params: { meses: 6 } }),
      api.get('/escuela').catch(() => ({ data: null })),
    ])
      .then(([a, ev, as, esc]) => setDatos({ alumno: a.data, evaluaciones: ev.data, asistencia: as.data, escuela: esc.data }))
      .catch(() => setError('No se pudo generar el reporte'));
  }, [alumnoId]);

  async function imprimir() {
    const tituloAnterior = document.title;
    document.title = `Reporte de progreso - ${datos.alumno.nombreCompleto} - ${new Date().toISOString().slice(0, 10)}`;
    await esperarImagenes(hojaRef.current);
    const restaurar = () => {
      document.title = tituloAnterior;
      window.removeEventListener('afterprint', restaurar);
    };
    window.addEventListener('afterprint', restaurar);
    window.print();
  }

  let hoja = null;
  if (datos) {
    const { alumno, evaluaciones, asistencia, escuela } = datos;
    const ultima = evaluaciones[evaluaciones.length - 1];
    const hayPersonales = evaluaciones.some((e) => e.promedioPersonal !== null);
    const radar = ultima ? ultima.valores.map((v) => ({ nombre: v.alcance === 'PERSONAL' ? `${v.nombre} ★` : v.nombre, valor: v.valor })) : [];
    const linea = evaluaciones.map((e) => ({ periodo: e.periodo, Promedio: e.promedio, Generales: e.promedioGeneral, Personales: e.promedioPersonal }));
    const barras = asistencia.meses.map((m) => ({ mes: etiquetaMes(m.mes), Asistió: m.presentes, Retardo: m.retardos, Falta: m.faltas }));
    const pct = asistencia.ultimos30.porcentaje;
    const tutores = alumno.tutores.map((t) => t.tutor.nombre).join(', ');
    const horarios = alumno.horarios.map((h) => `${h.horario.disciplina.nombre} — ${h.horario.nombre}`).join(' · ');

    hoja = (
      <div ref={hojaRef} className="reporte-hoja bg-white mx-auto my-6 shadow-lg text-gray-900" style={{ width: 794, maxWidth: '100%', padding: 36 }}>
        {/* Encabezado */}
        <div className="flex items-center justify-between gap-4 pb-4" style={{ borderBottom: `3px solid ${AZUL}` }}>
          <div className="flex items-center gap-3 min-w-0">
            {escuela?.logoUrl && <img src={escuela.logoUrl} alt="" className="rounded-lg object-contain flex-shrink-0" style={{ width: 96, height: 96 }} />}
            <div className="min-w-0">
              <p className="text-xl font-semibold truncate">{escuela?.nombre || 'Escuela de artes marciales'}</p>
              <p className="text-xs text-gray-500">Reporte de progreso del alumno</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-right flex-shrink-0">Emitido el<br />{fmtLarga(new Date(), false)}</p>
        </div>

        {/* Datos del alumno */}
        <div className="mt-5 avoid-break">
          <h1 className="text-2xl font-semibold">{alumno.nombreCompleto}</h1>
          {alumno.cintaActual && (
            <p className="mt-2 flex items-center gap-2 text-sm">
              <CintaVisual color1={alumno.cintaActual.color1} color2={alumno.cintaActual.color2} color3={alumno.cintaActual.color3} width={80} height={22} />
              <span className="font-medium">{alumno.cintaActual.nombre}</span>
            </p>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><dt className="inline text-gray-500">Edad: </dt><dd className="inline">{calcularEdad(alumno.fechaNacimiento)} años</dd></div>
            <div><dt className="inline text-gray-500">Inscrito desde: </dt><dd className="inline">{fmtLarga(alumno.fechaInscripcion)}</dd></div>
            {alumno.pais && <div><dt className="inline text-gray-500">País: </dt><dd className="inline">{alumno.pais}</dd></div>}
            {alumno.curp && <div><dt className="inline text-gray-500">CURP: </dt><dd className="inline">{alumno.curp}</dd></div>}
            {horarios && <div className="col-span-2"><dt className="inline text-gray-500">Clases: </dt><dd className="inline">{horarios}</dd></div>}
            {tutores && <div className="col-span-2"><dt className="inline text-gray-500">Tutor(es): </dt><dd className="inline">{tutores}</dd></div>}
          </dl>
        </div>

        {/* Evaluación */}
        <Seccion titulo={ultima ? `Evaluación de habilidades · ${ultima.periodo}` : 'Evaluación de habilidades'}>
          {!ultima ? (
            <p className="text-sm text-gray-500">Sin evaluaciones mensuales registradas todavía.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Dato etiqueta="Promedio" valor={ultima.promedio} color={AZUL} />
                <Dato etiqueta="Generales" valor={ultima.promedioGeneral} color={VERDE} />
                {hayPersonales && <Dato etiqueta="Personales ★" valor={ultima.promedioPersonal} color={OCRE} />}
              </div>
              <div className="flex items-center gap-4">
                {radar.length >= 3 && (
                  <RadarChart width={320} height={260} data={radar} outerRadius={85}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#374151' }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} tickCount={6} />
                    <Radar dataKey="valor" stroke={AZUL} fill={AZUL} fillOpacity={0.3} isAnimationActive={false} />
                  </RadarChart>
                )}
                <div className="flex-1 space-y-1.5">
                  {ultima.valores.map((v) => (
                    <div key={v.atributoId} className="text-xs">
                      <div className="flex justify-between"><span>{v.alcance === 'PERSONAL' ? `${v.nombre} ★` : v.nombre}</span><span className="font-medium">{v.valor}/10</span></div>
                      <div className="h-1.5 rounded-full" style={{ background: '#e5e7eb' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${v.valor * 10}%`, background: v.alcance === 'PERSONAL' ? OCRE : AZUL }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {ultima.notas && <p className="text-xs text-gray-600 mt-2 rounded-lg px-3 py-2" style={{ background: '#f3f4f6' }}><b>Notas del instructor:</b> {ultima.notas}</p>}
              {evaluaciones.length > 1 && (
                <div className="mt-4 avoid-break">
                  <p className="text-xs font-medium text-gray-500 mb-1">Progreso mes a mes</p>
                  <LineChart width={660} height={200} data={linea} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Promedio" stroke={AZUL} strokeWidth={2.5} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
                    <Line type="monotone" dataKey="Generales" stroke={VERDE} strokeWidth={1.5} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
                    {hayPersonales && <Line type="monotone" dataKey="Personales" stroke={OCRE} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2 }} connectNulls isAnimationActive={false} />}
                  </LineChart>
                </div>
              )}
            </>
          )}
        </Seccion>

        {/* Asistencia */}
        <Seccion titulo="Asistencia · últimos 6 meses">
          {asistencia.total.sesiones === 0 ? (
            <p className="text-sm text-gray-500">Sin clases registradas en este periodo.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <Dato etiqueta="Últimos 30 días" valor={pct === null ? '-' : `${pct}%`} color={pct === null ? '#6b7280' : pct >= 80 ? VERDE : pct >= 60 ? AMBAR : ROJO} />
                <Dato etiqueta="Asistencias" valor={asistencia.total.presentes} color={VERDE} />
                <Dato etiqueta="Retardos" valor={asistencia.total.retardos} color={AMBAR} />
                <Dato etiqueta="Faltas" valor={asistencia.total.faltas} color={ROJO} />
              </div>
              <BarChart width={660} height={210} data={barras} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Asistió" stackId="a" fill={VERDE} isAnimationActive={false} />
                <Bar dataKey="Retardo" stackId="a" fill={AMBAR} isAnimationActive={false} />
                <Bar dataKey="Falta" stackId="a" fill={ROJO} isAnimationActive={false} />
              </BarChart>
              <p className="text-[10px] text-gray-400">El retardo cuenta como asistencia en el porcentaje.</p>
            </>
          )}
        </Seccion>

        {/* Cintas */}
        <Seccion titulo="Progreso de cinta">
          <LineaCintas historial={alumno.historialCintas || []} cintaActual={alumno.cintaActual} />
        </Seccion>

        {/* Logros */}
        <Seccion titulo="Logros">
          {(alumno.logros || []).length === 0 ? (
            <p className="text-sm text-gray-500">Sin logros registrados todavía.</p>
          ) : (
            <div className="space-y-2">
              {alumno.logros.map((l) => (
                <div key={l.id} className="text-sm avoid-break">
                  <span className="font-medium">{l.titulo}</span>
                  <span className="text-xs text-gray-400"> · {fmtLarga(l.fecha)}</span>
                  {l.descripcion && <p className="text-xs text-gray-600">{l.descripcion}</p>}
                </div>
              ))}
            </div>
          )}
        </Seccion>

        <p className="mt-8 pt-3 text-[10px] text-gray-400 text-center" style={{ borderTop: '1px solid #e5e7eb' }}>
          {escuela?.nombre || 'Escuela de artes marciales'} · Documento generado el {fmtLarga(new Date(), false)}
        </p>
      </div>
    );
  }

  return createPortal(
    <div className="reporte-overlay fixed inset-0 z-[70] overflow-y-auto bg-gray-100 px-2">
      <style>{ESTILOS}</style>
      <div className="reporte-toolbar sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 border-b border-gray-200 px-4 py-2 -mx-2">
        <p className="text-sm font-medium text-gray-900">Vista previa del reporte</p>
        <div className="flex items-center gap-2">
          <button
            onClick={imprimir}
            disabled={!datos}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-40"
          >
            <Printer size={15} /> Descargar PDF
          </button>
          <button onClick={onCerrar} className="text-gray-500 hover:text-gray-900 p-1.5" aria-label="Cerrar"><X size={18} /></button>
        </div>
      </div>
      {!datos && !error && <p className="text-center text-sm text-gray-500 mt-10">Preparando reporte...</p>}
      {error && <p className="text-center text-sm text-red-600 mt-10">{error}</p>}
      {hoja}
      {datos && <p className="reporte-toolbar text-center text-xs text-gray-400 pb-6">En el cuadro de impresión elige «Guardar como PDF» como destino.</p>}
    </div>,
    document.body,
  );
}
