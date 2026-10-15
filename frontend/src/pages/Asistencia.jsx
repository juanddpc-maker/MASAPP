import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Clock, Check, X, History } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Select, Input, Field } from '../components/ui';

function hoyISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function Asistencia() {
  const [horarios, setHorarios] = useState([]);
  const [horarioId, setHorarioId] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    api.get('/horarios').then((res) => setHorarios(res.data));
  }, []);

  useEffect(() => {
    if (!horarioId) { setSesion(null); return; }
    cargarSesion();
    setMostrarHistorial(false);
  }, [horarioId, fecha]);

  function cargarSesion() {
    setCargando(true);
    api.get('/asistencia/sesion', { params: { horarioId, fecha } })
      .then((res) => setSesion(res.data))
      .finally(() => setCargando(false));
  }

  async function marcar(alumnoId, estadoActual, estadoNuevo) {
    // Si ya estaba en ese estado, lo desmarca (vuelve a ausente); si no, lo marca
    const estado = estadoActual === estadoNuevo ? undefined : estadoNuevo;
    await api.post('/asistencia/marcar', { horarioId, fecha, alumnoId, estado });
    cargarSesion();
  }

  async function verHistorial() {
    setMostrarHistorial(!mostrarHistorial);
    if (!mostrarHistorial) {
      const { data } = await api.get(`/asistencia/historial/${horarioId}`);
      setHistorial(data);
    }
  }

  const horarioActual = horarios.find((h) => h.id === horarioId);
  const presentes = sesion?.alumnos.filter((a) => a.estado === 'PRESENTE').length || 0;
  const retardos = sesion?.alumnos.filter((a) => a.estado === 'RETARDO').length || 0;
  const ausentes = (sesion?.alumnos.length || 0) - presentes - retardos;

  return (
    <div>
      <PageHeader title="Asistencia" description="Toma lista de la clase seleccionada" />

      <Card className="p-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Clase / Grupo">
            <Select value={horarioId} onChange={(e) => setHorarioId(e.target.value)}>
              <option value="">Selecciona un grupo...</option>
              {horarios.map((h) => (
                <option key={h.id} value={h.id}>{h.disciplina.nombre} — {h.nombre}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de la clase">
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>
        </div>
      </Card>

      {!horarioId ? (
        <Card><EmptyState icon={ClipboardCheck} title="Selecciona un grupo para tomar asistencia" /></Card>
      ) : cargando ? (
        <Card><p className="p-6 text-sm text-gray-400">Cargando...</p></Card>
      ) : (
        <>
          <Card className="p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-gray-400">Presentes</p>
                <p className="text-lg font-semibold text-green-600">{presentes}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Retardos</p>
                <p className="text-lg font-semibold text-amber-600">{retardos}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ausentes</p>
                <p className="text-lg font-semibold text-gray-500">{ausentes}</p>
              </div>
            </div>
            <button onClick={verHistorial} className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1.5">
              <History size={15} /> {mostrarHistorial ? 'Ocultar historial' : 'Ver historial de este grupo'}
            </button>
          </Card>

          {mostrarHistorial && (
            <Card className="p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Sesiones anteriores</p>
              {historial.length === 0 ? (
                <p className="text-sm text-gray-400">Sin sesiones registradas todavía.</p>
              ) : (
                <div className="space-y-1">
                  {historial.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFecha(new Date(s.fecha).toISOString().slice(0, 10))}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-left"
                    >
                      <span className="text-gray-900">{new Date(s.fecha).toLocaleDateString()}</span>
                      <span className="text-gray-400">
                        {s.registros.filter((r) => r.estado === 'PRESENTE').length} presentes ·{' '}
                        {s.registros.filter((r) => r.estado === 'RETARDO').length} retardos
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card>
            {sesion?.alumnos.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="Este grupo no tiene alumnos activos" />
            ) : (
              <Table columns={['Alumno', 'Estado', 'Hora', 'Marcar']}>
                {sesion?.alumnos.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.nombreCompleto}</td>
                    <td className="px-4 py-3">
                      {a.estado === 'PRESENTE' && <Badge tone="green">Presente</Badge>}
                      {a.estado === 'RETARDO' && <Badge tone="amber">Retardo</Badge>}
                      {!a.estado && <Badge tone="gray">Ausente</Badge>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {a.horaMarcado ? new Date(a.horaMarcado).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => marcar(a.id, a.estado, 'PRESENTE')}
                          className={`p-1.5 rounded-lg ${a.estado === 'PRESENTE' ? 'bg-green-600 text-white' : 'text-green-600 hover:bg-green-50'}`}
                          title="Marcar presente"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => marcar(a.id, a.estado, 'RETARDO')}
                          className={`p-1.5 rounded-lg ${a.estado === 'RETARDO' ? 'bg-amber-500 text-white' : 'text-amber-600 hover:bg-amber-50'}`}
                          title="Marcar retardo"
                        >
                          <Clock size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
