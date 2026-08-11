import React, { useEffect, useState } from 'react';
import { Repeat, Plus, ChevronDown, ChevronUp, Check, X, Clock, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Select, Field } from '../components/ui';

const resultadoTono = { PENDIENTE: 'amber', APROBADO: 'green', NO_APROBADO: 'red', NO_SE_PRESENTO: 'gray' };
const estadoTono = { PLANEACION: 'gray', EN_PROGRESO: 'amber', COMPLETADO: 'green', CANCELADO: 'red' };
const estadoLabel = { PLANEACION: 'Planeación', EN_PROGRESO: 'En progreso', COMPLETADO: 'Completado', CANCELADO: 'Cancelado' };

export default function EventosCinta() {
  const [eventos, setEventos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [form, setForm] = useState({ nombre: '', fechaExamen: '', disciplinaId: '' });
  const [error, setError] = useState('');
  const [mostrarSoloPresentan, setMostrarSoloPresentan] = useState({}); // { [eventoId]: boolean }
  const [filtroGrupo, setFiltroGrupo] = useState({}); // { [eventoId]: horarioId }
  const [busquedaAlumno, setBusquedaAlumno] = useState({}); // { [eventoId]: string }

  function cargar() {
    Promise.all([api.get('/eventos-cambio-cinta'), api.get('/alumnos'), api.get('/disciplinas'), api.get('/horarios')])
      .then(([e, a, d, h]) => { setEventos(e.data); setAlumnos(a.data); setDisciplinas(d.data); setHorarios(h.data); })
      .catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/eventos-cambio-cinta', form);
      setForm({ nombre: '', fechaExamen: '', disciplinaId: '' });
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo crear el evento');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este evento por completo? Esta acción no se puede deshacer (útil si se creó por error).')) return;
    await api.delete(`/eventos-cambio-cinta/${id}`);
    cargar();
  }

  async function cambiarFase(ev, nuevaFase) {
    if (nuevaFase === 'COMPLETADO') {
      const aprobados = ev.candidatos.filter((c) => c.presentaExamen && c.resultado === 'APROBADO').length;
      if (!confirm(`Al completar el evento se aplicará el cambio de cinta a ${aprobados} alumno(s) aprobado(s). Esta acción actualiza su historial y cinta actual. ¿Continuar?`)) return;
    }
    try {
      await api.put(`/eventos-cambio-cinta/${ev.id}`, { estado: nuevaFase });
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo cambiar la fase del evento');
    }
  }

  function activosDelGrupo(horarioId) {
    return alumnos.filter((a) => a.estado === 'ACTIVO' && a.horarios?.some((h) => h.horarioId === horarioId)).map((a) => a.id);
  }

  function activosDeDisciplina(disciplinaId) {
    return alumnos
      .filter((a) => a.estado === 'ACTIVO' && a.horarios?.some((h) => h.horario.disciplinaId === disciplinaId))
      .map((a) => a.id);
  }

  async function agregarCandidatos(eventoId, alumnoIds) {
    await api.post(`/eventos-cambio-cinta/${eventoId}/candidatos`, { alumnoIds });
    cargar();
  }

  async function actualizarResultado(candidatoId, resultado) {
    try {
      await api.put(`/eventos-cambio-cinta/candidatos/${candidatoId}`, { resultado });
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo actualizar el resultado');
    }
  }

  async function togglePago(candidatoId, pagoActual) {
    await api.put(`/eventos-cambio-cinta/candidatos/${candidatoId}`, { pagoExamen: !pagoActual });
    cargar();
  }

  async function togglePresenta(candidatoId, presentaActual) {
    await api.put(`/eventos-cambio-cinta/candidatos/${candidatoId}`, { presentaExamen: !presentaActual });
    cargar();
  }

  async function actualizarTalla(candidatoId, talla) {
    await api.put(`/eventos-cambio-cinta/candidatos/${candidatoId}/talla`, { tallaConfirmada: talla });
  }

  // Agrupa los candidatos de un evento por el grupo/horario al que pertenecen (dentro de la disciplina del evento)
  function agruparPorGrupo(evento) {
    const soloPresentan = mostrarSoloPresentan[evento.id] !== false; // default: true
    const busqueda = (busquedaAlumno[evento.id] || '').toLowerCase();
    const grupoSeleccionado = filtroGrupo[evento.id] || '';

    let candidatosVisibles = soloPresentan ? evento.candidatos.filter((c) => c.presentaExamen) : evento.candidatos;
    if (busqueda) {
      candidatosVisibles = candidatosVisibles.filter((c) => c.alumno.nombreCompleto.toLowerCase().includes(busqueda));
    }

    const grupos = {};
    const sinGrupo = [];
    candidatosVisibles.forEach((c) => {
      const relacion = c.alumno.horarios?.find((h) => h.horario.disciplinaId === evento.disciplinaId);
      if (!relacion) { sinGrupo.push(c); return; }
      if (grupoSeleccionado && relacion.horarioId !== grupoSeleccionado) return;
      const key = relacion.horarioId;
      if (!grupos[key]) grupos[key] = { nombre: relacion.horario.nombre, candidatos: [] };
      grupos[key].candidatos.push(c);
    });
    return { grupos: Object.values(grupos), sinGrupo: grupoSeleccionado ? [] : sinGrupo };
  }

  function filaCandidato(c, bloqueado) {
    return (
      <tr key={c.id} className={`hover:bg-gray-50 ${!c.presentaExamen ? 'opacity-50' : ''}`}>
        <td className="px-4 py-3 font-medium text-gray-900">{c.alumno.nombreCompleto}</td>
        <td className="px-4 py-3">
          <button onClick={() => !bloqueado && togglePresenta(c.id, c.presentaExamen)} disabled={bloqueado}>
            <Badge tone={c.presentaExamen ? 'blue' : 'gray'}>{c.presentaExamen ? 'Va a examen' : 'No va a examen'}</Badge>
          </button>
        </td>
        <td className="px-4 py-3">
          <Input
            defaultValue={c.tallaConfirmada || ''}
            onBlur={(e) => actualizarTalla(c.id, e.target.value)}
            disabled={bloqueado}
            className="!w-20 !py-1 text-xs"
          />
        </td>
        <td className="px-4 py-3 text-gray-600 text-xs">{c.resultado === 'APROBADO' ? c.cintaObjetivo : '-'}</td>
        <td className="px-4 py-3"><Badge tone={resultadoTono[c.resultado]}>{c.resultado}</Badge></td>
        <td className="px-4 py-3">
          <button onClick={() => !bloqueado && togglePago(c.id, c.pagoExamen)} disabled={bloqueado}>
            <Badge tone={c.pagoExamen ? 'green' : 'amber'}>{c.pagoExamen ? 'Pagado' : 'Pendiente'}</Badge>
          </button>
        </td>
        <td className="px-4 py-3">
          {bloqueado ? (
            <span className="text-xs text-gray-400">Completado</span>
          ) : (
            <div className="flex gap-1">
              <button onClick={() => actualizarResultado(c.id, 'APROBADO')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Aprobar (calcula la siguiente cinta sola)">
                <Check size={16} />
              </button>
              <button onClick={() => actualizarResultado(c.id, 'NO_APROBADO')} className="text-red-600 hover:bg-red-50 p-1 rounded" title="No aprobó">
                <X size={16} />
              </button>
              <button onClick={() => actualizarResultado(c.id, 'NO_SE_PRESENTO')} className="text-gray-500 hover:bg-gray-100 p-1 rounded" title="No se presentó">
                <Clock size={16} />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div>
      <PageHeader
        title="Cambio de cinta"
        description="Exámenes de ascenso de grado"
        action={<Button onClick={() => setMostrarForm(!mostrarForm)}><Plus size={16} />Crear evento</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Field label="Nombre del evento">
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </Field>
            <Field label="Fecha del examen">
              <Input type="date" value={form.fechaExamen} onChange={(e) => setForm({ ...form, fechaExamen: e.target.value })} required />
            </Field>
            <Field label="Disciplina">
              <Select value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })} required>
                <option value="">Selecciona...</option>
                {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </Select>
            </Field>
            {disciplinas.length === 0 && <p className="col-span-3 text-sm text-amber-600">Primero da de alta una disciplina en Configuración.</p>}
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {eventos.length === 0 ? (
        <Card><EmptyState icon={Repeat} title="Aún no hay eventos de cambio de cinta" /></Card>
      ) : (
        <div className="space-y-3">
          {eventos.map((ev) => {
            const horariosDeLaDisciplina = horarios.filter((h) => h.disciplinaId === ev.disciplinaId);
            const { grupos, sinGrupo } = agruparPorGrupo(ev);
            return (
              <Card key={ev.id} className="overflow-hidden">
                <div className="w-full flex items-center justify-between px-5 py-4">
                  <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{ev.nombre}</p>
                        <Badge tone={estadoTono[ev.estado]}>{estadoLabel[ev.estado]}</Badge>
                      </div>
                      <p className="text-sm text-gray-400">{ev.disciplina?.nombre} · {new Date(ev.fechaExamen).toLocaleDateString()} · {ev.candidatos.length} candidatos</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <Select
                      value={ev.estado}
                      onChange={(e) => cambiarFase(ev, e.target.value)}
                      className="!w-auto !py-1.5 text-xs"
                    >
                      <option value="PLANEACION">Planeación</option>
                      <option value="EN_PROGRESO">En progreso</option>
                      <option value="COMPLETADO">Completado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </Select>
                    <button onClick={() => handleDelete(ev.id)} className="text-gray-400 hover:text-red-600 p-1.5" title="Eliminar evento por completo">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setExpandido(expandido === ev.id ? null : ev.id)} className="text-gray-400 p-1.5">
                      {expandido === ev.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {expandido === ev.id && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {(() => {
                      const vanAExamen = ev.candidatos.filter((c) => c.presentaExamen);
                      const pagados = vanAExamen.filter((c) => c.pagoExamen).length;
                      const pendientes = vanAExamen.length - pagados;
                      const datosPago = [
                        { name: 'Pagaron', value: pagados },
                        { name: 'Faltan', value: pendientes },
                      ];
                      return vanAExamen.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-6 mb-4 bg-gray-50 rounded-lg p-4">
                          <div className="flex gap-6">
                            <div>
                              <p className="text-xs text-gray-400">Van a examen</p>
                              <p className="text-lg font-semibold text-gray-900">{vanAExamen.length}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Ya pagaron</p>
                              <p className="text-lg font-semibold text-green-600">{pagados}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Faltan por pagar</p>
                              <p className="text-lg font-semibold text-amber-600">{pendientes}</p>
                            </div>
                          </div>
                          {pendientes > 0 && (
                            <div className="ml-auto" style={{ width: 140, height: 100 }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={datosPago} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={22} outerRadius={38} paddingAngle={2}>
                                    <Cell fill="#16a34a" />
                                    <Cell fill="#f59e0b" />
                                  </Pie>
                                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>
                      ) : null;
                    })()}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button variant="secondary" onClick={() => agregarCandidatos(ev.id, activosDeDisciplina(ev.disciplinaId))}>
                        Agregar todos los activos de {ev.disciplina?.nombre}
                      </Button>
                      {horariosDeLaDisciplina.map((h) => (
                        <Button key={h.id} variant="secondary" onClick={() => agregarCandidatos(ev.id, activosDelGrupo(h.id))}>
                          + Solo {h.nombre}
                        </Button>
                      ))}
                    </div>

                    {ev.candidatos.length === 0 ? (
                      <p className="text-sm text-gray-400">Sin candidatos todavía.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={mostrarSoloPresentan[ev.id] !== false}
                              onChange={(e) => setMostrarSoloPresentan({ ...mostrarSoloPresentan, [ev.id]: e.target.checked })}
                            />
                            Solo los que sí presentan
                            <span className="text-gray-400">
                              ({ev.candidatos.filter((c) => !c.presentaExamen).length} no van)
                            </span>
                          </label>

                          <Select
                            value={filtroGrupo[ev.id] || ''}
                            onChange={(e) => setFiltroGrupo({ ...filtroGrupo, [ev.id]: e.target.value })}
                            className="!w-auto max-w-[220px]"
                          >
                            <option value="">Todos los grupos</option>
                            {horariosDeLaDisciplina.map((h) => (
                              <option key={h.id} value={h.id}>{h.nombre}</option>
                            ))}
                          </Select>

                          <Input
                            placeholder="Buscar alumno..."
                            value={busquedaAlumno[ev.id] || ''}
                            onChange={(e) => setBusquedaAlumno({ ...busquedaAlumno, [ev.id]: e.target.value })}
                            className="!w-auto max-w-[200px]"
                          />
                        </div>
                        <div className="space-y-5">
                        {grupos.length === 0 && sinGrupo.length === 0 && (
                          <p className="text-sm text-gray-400">Ningún candidato coincide con los filtros actuales.</p>
                        )}
                        {grupos.map((g) => (
                          <div key={g.nombre}>
                            <p className="text-xs font-medium text-gray-500 mb-2">{g.nombre} ({g.candidatos.length})</p>
                            <Table columns={['Alumno', 'Examen', 'Talla', 'Asciende a', 'Resultado', 'Pago', 'Acciones']}>
                              {g.candidatos.map((c) => filaCandidato(c, ev.estado === 'COMPLETADO'))}
                            </Table>
                          </div>
                        ))}
                        {sinGrupo.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Sin grupo asignado ({sinGrupo.length})</p>
                            <Table columns={['Alumno', 'Examen', 'Talla', 'Asciende a', 'Resultado', 'Pago', 'Acciones']}>
                              {sinGrupo.map((c) => filaCandidato(c, ev.estado === 'COMPLETADO'))}
                            </Table>
                          </div>
                        )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
