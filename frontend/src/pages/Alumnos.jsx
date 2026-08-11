import React, { useEffect, useState } from 'react';
import { Users, Plus, Pencil, Search, MessageSquarePlus, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Select, MultiSelectSearch, Field, Modal, DIAS_LABEL, formatHora12, CintaVisual, CintaDonut } from '../components/ui';

const estadoTono = { ACTIVO: 'green', INACTIVO: 'gray', SUSPENDIDO: 'red' };
const generoLabel = { MASCULINO: 'Masculino', FEMENINO: 'Femenino' };
const vacio = {
  nombreCompleto: '', fechaNacimiento: '', fechaInscripcion: new Date().toISOString().slice(0, 10), genero: '', tallaCinta: '', tallaUniforme: '',
  condicionesMedicas: '', horarioIds: [], horarioPrincipalId: '', cintaActualId: '', estado: 'ACTIVO', tutorIds: [],
};

function labelHorario(h) {
  const extra = h.costoExtra ? ` · +$${h.costoExtra} si es extra` : '';
  return `${h.disciplina.nombre} — ${h.nombre} (${h.dias.map((d) => DIAS_LABEL[d]).join('/')} ${formatHora12(h.horaInicio)}-${formatHora12(h.horaFin)}${extra})`;
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

function calcularTiempoInscrito(fechaInscripcion) {
  if (!fechaInscripcion) return null;
  const hoy = new Date();
  const inicio = new Date(fechaInscripcion);
  let meses = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
  if (hoy.getDate() < inicio.getDate()) meses--;
  if (meses < 0) meses = 0;
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  if (anios === 0 && mesesRestantes === 0) return 'Menos de 1 mes';
  const partes = [];
  if (anios > 0) partes.push(`${anios} año${anios !== 1 ? 's' : ''}`);
  if (mesesRestantes > 0) partes.push(`${mesesRestantes} mes${mesesRestantes !== 1 ? 'es' : ''}`);
  return partes.join(' y ');
}

function distribucionEdades(alumnos) {
  const conteo = {};
  alumnos.forEach((a) => {
    const edad = calcularEdad(a.fechaNacimiento);
    if (edad != null) conteo[edad] = (conteo[edad] || 0) + 1;
  });
  return Object.entries(conteo)
    .map(([edad, cantidad]) => ({ edad: `${edad} años`, cantidad }))
    .sort((a, b) => parseInt(a.edad) - parseInt(b.edad));
}

function distribucionCintas(alumnos) {
  const conteo = {};
  alumnos.forEach((a) => {
    if (!a.cintaActual) {
      if (!conteo['sin-cinta']) conteo['sin-cinta'] = { name: 'Sin cinta', value: 0, color1: '#e5e7eb', color2: null };
      conteo['sin-cinta'].value++;
      return;
    }
    const key = a.cintaActual.id;
    if (!conteo[key]) {
      conteo[key] = { name: a.cintaActual.nombre, value: 0, color1: a.cintaActual.color1, color2: a.cintaActual.color2 };
    }
    conteo[key].value++;
  });
  return Object.values(conteo);
}

export default function Alumnos() {
  const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');
  const esTutor = usuarioActual.rol === 'TUTOR';
  const esAdmin = usuarioActual.rol === 'ADMINISTRADOR';
  const [alumnos, setAlumnos] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [cintas, setCintas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [filtroHorarioId, setFiltroHorarioId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');
  const [detalleAlumno, setDetalleAlumno] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [mostrarComunicacion, setMostrarComunicacion] = useState(false);
  const [formComunicacion, setFormComunicacion] = useState({ tutorIds: [], tipo: 'COMPORTAMIENTO', asunto: '', mensaje: '' });
  const [enviandoComunicacion, setEnviandoComunicacion] = useState(false);
  const [comunicacionEnviada, setComunicacionEnviada] = useState(false);
  const [mostrarFormHistorial, setMostrarFormHistorial] = useState(false);
  const [formHistorial, setFormHistorial] = useState({ cintaId: '', fechaObtencion: '', instructor: '' });
  const [editandoHistorialId, setEditandoHistorialId] = useState(null);
  const [editHistorial, setEditHistorial] = useState({ cintaId: '', fechaObtencion: '' });

  async function enviarComunicacion() {
    if ((!esTutor && formComunicacion.tutorIds.length === 0) || !formComunicacion.asunto || !formComunicacion.mensaje) {
      setError(esTutor ? 'Completa el asunto y el mensaje' : 'Completa el tutor, asunto y mensaje');
      return;
    }
    setEnviandoComunicacion(true);
    setError('');
    try {
      if (esTutor) {
        // El tutor le escribe a la escuela; el backend usa su propio tutorId automáticamente
        await api.post('/conversaciones', {
          alumnoId: detalleAlumno.id,
          tipo: formComunicacion.tipo,
          asunto: formComunicacion.asunto,
          contenidoInicial: formComunicacion.mensaje,
        });
      } else {
        await Promise.all(
          formComunicacion.tutorIds.map((tutorId) =>
            api.post('/conversaciones', {
              alumnoId: detalleAlumno.id,
              tutorId,
              tipo: formComunicacion.tipo,
              asunto: formComunicacion.asunto,
              contenidoInicial: formComunicacion.mensaje,
            }),
          ),
        );
      }
      setComunicacionEnviada(true);
      setFormComunicacion({ tutorIds: [], tipo: 'COMPORTAMIENTO', asunto: '', mensaje: '' });
      setMostrarComunicacion(false);
    } catch {
      setError('No se pudo enviar la comunicación');
    } finally {
      setEnviandoComunicacion(false);
    }
  }

  async function verDetalle(alumnoId) {
    setCargandoDetalle(true);
    setMostrarComunicacion(false);
    setComunicacionEnviada(false);
    setFormComunicacion({ tutorIds: [], tipo: 'COMPORTAMIENTO', asunto: '', mensaje: '' });
    setMostrarFormHistorial(false);
    setFormHistorial({ cintaId: '', fechaObtencion: '', instructor: '' });
    setEditandoHistorialId(null);
    try {
      const { data } = await api.get(`/alumnos/${alumnoId}`);
      setDetalleAlumno(data);
    } catch {
      setError('No se pudo cargar el detalle del alumno');
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function agregarHistorial() {
    if (!formHistorial.cintaId) return;
    await api.post('/historial-cintas', { alumnoId: detalleAlumno.id, ...formHistorial });
    setFormHistorial({ cintaId: '', fechaObtencion: '', instructor: '' });
    setMostrarFormHistorial(false);
    verDetalle(detalleAlumno.id);
  }

  function abrirEdicionHistorial(h) {
    setEditandoHistorialId(h.id);
    setEditHistorial({ cintaId: h.cintaId, fechaObtencion: h.fechaObtencion.slice(0, 10) });
  }

  async function guardarEdicionHistorial(id) {
    await api.put(`/historial-cintas/${id}`, editHistorial);
    setEditandoHistorialId(null);
    verDetalle(detalleAlumno.id);
  }

  async function eliminarHistorial(id) {
    if (!confirm('¿Eliminar este registro del historial?')) return;
    await api.delete(`/historial-cintas/${id}`);
    verDetalle(detalleAlumno.id);
  }

  async function limpiarHistorial() {
    if (!confirm(`¿Borrar TODO el historial de cintas de ${detalleAlumno.nombreCompleto}? Esto no afecta su cinta actual, solo el historial. Útil para limpiar datos de prueba.`)) return;
    await api.delete(`/historial-cintas/alumno/${detalleAlumno.id}`);
    verDetalle(detalleAlumno.id);
  }

  function cargar() {
    setCargando(true);
    // Un tutor no tiene permiso para /tutores (ni lo necesita, ya que no puede
    // crear/editar alumnos), así que evitamos pedirlo para que no tumbe el resto.
    const peticiones = esTutor
      ? [api.get('/alumnos'), Promise.resolve({ data: [] }), api.get('/horarios'), api.get('/cintas')]
      : [api.get('/alumnos'), api.get('/tutores'), api.get('/horarios'), api.get('/cintas')];

    Promise.all(peticiones)
      .then(([a, t, h, c]) => { setAlumnos(a.data); setTutores(t.data); setHorarios(h.data); setCintas(c.data); })
      .catch(() => setError('No se pudieron cargar los alumnos'))
      .finally(() => setCargando(false));
  }
  useEffect(cargar, []);

  function abrirNuevo() {
    cargar();
    setForm(vacio);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEditar(alumno) {
    cargar();
    setForm({
      nombreCompleto: alumno.nombreCompleto,
      fechaNacimiento: alumno.fechaNacimiento.slice(0, 10),
      fechaInscripcion: alumno.fechaInscripcion?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      genero: alumno.genero || '',
      tallaCinta: alumno.tallaCinta || '',
      tallaUniforme: alumno.tallaUniforme || '',
      condicionesMedicas: alumno.condicionesMedicas || '',
      horarioIds: alumno.horarios.map((h) => h.horarioId),
      horarioPrincipalId: alumno.horarios.find((h) => h.esPrincipal)?.horarioId || '',
      cintaActualId: alumno.cintaActualId || '',
      estado: alumno.estado,
      tutorIds: alumno.tutores.map((t) => t.tutorId),
    });
    setEditandoId(alumno.id);
    setMostrarForm(true);
  }

  const horarioPrincipal = horarios.find((h) => h.id === (form.horarioPrincipalId || form.horarioIds[0]));
  const cintasDeDisciplina = cintas.filter((c) => c.disciplinaId === horarioPrincipal?.disciplinaId).sort((a, b) => a.orden - b.orden);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.tutorIds.length === 0) { setError('Selecciona al menos un tutor'); return; }
    if (form.horarioIds.length === 0) { setError('Selecciona al menos un horario'); return; }
    try {
      if (editandoId) {
        const { tutorIds, horarioIds, horarioPrincipalId, ...datos } = form;
        await api.put(`/alumnos/${editandoId}`, datos);
        await api.put(`/alumnos/${editandoId}/tutores`, { tutorIds });
        await api.put(`/alumnos/${editandoId}/horarios`, { horarioIds, horarioPrincipalId });
      } else {
        await api.post('/alumnos', form);
      }
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo guardar el alumno');
    }
  }

  // Base: respeta búsqueda y el toggle de activos/inactivos, pero NO el filtro de grupo
  // (así el resumen de arriba siempre refleja el total real, sin importar qué grupo estés viendo)
  const alumnosBase = alumnos.filter(
    (a) => (mostrarInactivos || a.estado === 'ACTIVO') && a.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()),
  );
  const totalMasculino = alumnosBase.filter((a) => a.genero === 'MASCULINO').length;
  const totalFemenino = alumnosBase.filter((a) => a.genero === 'FEMENINO').length;

  const horariosOrdenados = [...horarios].sort((a, b) => a.disciplina.nombre.localeCompare(b.disciplina.nombre) || a.nombre.localeCompare(b.nombre));
  const horariosAMostrar = filtroHorarioId ? horariosOrdenados.filter((h) => h.id === filtroHorarioId) : horariosOrdenados;

  const grupos = horariosAMostrar
    .map((h) => {
      const alumnosDelGrupo = alumnosBase.filter((a) => a.horarios.some((ah) => ah.horarioId === h.id));
      return {
        horario: h,
        alumnos: alumnosDelGrupo,
        masculino: alumnosDelGrupo.filter((a) => a.genero === 'MASCULINO').length,
        femenino: alumnosDelGrupo.filter((a) => a.genero === 'FEMENINO').length,
      };
    })
    .filter((g) => g.alumnos.length > 0);

  const sinHorario = alumnosBase.filter((a) => !a.horarios || a.horarios.length === 0);

  function filaAlumno(a) {
    return (
      <tr key={a.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => verDetalle(a.id)} title="Doble clic para ver el progreso">
        <td className="px-4 py-3 font-medium text-gray-900">{a.nombreCompleto}</td>
        <td className="px-4 py-3 text-gray-600">{calcularEdad(a.fechaNacimiento)}</td>
        <td className="px-4 py-3 text-gray-600">{generoLabel[a.genero] || '-'}</td>
        <td className="px-4 py-3">
          {a.cintaActual ? (
            <span className="flex items-center gap-2">
              <CintaVisual color1={a.cintaActual.color1} color2={a.cintaActual.color2} color3={a.cintaActual.color3} width={40} height={14} />
              <span className="text-gray-600 text-xs">{a.cintaActual.nombre}</span>
            </span>
          ) : '-'}
        </td>
        <td className="px-4 py-3 text-gray-600">{a.tutores.map((t) => t.tutor.nombre).join(', ')}</td>
        <td className="px-4 py-3"><Badge tone={estadoTono[a.estado]}>{a.estado}</Badge></td>
        <td className="px-4 py-3 text-right">
          {!esTutor && <button onClick={() => abrirEditar(a)} className="text-gray-400 hover:text-gray-900"><Pencil size={16} /></button>}
        </td>
      </tr>
    );
  }

  return (
    <div>
      <PageHeader
        title="Alumnos"
        description={esTutor ? 'Consulta el progreso de tus hijos inscritos' : 'Gestiona los estudiantes inscritos en la escuela'}
        action={!esTutor && <Button onClick={abrirNuevo}><Plus size={16} />Agregar alumno</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <Field label="Nombre completo">
              <Input value={form.nombreCompleto} onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })} required />
            </Field>
            <Field label="Fecha de nacimiento">
              <Input type="date" value={form.fechaNacimiento} onChange={(e) => setForm({ ...form, fechaNacimiento: e.target.value })} required />
              {form.fechaNacimiento && (
                <p className="text-xs text-gray-400 mt-1">{calcularEdad(form.fechaNacimiento)} años</p>
              )}
            </Field>
            <Field label="Fecha de inscripción">
              <Input type="date" value={form.fechaInscripcion} onChange={(e) => setForm({ ...form, fechaInscripcion: e.target.value })} required />
              {form.fechaInscripcion && (
                <p className="text-xs text-gray-400 mt-1">Lleva inscrito: {calcularTiempoInscrito(form.fechaInscripcion)}</p>
              )}
            </Field>

            <Field label="Sexo">
              <Select value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })} required>
                <option value="">Selecciona...</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </Select>
            </Field>

            <div />

            <div className="col-span-2">
              <Field label="Disciplinas / Horarios (puede tener más de uno, ej. clase extra)">
                <MultiSelectSearch
                  options={horarios.map((h) => ({ id: h.id, label: labelHorario(h) }))}
                  selected={form.horarioIds}
                  onChange={(horarioIds) => setForm({
                    ...form,
                    horarioIds,
                    horarioPrincipalId: horarioIds.includes(form.horarioPrincipalId) ? form.horarioPrincipalId : horarioIds[0] || '',
                    cintaActualId: '',
                  })}
                  placeholder="Buscar horario..."
                />
              </Field>
            </div>

            {form.horarioIds.length > 1 && (
              <Field label="Horario principal (define su disciplina base para la cinta)">
                <Select value={form.horarioPrincipalId} onChange={(e) => setForm({ ...form, horarioPrincipalId: e.target.value, cintaActualId: '' })}>
                  {form.horarioIds.map((id) => {
                    const h = horarios.find((x) => x.id === id);
                    return h ? <option key={id} value={id}>{labelHorario(h)}</option> : null;
                  })}
                </Select>
              </Field>
            )}

            <Field label="Talla de cinta">
              <Input value={form.tallaCinta} onChange={(e) => setForm({ ...form, tallaCinta: e.target.value })} />
            </Field>
            <Field label="Talla de uniforme">
              <Input value={form.tallaUniforme} onChange={(e) => setForm({ ...form, tallaUniforme: e.target.value })} />
            </Field>

            {form.horarioIds.length > 0 && (
              <Field label="Cinta actual">
                <Select value={form.cintaActualId} onChange={(e) => setForm({ ...form, cintaActualId: e.target.value })}>
                  <option value="">Automática (la más baja de la disciplina)</option>
                  {cintasDeDisciplina.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </Field>
            )}

            <Field label="Condiciones médicas (opcional)">
              <Input value={form.condicionesMedicas} onChange={(e) => setForm({ ...form, condicionesMedicas: e.target.value })} />
            </Field>

            {editandoId && (
              <Field label="Estado">
                <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                </Select>
              </Field>
            )}

            <div className="col-span-2">
              <Field label="Tutores">
                <MultiSelectSearch
                  options={tutores.filter((t) => t.activo).map((t) => ({ id: t.id, label: t.nombre }))}
                  selected={form.tutorIds}
                  onChange={(tutorIds) => setForm({ ...form, tutorIds })}
                  placeholder="Buscar tutor por nombre..."
                />
              </Field>
              {tutores.length === 0 && <p className="text-sm text-gray-400 mt-1">Primero crea un tutor en la sección Tutores.</p>}
            </div>

            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Resumen general: siempre refleja el total real (respetando activos/inactivos y búsqueda) */}
      <Card className="p-4 mb-4 flex gap-6">
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-lg font-semibold text-gray-900">{alumnosBase.length}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Masculinos</p>
          <p className="text-lg font-semibold text-gray-900">{totalMasculino}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Femeninos</p>
          <p className="text-lg font-semibold text-gray-900">{totalFemenino}</p>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="relative max-w-xs flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
        </div>

        <Select value={filtroHorarioId} onChange={(e) => setFiltroHorarioId(e.target.value)} className="!w-auto max-w-xs">
          <option value="">Todos los grupos</option>
          {horariosOrdenados.map((h) => (
            <option key={h.id} value={h.id}>{h.disciplina.nombre} — {h.nombre}</option>
          ))}
        </Select>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
          Mostrar inactivos/suspendidos
        </label>
      </div>

      {cargando ? (
        <Card><p className="p-6 text-sm text-gray-400">Cargando...</p></Card>
      ) : alumnosBase.length === 0 ? (
        <Card><EmptyState icon={Users} title={busqueda ? 'Sin resultados' : 'Aún no hay alumnos'} description={busqueda ? 'Prueba con otro nombre.' : 'Agrega el primero con el botón de arriba.'} /></Card>
      ) : (
        <div className="space-y-4">
          {grupos.map((g) => (
            <Card key={g.horario.id} className="overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{g.horario.disciplina.nombre} — {g.horario.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {g.horario.dias.map((d) => DIAS_LABEL[d]).join('/')} {formatHora12(g.horario.horaInicio)}-{formatHora12(g.horario.horaFin)}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <span className="font-medium text-gray-900">{g.alumnos.length}</span> alumnos
                  <span className="mx-1.5 text-gray-300">·</span>
                  {g.masculino} M / {g.femenino} F
                </div>
              </div>

              {g.alumnos.length > 0 && (
                <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex flex-wrap gap-6">
                  <div className="flex-1 min-w-[220px]">
                    <p className="text-xs font-medium text-gray-500 mb-1">Distribución por edad</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={distribucionEdades(g.alumnos)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
                        <XAxis dataKey="edad" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                          labelStyle={{ fontWeight: 600 }}
                        />
                        <Bar dataKey="cantidad" fill="#185fa5" radius={[4, 4, 0, 0]} maxBarSize={44} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 min-w-[220px]">
                    <p className="text-xs font-medium text-gray-500 mb-1">Distribución por cinta</p>
                    <div className="flex items-center gap-4">
                      <CintaDonut segmentos={distribucionCintas(g.alumnos)} size={130} />
                      <div className="space-y-1">
                        {distribucionCintas(g.alumnos).map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <CintaVisual color1={s.color1} color2={s.color2 || s.color1} color3={s.color1} width={28} height={11} />
                            <span className="text-gray-600">{s.name}</span>
                            <span className="text-gray-400">({s.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Table columns={['Nombre', 'Edad', 'Sexo', 'Cinta actual', 'Tutores', 'Estado', '']}>
                {g.alumnos.map(filaAlumno)}
              </Table>
            </Card>
          ))}

          {sinHorario.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-900">Sin horario asignado</p>
              </div>
              <Table columns={['Nombre', 'Edad', 'Sexo', 'Cinta actual', 'Tutores', 'Estado', '']}>
                {sinHorario.map(filaAlumno)}
              </Table>
            </Card>
          )}
        </div>
      )}

      <Modal open={!!detalleAlumno || cargandoDetalle} onClose={() => setDetalleAlumno(null)} title={detalleAlumno?.nombreCompleto || 'Cargando...'}>
        {cargandoDetalle ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : detalleAlumno && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                {detalleAlumno.nombreCompleto.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900">{detalleAlumno.nombreCompleto}</p>
                <p className="text-sm text-gray-500">
                  {calcularEdad(detalleAlumno.fechaNacimiento)} años · {generoLabel[detalleAlumno.genero] || '-'}
                </p>
                <p className="text-xs text-gray-400">
                  Inscrito desde {new Date(detalleAlumno.fechaInscripcion).toLocaleDateString()} ({calcularTiempoInscrito(detalleAlumno.fechaInscripcion)})
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Cinta actual</p>
              {detalleAlumno.cintaActual ? (
                <span className="flex items-center gap-2">
                  <CintaVisual color1={detalleAlumno.cintaActual.color1} color2={detalleAlumno.cintaActual.color2} color3={detalleAlumno.cintaActual.color3} width={70} height={20} />
                  <Badge tone="blue">{detalleAlumno.cintaActual.nombre}</Badge>
                </span>
              ) : (
                <p className="text-sm text-gray-400">Sin asignar</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Progreso de cambio de cinta</p>
                {esAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => setMostrarFormHistorial(!mostrarFormHistorial)} className="text-xs text-gray-500 hover:text-gray-900">
                      + Agregar registro
                    </button>
                    {detalleAlumno.historialCintas?.length > 0 && (
                      <button onClick={limpiarHistorial} className="text-xs text-red-500 hover:text-red-700">
                        Limpiar historial
                      </button>
                    )}
                  </div>
                )}
              </div>

              {esAdmin && mostrarFormHistorial && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
                  <Select value={formHistorial.cintaId} onChange={(e) => setFormHistorial({ ...formHistorial, cintaId: e.target.value })}>
                    <option value="">Selecciona cinta...</option>
                    {cintas.map((c) => <option key={c.id} value={c.id}>{c.disciplina?.nombre} — {c.nombre}</option>)}
                  </Select>
                  <Input type="date" value={formHistorial.fechaObtencion} onChange={(e) => setFormHistorial({ ...formHistorial, fechaObtencion: e.target.value })} />
                  <Input placeholder="Instructor (opcional)" value={formHistorial.instructor} onChange={(e) => setFormHistorial({ ...formHistorial, instructor: e.target.value })} />
                  <Button onClick={agregarHistorial} className="w-full justify-center">Guardar</Button>
                </div>
              )}

              {detalleAlumno.historialCintas?.length > 0 ? (
                <div className="space-y-2">
                  {detalleAlumno.historialCintas.map((h, i) => (
                    <div key={h.id} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />
                      {editandoHistorialId === h.id ? (
                        <>
                          <Select value={editHistorial.cintaId} onChange={(e) => setEditHistorial({ ...editHistorial, cintaId: e.target.value })} className="!py-1 text-xs">
                            {cintas.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                          </Select>
                          <Input type="date" value={editHistorial.fechaObtencion} onChange={(e) => setEditHistorial({ ...editHistorial, fechaObtencion: e.target.value })} className="!py-1 !w-32 text-xs" />
                          <button onClick={() => guardarEdicionHistorial(h.id)} className="text-green-600 text-xs">Guardar</button>
                          <button onClick={() => setEditandoHistorialId(null)} className="text-gray-400 text-xs">Cancelar</button>
                        </>
                      ) : (
                        <>
                          <span className={i === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}>
                            <CintaVisual color1={h.cinta.color1} color2={h.cinta.color2} color3={h.cinta.color3} width={32} height={12} /> {h.cinta.nombre}
                          </span>
                          <span className="text-gray-400 text-xs">{new Date(h.fechaObtencion).toLocaleDateString()}</span>
                          {esAdmin && (
                            <span className="ml-auto flex gap-2">
                              <button onClick={() => abrirEdicionHistorial(h)} className="text-gray-400 hover:text-gray-900"><Pencil size={12} /></button>
                              <button onClick={() => eliminarHistorial(h.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aún no tiene exámenes de cambio de cinta aprobados. Su cinta actual fue asignada manualmente o por defecto.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Horarios</p>
              <div className="space-y-1">
                {detalleAlumno.horarios.map((h) => (
                  <p key={h.id} className="text-sm text-gray-600">
                    {h.horario.disciplina.nombre} — {h.horario.nombre}{h.esPrincipal ? ' (principal)' : ' (extra)'}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tutores</p>
              <div className="space-y-1">
                {detalleAlumno.tutores.map((t) => (
                  <p key={t.id} className="text-sm text-gray-600">{t.tutor.nombre}{t.esPrincipal ? ' (principal)' : ''}</p>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              {!mostrarComunicacion ? (
                <Button variant="secondary" onClick={() => setMostrarComunicacion(true)}>
                  <MessageSquarePlus size={16} /> {esTutor ? 'Iniciar conversación con la escuela' : 'Iniciar comunicación con tutores'}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Nueva conversación</p>

                  {!esTutor && (
                    <Field label="Para">
                      <div className="flex flex-wrap gap-1.5">
                        {detalleAlumno.tutores.map((t) => (
                          <button
                            type="button"
                            key={t.tutorId}
                            onClick={() => setFormComunicacion((f) => ({
                              ...f,
                              tutorIds: f.tutorIds.includes(t.tutorId) ? f.tutorIds.filter((id) => id !== t.tutorId) : [...f.tutorIds, t.tutorId],
                            }))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                              formComunicacion.tutorIds.includes(t.tutorId) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300'
                            }`}
                          >
                            {t.tutor.nombre}
                          </button>
                        ))}
                      </div>
                    </Field>
                  )}

                  <Field label="Tema">
                    <Select value={formComunicacion.tipo} onChange={(e) => setFormComunicacion({ ...formComunicacion, tipo: e.target.value })}>
                      <option value="COMPORTAMIENTO">Comportamiento</option>
                      <option value="PROGRESO">Progreso</option>
                      <option value="REUNION">Reunión</option>
                      <option value="AVISO_GENERAL">Aviso general</option>
                    </Select>
                  </Field>

                  <Field label="Asunto">
                    <Input value={formComunicacion.asunto} onChange={(e) => setFormComunicacion({ ...formComunicacion, asunto: e.target.value })} />
                  </Field>

                  <Field label="Mensaje">
                    <textarea
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10"
                      rows={4}
                      value={formComunicacion.mensaje}
                      onChange={(e) => setFormComunicacion({ ...formComunicacion, mensaje: e.target.value })}
                    />
                  </Field>

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2">
                    <Button onClick={enviarComunicacion} disabled={enviandoComunicacion}>
                      {enviandoComunicacion ? 'Enviando...' : 'Enviar y notificar por correo'}
                    </Button>
                    <Button variant="secondary" onClick={() => setMostrarComunicacion(false)}>Cancelar</Button>
                  </div>
                </div>
              )}

              {comunicacionEnviada && (
                <p className="text-sm text-green-600 mt-2">
                  Conversación iniciada. Se notificó por correo a los tutores seleccionados.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
