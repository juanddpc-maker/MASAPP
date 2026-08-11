import React, { useEffect, useState } from 'react';
import { Wallet, Plus, ChevronDown, ChevronUp, Search, Trash2, Ban, RotateCcw } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Select, Field } from '../components/ui';

const estadoTono = { PENDIENTE: 'amber', PAGADO: 'green', VENCIDO: 'red', EXONERADO: 'gray' };
const estadoLabel = { PENDIENTE: 'Pendiente', PAGADO: 'Pagado', VENCIDO: 'Vencido', EXONERADO: 'Exonerado' };

export default function Pagos() {
  const [periodos, setPeriodos] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [form, setForm] = useState({ mesAnio: '', fechaLimite: '', montoDefault: '' });
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState({}); // { [periodoId]: string }
  const [filtroEstado, setFiltroEstado] = useState({}); // { [periodoId]: string }

  function cargar() {
    Promise.all([api.get('/pagos/periodos'), api.get('/alumnos')])
      .then(([p, a]) => { setPeriodos(p.data); setAlumnos(a.data); })
      .catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/pagos/periodos', { ...form, montoDefault: Number(form.montoDefault) });
      setForm({ mesAnio: '', fechaLimite: '', montoDefault: '' });
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo crear el periodo');
    }
  }

  async function agregarTodosActivos(periodoId) {
    const activos = alumnos.filter((a) => a.estado === 'ACTIVO').map((a) => a.id);
    await api.post(`/pagos/periodos/${periodoId}/candidatos`, { alumnoIds: activos });
    cargar();
  }

  async function eliminarPeriodo(id) {
    if (!confirm('¿Eliminar este periodo de pago por completo? Se borran también los registros de pago de cada alumno en este periodo. Esta acción no se puede deshacer.')) return;
    await api.delete(`/pagos/periodos/${id}`);
    cargar();
  }

  async function toggleCancelado(periodo) {
    const nuevoEstado = periodo.estado === 'CANCELADO' ? 'ABIERTO' : 'CANCELADO';
    await api.put(`/pagos/periodos/${periodo.id}`, { estado: nuevoEstado });
    cargar();
  }

  async function cambiarEstadoPago(candidatoId, estadoPago) {
    let metodoPago;
    if (estadoPago === 'PAGADO') {
      metodoPago = prompt('¿Método de pago? (efectivo, transferencia, tarjeta...)', 'Efectivo') || undefined;
    }
    await api.put(`/pagos/candidatos/${candidatoId}`, { estadoPago, metodoPago });
    cargar();
  }

  function calcularKPIs(periodo) {
    const totalACobrar = periodo.candidatos.reduce((sum, c) => sum + Number(c.montoAPagar), 0);
    const cobrado = periodo.candidatos.filter((c) => c.estadoPago === 'PAGADO').reduce((sum, c) => sum + Number(c.montoAPagar), 0);
    const pendiente = totalACobrar - cobrado;
    const porcentaje = totalACobrar > 0 ? Math.round((cobrado / totalACobrar) * 100) : 0;
    return { totalACobrar, cobrado, pendiente, porcentaje };
  }

  return (
    <div>
      <PageHeader
        title="Periodos de pago"
        description="Mensualidades y su seguimiento"
        action={<Button onClick={() => setMostrarForm(!mostrarForm)}><Plus size={16} />Crear periodo</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Field label="Mes-Año">
              <Input placeholder="2026-08" value={form.mesAnio} onChange={(e) => setForm({ ...form, mesAnio: e.target.value })} required />
            </Field>
            <Field label="Fecha límite">
              <Input type="date" value={form.fechaLimite} onChange={(e) => setForm({ ...form, fechaLimite: e.target.value })} required />
            </Field>
            <Field label="Monto default">
              <Input type="number" value={form.montoDefault} onChange={(e) => setForm({ ...form, montoDefault: e.target.value })} required />
            </Field>
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {periodos.length === 0 ? (
        <Card><EmptyState icon={Wallet} title="Aún no hay periodos de pago" /></Card>
      ) : (
        <div className="space-y-3">
          {periodos.map((p) => {
            const kpi = calcularKPIs(p);
            const busquedaTexto = (busqueda[p.id] || '').toLowerCase();
            const estadoFiltro = filtroEstado[p.id] || '';
            const candidatosVisibles = p.candidatos.filter((c) =>
              c.alumno.nombreCompleto.toLowerCase().includes(busquedaTexto) &&
              (!estadoFiltro || c.estadoPago === estadoFiltro),
            );

            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="w-full flex items-center justify-between px-5 py-4">
                  <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{p.mesAnio}</p>
                        {p.estado === 'CANCELADO' && <Badge tone="red">Cancelado</Badge>}
                      </div>
                      <p className="text-sm text-gray-400">
                        Vence {new Date(p.fechaLimite).toLocaleDateString()} · ${p.montoDefault} · {p.candidatos.length} alumnos
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    {p.candidatos.length > 0 && (
                      <span className="text-sm text-gray-500">
                        <span className="font-medium text-gray-900">{kpi.porcentaje}%</span> cobrado
                      </span>
                    )}
                    <button onClick={() => toggleCancelado(p)} className="text-gray-400 hover:text-gray-900 p-1.5" title={p.estado === 'CANCELADO' ? 'Reactivar' : 'Cancelar periodo'}>
                      {p.estado === 'CANCELADO' ? <RotateCcw size={16} /> : <Ban size={16} />}
                    </button>
                    <button onClick={() => eliminarPeriodo(p.id)} className="text-gray-400 hover:text-red-600 p-1.5" title="Eliminar periodo por completo">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setExpandido(expandido === p.id ? null : p.id)} className="text-gray-400 p-1.5">
                      {expandido === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
                {expandido === p.id && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {p.candidatos.length > 0 && (
                      <div className="flex flex-wrap gap-6 mb-4 bg-gray-50 rounded-lg p-4">
                        <div>
                          <p className="text-xs text-gray-400">Total a cobrar</p>
                          <p className="text-lg font-semibold text-gray-900">${kpi.totalACobrar.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Cobrado</p>
                          <p className="text-lg font-semibold text-green-600">${kpi.cobrado.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Pendiente</p>
                          <p className="text-lg font-semibold text-amber-600">${kpi.pendiente.toLocaleString()}</p>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <p className="text-xs text-gray-400 mb-1">% cobrado</p>
                          <div className="bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${kpi.porcentaje}%` }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <Button variant="secondary" className="mb-4" onClick={() => agregarTodosActivos(p.id)}>
                      Agregar todos los alumnos activos
                    </Button>

                    {p.candidatos.length === 0 ? (
                      <p className="text-sm text-gray-400">Sin alumnos agregados todavía.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-3 items-center mb-3">
                          <div className="relative max-w-[200px]">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input
                              placeholder="Buscar alumno..."
                              value={busqueda[p.id] || ''}
                              onChange={(e) => setBusqueda({ ...busqueda, [p.id]: e.target.value })}
                              className="!pl-8"
                            />
                          </div>
                          <Select value={estadoFiltro} onChange={(e) => setFiltroEstado({ ...filtroEstado, [p.id]: e.target.value })} className="!w-auto">
                            <option value="">Todos los estados</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="PAGADO">Pagado</option>
                            <option value="VENCIDO">Vencido</option>
                            <option value="EXONERADO">Exonerado</option>
                          </Select>
                        </div>

                        {candidatosVisibles.length === 0 ? (
                          <p className="text-sm text-gray-400">Nadie coincide con los filtros actuales.</p>
                        ) : (
                          <Table columns={['Alumno', 'Monto', 'Estado', 'Fecha de pago', 'Cambiar a']}>
                            {candidatosVisibles.map((c) => (
                              <tr key={c.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{c.alumno.nombreCompleto}</td>
                                <td className="px-4 py-3 text-gray-600">
                                  ${c.montoAPagar}
                                  {Number(c.montoAPagar) > Number(p.montoDefault) && (
                                    <span className="text-xs text-blue-600 ml-1" title="Incluye costo extra por horario adicional">
                                      (+${(Number(c.montoAPagar) - Number(p.montoDefault)).toFixed(2)} extra)
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3"><Badge tone={estadoTono[c.estadoPago]}>{estadoLabel[c.estadoPago]}</Badge></td>
                                <td className="px-4 py-3 text-gray-500 text-xs">
                                  {c.fechaPago ? new Date(c.fechaPago).toLocaleDateString() : '-'}
                                  {c.metodoPago && <span className="text-gray-400"> ({c.metodoPago})</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <Select value={c.estadoPago} onChange={(e) => cambiarEstadoPago(c.id, e.target.value)} className="!w-auto text-xs py-1">
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="PAGADO">Pagado</option>
                                    <option value="VENCIDO">Vencido</option>
                                    <option value="EXONERADO">Exonerado</option>
                                  </Select>
                                </td>
                              </tr>
                            ))}
                          </Table>
                        )}
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
