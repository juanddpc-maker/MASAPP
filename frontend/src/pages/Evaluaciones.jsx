import React, { useEffect, useState } from 'react';
import { Star, Plus, Pencil, Trash2, Lock, Unlock } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Select, Field, Modal } from '../components/ui';

const fmtFecha = (f) => new Date(f).toLocaleDateString(undefined, { timeZone: 'UTC' });

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function periodoDelMesActual() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth();
  const dos = (n) => String(n).padStart(2, '0');
  const ultimo = new Date(y, m + 1, 0).getDate();
  return { nombre: `${MESES[m]} ${y}`, fechaInicio: `${y}-${dos(m + 1)}-01`, fechaFin: `${y}-${dos(m + 1)}-${dos(ultimo)}` };
}

// ---------- Pestaña: periodos (solo administrador) ----------
function Periodos({ periodos, recargar }) {
  const [abierto, setAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(periodoDelMesActual());
  const [error, setError] = useState('');

  function nuevo() {
    setEditandoId(null);
    setForm(periodoDelMesActual());
    setError('');
    setAbierto(true);
  }

  function editar(p) {
    setEditandoId(p.id);
    setForm({ nombre: p.nombre, fechaInicio: p.fechaInicio.slice(0, 10), fechaFin: p.fechaFin.slice(0, 10) });
    setError('');
    setAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) await api.put(`/periodos-evaluacion/${editandoId}`, form);
      else await api.post('/periodos-evaluacion', form);
      setAbierto(false);
      recargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el periodo');
    }
  }

  async function cambiarEstado(p) {
    await api.put(`/periodos-evaluacion/${p.id}`, { estado: p.estado === 'ABIERTO' ? 'CERRADO' : 'ABIERTO' });
    recargar();
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar el periodo "${p.nombre}"?`)) return;
    try {
      await api.delete(`/periodos-evaluacion/${p.id}`);
      recargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar');
    }
  }

  return (
    <>
      <div className="flex justify-end mb-3">
        <Button onClick={nuevo}><Plus size={16} /> Nuevo periodo</Button>
      </div>
      {periodos.length === 0 ? (
        <EmptyState icon={Star} title="Aún no hay periodos" description="Crea el periodo del mes para que los instructores puedan evaluar." />
      ) : (
        <Card>
          <Table columns={['Periodo', 'Fechas', 'Evaluaciones', 'Estado', '']}>
            {periodos.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{fmtFecha(p.fechaInicio)} – {fmtFecha(p.fechaFin)}</td>
                <td className="px-4 py-3 text-gray-600">{p._count?.evaluaciones ?? 0}</td>
                <td className="px-4 py-3"><Badge tone={p.estado === 'ABIERTO' ? 'green' : 'gray'}>{p.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado'}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 justify-end">
                    <button title={p.estado === 'ABIERTO' ? 'Cerrar' : 'Reabrir'} onClick={() => cambiarEstado(p)} className="text-gray-400 hover:text-gray-900">
                      {p.estado === 'ABIERTO' ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button onClick={() => editar(p)} className="text-gray-400 hover:text-gray-900"><Pencil size={14} /></button>
                    <button onClick={() => eliminar(p)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal open={abierto} onClose={() => setAbierto(false)} title={editandoId ? 'Editar periodo' : 'Nuevo periodo'}>
        <form onSubmit={guardar} className="space-y-3">
          <Field label="Nombre"><Input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio"><Input type="date" required value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} /></Field>
            <Field label="Fin"><Input type="date" required value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} /></Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full justify-center">Guardar</Button>
        </form>
      </Modal>
    </>
  );
}

// ---------- Pestaña: evaluar ----------
function Evaluar({ periodos }) {
  const [horarios, setHorarios] = useState([]);
  const [periodoId, setPeriodoId] = useState('');
  const [horarioId, setHorarioId] = useState('');
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [alumnoSel, setAlumnoSel] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [valores, setValores] = useState({});
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const periodo = periodos.find((p) => p.id === periodoId);
  const cerrado = periodo?.estado === 'CERRADO';

  useEffect(() => { api.get('/horarios').then((r) => setHorarios(r.data)); }, []);

  useEffect(() => {
    if (!periodoId && periodos.length) setPeriodoId((periodos.find((p) => p.estado === 'ABIERTO') || periodos[0]).id);
  }, [periodos]);

  function cargarClase() {
    if (!periodoId || !horarioId) { setAlumnos([]); return; }
    setCargando(true);
    api.get('/evaluacion-mensual/clase', { params: { periodoId, horarioId } })
      .then((r) => setAlumnos(r.data))
      .finally(() => setCargando(false));
  }
  useEffect(cargarClase, [periodoId, horarioId]);

  async function abrir(alumno) {
    setError('');
    setAlumnoSel(alumno);
    setFormulario(null);
    const { data } = await api.get('/evaluacion-mensual/formulario', { params: { periodoId, alumnoId: alumno.id } });
    setFormulario(data.atributos);
    setValores(data.evaluacion?.valores || {});
    setNotas(data.evaluacion?.notas || '');
  }

  const capturados = Object.values(valores).filter(Boolean);
  const promedioVivo = capturados.length ? (capturados.reduce((a, b) => a + b, 0) / capturados.length).toFixed(1) : '-';

  async function guardar() {
    if (capturados.length === 0) { setError('Califica al menos un atributo'); return; }
    setGuardando(true);
    setError('');
    try {
      await api.put('/evaluacion-mensual', {
        periodoId,
        alumnoId: alumnoSel.id,
        notas,
        valores: Object.entries(valores).filter(([, v]) => v).map(([atributoId, valor]) => ({ atributoId, valor })),
      });
      setAlumnoSel(null);
      cargarClase();
    } catch (err) {
      const m = err.response?.data?.message;
      setError(Array.isArray(m) ? m.join(', ') : m || 'No se pudo guardar la evaluación');
    } finally {
      setGuardando(false);
    }
  }

  const generales = formulario?.filter((a) => a.alcance === 'GENERAL') || [];
  const personales = formulario?.filter((a) => a.alcance === 'PERSONAL') || [];

  function Grupo({ titulo, lista }) {
    if (lista.length === 0) return null;
    return (
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{titulo}</p>
        <div className="space-y-3">
          {lista.map((a) => (
            <div key={a.id}>
              <p className="text-sm text-gray-800 mb-1">{a.nombre}</p>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={cerrado}
                    onClick={() => setValores({ ...valores, [a.id]: valores[a.id] === n ? 0 : n })}
                    className={`w-8 h-8 rounded-md text-sm border ${valores[a.id] === n ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'} disabled:opacity-50`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 max-w-2xl">
        <Field label="Periodo">
          <Select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)}>
            <option value="">Selecciona un periodo...</option>
            {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.estado === 'CERRADO' ? ' (cerrado)' : ''}</option>)}
          </Select>
        </Field>
        <Field label="Clase">
          <Select value={horarioId} onChange={(e) => setHorarioId(e.target.value)}>
            <option value="">Selecciona un grupo...</option>
            {horarios.map((h) => <option key={h.id} value={h.id}>{h.disciplina.nombre} — {h.nombre}</option>)}
          </Select>
        </Field>
      </div>

      {periodos.length === 0 && <p className="text-sm text-gray-500">No hay periodos de evaluación. Pide al administrador que cree uno.</p>}
      {cerrado && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">Este periodo está cerrado: solo se puede consultar.</p>}

      {periodoId && horarioId && (
        cargando ? <p className="text-sm text-gray-400">Cargando...</p> : alumnos.length === 0 ? (
          <EmptyState icon={Star} title="Sin alumnos activos en esta clase" />
        ) : (
          <Card>
            <Table columns={['Alumno', 'Estado', 'Promedio', '']}>
              {alumnos.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-900">{a.nombreCompleto}</td>
                  <td className="px-4 py-3"><Badge tone={a.evaluado ? 'green' : 'gray'}>{a.evaluado ? 'Evaluado' : 'Pendiente'}</Badge></td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{a.promedio ?? '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="secondary" onClick={() => abrir(a)}>{cerrado ? 'Ver' : a.evaluado ? 'Editar' : 'Evaluar'}</Button>
                  </td>
                </tr>
              ))}
            </Table>
          </Card>
        )
      )}

      <Modal open={!!alumnoSel} onClose={() => setAlumnoSel(null)} title={alumnoSel ? `${alumnoSel.nombreCompleto} · ${periodo?.nombre || ''}` : ''}>
        {!formulario ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <div className="space-y-5">
            {formulario.length === 0 && <p className="text-sm text-gray-500">No hay atributos configurados. Agrégalos en Configuración.</p>}
            <Grupo titulo="Habilidades generales" lista={generales} />
            <Grupo titulo="Habilidades personales ★" lista={personales} />
            <Field label="Notas (opcional)">
              <Input value={notas} onChange={(e) => setNotas(e.target.value)} disabled={cerrado} />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Promedio</span>
              <span className="font-semibold text-gray-900">{promedioVivo}</span>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!cerrado && <Button onClick={guardar} disabled={guardando} className="w-full justify-center">{guardando ? 'Guardando...' : 'Guardar evaluación'}</Button>}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Evaluaciones() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const esAdmin = usuario.rol === 'ADMINISTRADOR';
  const [tab, setTab] = useState('evaluar');
  const [periodos, setPeriodos] = useState([]);

  function recargar() { api.get('/periodos-evaluacion').then((r) => setPeriodos(r.data)); }
  useEffect(recargar, []);

  return (
    <div>
      <PageHeader title="Evaluaciones" description="Evaluación mensual de habilidades por clase" />
      {esAdmin && (
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {[['evaluar', 'Evaluar'], ['periodos', 'Periodos']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 text-sm -mb-px border-b-2 ${tab === id ? 'border-gray-900 text-gray-900 font-medium' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      {tab === 'periodos' && esAdmin ? <Periodos periodos={periodos} recargar={recargar} /> : <Evaluar periodos={periodos} />}
    </div>
  );
}
