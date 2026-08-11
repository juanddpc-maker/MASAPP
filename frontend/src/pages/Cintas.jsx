import React, { useEffect, useState } from 'react';
import { Award, Plus, Trash2, Pencil, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import api from '../lib/api';
import { Card, Table, EmptyState, PageHeader, Button, Input, Select, Field, Modal, Badge, CintaVisual } from '../components/ui';

const vacio = { nombre: '', orden: '', disciplinaId: '', color1: '#FFFFFF', color2: '#FFFFFF', color3: '#FFFFFF' };

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
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

export default function Cintas() {
  const [cintas, setCintas] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');

  const [cintaSeleccionada, setCintaSeleccionada] = useState(null);
  const [alumnosDeCinta, setAlumnosDeCinta] = useState([]);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [conteos, setConteos] = useState([]);

  function cargar() {
    Promise.all([api.get('/cintas'), api.get('/disciplinas'), api.get('/cintas/conteo-alumnos')])
      .then(([c, d, cn]) => { setCintas(c.data); setDisciplinas(d.data); setConteos(cn.data); })
      .catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  function abrirNuevo() {
    setForm(vacio);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEditar(c) {
    setForm({
      nombre: c.nombre, orden: String(c.orden), disciplinaId: c.disciplinaId,
      color1: c.color1 || '#FFFFFF', color2: c.color2 || '#FFFFFF', color3: c.color3 || '#FFFFFF',
    });
    setEditandoId(c.id);
    setMostrarForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, orden: Number(form.orden) };
      if (editandoId) {
        await api.put(`/cintas/${editandoId}`, payload);
      } else {
        await api.post('/cintas', payload);
      }
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo guardar la cinta');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta cinta del catálogo?')) return;
    await api.delete(`/cintas/${id}`);
    cargar();
  }

  async function verAlumnos(cinta) {
    setCintaSeleccionada(cinta);
    setCargandoAlumnos(true);
    try {
      const { data } = await api.get(`/cintas/${cinta.id}/alumnos`);
      setAlumnosDeCinta(data);
    } finally {
      setCargandoAlumnos(false);
    }
  }

  const datosGrafica = [...cintas]
    .sort((a, b) => a.orden - b.orden)
    .map((c) => ({
      nombre: c.nombre,
      disciplina: c.disciplina?.nombre,
      cantidad: conteos.find((cn) => cn.cintaId === c.id)?.cantidad || 0,
    }));

  return (
    <div>
      <PageHeader
        title="Catálogo de cintas"
        description="Grados y niveles por disciplina — doble clic en una cinta para ver quién la tiene"
        action={<Button onClick={abrirNuevo}><Plus size={16} />Agregar cinta</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Field label="Nombre">
              <Input placeholder="ej. Naranja, o Blanco-Amarillo-Blanco" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </Field>
            <Field label="Orden">
              <Input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: e.target.value })} required />
            </Field>
            <Field label="Disciplina">
              <Select value={form.disciplinaId} onChange={(e) => setForm({ ...form, disciplinaId: e.target.value })} required>
                <option value="">Selecciona...</option>
                {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </Select>
            </Field>

            <Field label="Color franja 1">
              <input type="color" value={form.color1} onChange={(e) => setForm({ ...form, color1: e.target.value })} className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer" />
            </Field>
            <Field label="Color franja 2">
              <input type="color" value={form.color2} onChange={(e) => setForm({ ...form, color2: e.target.value })} className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer" />
            </Field>
            <Field label="Color franja 3">
              <input type="color" value={form.color3} onChange={(e) => setForm({ ...form, color3: e.target.value })} className="w-full h-9 rounded-lg border border-gray-300 cursor-pointer" />
            </Field>

            <div className="col-span-3 flex items-center gap-2">
              <span className="text-xs text-gray-500">Vista previa:</span>
              <CintaVisual color1={form.color1} color2={form.color2} color3={form.color3} width={80} height={22} />
              <span className="text-xs text-gray-400">Para cintas de un solo color, elige el mismo color en las 3 franjas.</span>
            </div>

            {disciplinas.length === 0 && <p className="col-span-3 text-sm text-amber-600">Primero da de alta una disciplina en Configuración.</p>}
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {datosGrafica.some((d) => d.cantidad > 0) && (
        <Card className="p-5 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Alumnos activos por cinta</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={datosGrafica} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                labelStyle={{ fontWeight: 600 }}
                formatter={(value) => [`${value} alumnos`, '']}
              />
              <Bar dataKey="cantidad" fill="#185fa5" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card>
        {cintas.length === 0 ? (
          <EmptyState icon={Award} title="Aún no hay cintas en el catálogo" />
        ) : (
          <Table columns={['Orden', 'Visual', 'Nombre', 'Disciplina', '']}>
            {cintas.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => verAlumnos(c)} title="Doble clic para ver alumnos con esta cinta">
                <td className="px-4 py-3 text-gray-600">{c.orden}</td>
                <td className="px-4 py-3"><CintaVisual color1={c.color1} color2={c.color2} color3={c.color3} /></td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{c.disciplina?.nombre}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={(e) => { e.stopPropagation(); abrirEditar(c); }} className="text-gray-400 hover:text-gray-900 inline-block"><Pencil size={16} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="text-gray-400 hover:text-red-600 inline-block"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={!!cintaSeleccionada}
        onClose={() => setCintaSeleccionada(null)}
        title={
          <span className="flex items-center gap-2">
            <CintaVisual color1={cintaSeleccionada?.color1} color2={cintaSeleccionada?.color2} color3={cintaSeleccionada?.color3} />
            Cinta {cintaSeleccionada?.nombre || ''}
          </span>
        }
      >
        {cargandoAlumnos ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <div>
            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-semibold text-gray-900">{alumnosDeCinta.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Masculinos</p>
                <p className="text-lg font-semibold text-gray-900">{alumnosDeCinta.filter((a) => a.genero === 'MASCULINO').length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Femeninos</p>
                <p className="text-lg font-semibold text-gray-900">{alumnosDeCinta.filter((a) => a.genero === 'FEMENINO').length}</p>
              </div>
            </div>

            {alumnosDeCinta.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-sm text-gray-400">Ningún alumno activo tiene esta cinta actualmente.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Distribución por edad</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={distribucionEdades(alumnosDeCinta)} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0efe9" />
                      <XAxis dataKey="edad" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} labelStyle={{ fontWeight: 600 }} />
                      <Bar dataKey="cantidad" fill="#185fa5" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-xs font-medium text-gray-500 mb-2">Alumnos</p>
                <div className="space-y-2">
                  {alumnosDeCinta.map((a) => (
                    <div key={a.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                      <p className="font-medium text-gray-900 text-sm">{a.nombreCompleto}</p>
                      <Badge tone="gray">
                        {a.horarios.map((h) => h.horario.nombre).join(', ') || 'Sin grupo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
