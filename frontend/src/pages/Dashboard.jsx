import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import api from '../lib/api';
import { Card, PageHeader, CintaVisual } from '../components/ui';

const COLORES_GENERO = ['#185fa5', '#db2777'];
const COLORES_GRUPO = ['#185fa5', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#db2777'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

const MODULO_LABEL = {
  alumnos: 'Alumnos', tutores: 'Tutores', cintas: 'Cintas', 'eventos-cambio-cinta': 'Cambio de cinta',
  pagos: 'Pagos', conversaciones: 'Comunicación', comportamiento: 'Comportamiento', inventario: 'Inventario',
  ventas: 'Ventas', usuarios: 'Usuarios', horarios: 'Horarios', disciplinas: 'Disciplinas',
  categorias: 'Categorías', escuela: 'Escuela', 'historial-cintas': 'Historial de cintas',
};

export default function Dashboard() {
  const [alumnos, setAlumnos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [usoModulos, setUsoModulos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/alumnos'), api.get('/pagos/periodos'), api.get('/logs/uso-modulos')])
      .then(([a, p, u]) => { setAlumnos(a.data); setPeriodos(p.data); setUsoModulos(u.data); })
      .finally(() => setCargando(false));
  }, []);

  const activos = alumnos.filter((a) => a.estado === 'ACTIVO');

  // 1. Distribución de edades
  const conteoEdades = {};
  activos.forEach((a) => {
    const edad = calcularEdad(a.fechaNacimiento);
    if (edad != null) conteoEdades[edad] = (conteoEdades[edad] || 0) + 1;
  });
  const datosEdades = Object.entries(conteoEdades)
    .map(([edad, cantidad]) => ({ edad: `${edad}`, cantidad }))
    .sort((a, b) => parseInt(a.edad) - parseInt(b.edad));

  // 2. Distribución por cinta (con su color real)
  const conteoCintas = {};
  activos.forEach((a) => {
    if (!a.cintaActual) return;
    const key = a.cintaActual.id;
    if (!conteoCintas[key]) conteoCintas[key] = { ...a.cintaActual, cantidad: 0 };
    conteoCintas[key].cantidad++;
  });
  const datosCintas = Object.values(conteoCintas).sort((a, b) => a.orden - b.orden);

  // 3. Distribución por género
  const datosGenero = [
    { name: 'Masculino', value: activos.filter((a) => a.genero === 'MASCULINO').length },
    { name: 'Femenino', value: activos.filter((a) => a.genero === 'FEMENINO').length },
  ].filter((d) => d.value > 0);

  // 4. Distribución por grupo/horario
  const conteoGrupos = {};
  activos.forEach((a) => {
    a.horarios?.forEach((h) => {
      const key = `${h.horario.disciplina.nombre} — ${h.horario.nombre}`;
      conteoGrupos[key] = (conteoGrupos[key] || 0) + 1;
    });
  });
  const datosGrupos = Object.entries(conteoGrupos).map(([nombre, cantidad]) => ({ nombre, cantidad }));

  // 5. Alumnos inscritos por mes (últimos 12 meses)
  const hoy = new Date();
  const ultimos12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
  });
  const datosInscripciones = ultimos12.map(({ year, month, label }) => {
    const cantidad = alumnos.filter((a) => {
      if (!a.fechaInscripcion) return false;
      const f = new Date(a.fechaInscripcion);
      return f.getFullYear() === year && f.getMonth() === month;
    }).length;
    return { mes: label, cantidad };
  });

  // 6. Estado de pagos del periodo más reciente
  const periodoReciente = [...periodos].sort((a, b) => new Date(b.fechaLimite) - new Date(a.fechaLimite))[0];
  const COLORES_PAGO = { PENDIENTE: '#f59e0b', PAGADO: '#16a34a', VENCIDO: '#dc2626', EXONERADO: '#9ca3af' };
  const ESTADO_LABEL = { PENDIENTE: 'Pendiente', PAGADO: 'Pagado', VENCIDO: 'Vencido', EXONERADO: 'Exonerado' };
  let datosPagos = [];
  let kpiPagos = null;
  if (periodoReciente) {
    const conteo = {};
    periodoReciente.candidatos.forEach((c) => {
      conteo[c.estadoPago] = (conteo[c.estadoPago] || 0) + 1;
    });
    datosPagos = Object.entries(conteo).map(([estado, value]) => ({ name: ESTADO_LABEL[estado], value, color: COLORES_PAGO[estado] }));
    const totalACobrar = periodoReciente.candidatos.reduce((s, c) => s + Number(c.montoAPagar), 0);
    const cobrado = periodoReciente.candidatos.filter((c) => c.estadoPago === 'PAGADO').reduce((s, c) => s + Number(c.montoAPagar), 0);
    kpiPagos = { totalACobrar, cobrado, pendiente: totalACobrar - cobrado };
  }

  if (cargando) return <p className="text-sm text-gray-400">Cargando...</p>;

  return (
    <div>
      <PageHeader title="Dashboard" description="Panorama general de la escuela (solo alumnos activos, salvo donde se indique)" />

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Distribución por edad</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosEdades} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
              <XAxis dataKey="edad" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v) => [`${v} alumnos`, '']} />
              <Bar dataKey="cantidad" fill="#185fa5" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Distribución por cinta</p>
          {datosCintas.length === 0 ? (
            <p className="text-sm text-gray-400 py-16 text-center">Sin datos todavía</p>
          ) : (
            <div className="space-y-2">
              {datosCintas.map((c) => {
                const max = Math.max(...datosCintas.map((x) => x.cantidad));
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <CintaVisual color1={c.color1} color2={c.color2} color3={c.color3} width={44} height={14} />
                    <span className="text-xs text-gray-600 w-8 text-right">{c.cantidad}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gray-900 rounded-full" style={{ width: `${(c.cantidad / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Distribución por género</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={datosGenero} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {datosGenero.map((_, i) => <Cell key={i} fill={COLORES_GENERO[i % COLORES_GENERO.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Distribución por grupo</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={datosGrupos} dataKey="cantidad" nameKey="nombre" cx="40%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {datosGrupos.map((_, i) => <Cell key={i} fill={COLORES_GRUPO[i % COLORES_GRUPO.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 col-span-2">
          <p className="text-sm font-medium text-gray-700 mb-3">Alumnos inscritos por mes (últimos 12 meses)</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={datosInscripciones} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v) => [`${v} inscritos`, '']} />
              <Line type="monotone" dataKey="cantidad" stroke="#185fa5" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 col-span-2">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Estado de pagos {periodoReciente ? `— periodo ${periodoReciente.mesAnio}` : ''}
          </p>
          {!periodoReciente ? (
            <p className="text-sm text-gray-400 py-10 text-center">Aún no hay periodos de pago creados.</p>
          ) : periodoReciente.candidatos.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Este periodo todavía no tiene alumnos agregados.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <ResponsiveContainer width={220} height={200}>
                <PieChart>
                  <Pie data={datosPagos} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {datosPagos.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-gray-400">Total a cobrar</p>
                  <p className="text-lg font-semibold text-gray-900">${kpiPagos.totalACobrar.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Cobrado</p>
                  <p className="text-lg font-semibold text-green-600">${kpiPagos.cobrado.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Pendiente</p>
                  <p className="text-lg font-semibold text-amber-600">${kpiPagos.pendiente.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5 col-span-2">
          <p className="text-sm font-medium text-gray-700 mb-3">Módulos más usados</p>
          {usoModulos.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Aún no hay suficiente actividad registrada.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, usoModulos.length * 32)}>
              <BarChart
                data={usoModulos.map((m) => ({ ...m, nombre: MODULO_LABEL[m.modulo] || m.modulo }))}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0efe9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} formatter={(v) => [`${v} peticiones`, '']} />
                <Bar dataKey="cantidad" fill="#185fa5" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
