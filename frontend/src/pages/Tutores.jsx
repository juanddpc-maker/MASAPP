import React, { useEffect, useState } from 'react';
import { UserSquare2, Plus, Trash2, Pencil, RotateCcw, KeyRound } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Field, Modal, DIAS_LABEL, formatHora12 } from '../components/ui';

const vacio = { nombre: '', telefono: '', correo: '', relacion: '' };

export default function Tutores() {
  const [tutores, setTutores] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(vacio);
  const [error, setError] = useState('');
  const [credenciales, setCredenciales] = useState(null);
  const [detalleTutor, setDetalleTutor] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  function cargar() {
    api.get('/tutores').then((res) => setTutores(res.data)).catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  function abrirNuevo() {
    setForm(vacio);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEditar(t) {
    setForm({ nombre: t.nombre, telefono: t.telefono, correo: t.correo || '', relacion: t.relacion });
    setEditandoId(t.id);
    setMostrarForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await api.put(`/tutores/${editandoId}`, form);
      } else {
        await api.post('/tutores', form);
      }
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo guardar el tutor');
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Desactivar este tutor?')) return;
    try {
      await api.delete(`/tutores/${id}`);
      cargar();
    } catch {
      alert('No se pudo desactivar: el tutor tiene alumnos activos asociados');
    }
  }

  async function handleReactivar(id) {
    await api.put(`/tutores/${id}`, { activo: true });
    cargar();
  }

  async function generarAcceso(t) {
    const correoLogin = prompt('Correo para iniciar sesión (puede ser distinto al de contacto):', t.correo || '');
    if (!correoLogin) return;
    try {
      const { data } = await api.post(`/tutores/${t.id}/generar-acceso`, { correo: correoLogin });
      setCredenciales(data);
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo generar el acceso');
    }
  }

  async function regenerarAcceso(t) {
    if (!confirm(`¿Generar una nueva contraseña temporal para ${t.usuario.correo}? La anterior dejará de funcionar.`)) return;
    const { data } = await api.post(`/usuarios/${t.usuario.id}/reset-password`);
    setCredenciales(data);
  }

  const tutoresFiltrados = tutores.filter((t) => mostrarInactivos || t.activo);

  return (
    <div>
      <PageHeader
        title="Tutores"
        description="Padres y responsables de los alumnos"
        action={<Button onClick={abrirNuevo}><Plus size={16} />Agregar tutor</Button>}
      />

      {credenciales && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-900">Acceso generado</p>
          <p className="text-sm text-amber-800 mt-1">
            Correo: <span className="font-mono">{credenciales.correo}</span> · Contraseña temporal:{' '}
            <span className="font-mono">{credenciales.passwordTemporal}</span>
          </p>
          <p className="text-xs text-amber-700 mt-1">Compártela ahora — no se volverá a mostrar.</p>
          <button className="text-xs text-amber-700 underline mt-2" onClick={() => setCredenciales(null)}>Cerrar</button>
        </Card>
      )}

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <Field label="Nombre">
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </Field>
            <Field label="Teléfono">
              <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} required />
            </Field>
            <Field label="Correo de contacto (opcional)">
              <Input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
            </Field>
            <Field label="Relación">
              <Input placeholder="Padre, madre, tutor legal..." value={form.relacion} onChange={(e) => setForm({ ...form, relacion: e.target.value })} required />
            </Field>
            <p className="col-span-2 text-xs text-gray-400 -mt-1">
              El correo de contacto es solo informativo. El acceso al sistema (login) se genera aparte, después de guardar.
            </p>
            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
        Mostrar inactivos
      </label>

      <Card>
        {tutoresFiltrados.length === 0 ? (
          <EmptyState icon={UserSquare2} title="Aún no hay tutores" />
        ) : (
          <Table columns={['Nombre', 'Teléfono', 'Correo de contacto', 'Relación', 'Alumnos', 'Acceso', 'Estado', '']}>
            {tutoresFiltrados.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => setDetalleTutor(t)} title="Doble clic para ver sus alumnos">
                <td className="px-4 py-3 font-medium text-gray-900">{t.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{t.telefono}</td>
                <td className="px-4 py-3 text-gray-600">{t.correo || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{t.relacion}</td>
                <td className="px-4 py-3 text-gray-600">{t.alumnos?.length || 0}</td>
                <td className="px-4 py-3">
                  {t.usuario ? (
                    <button onClick={(e) => { e.stopPropagation(); regenerarAcceso(t); }} className="inline-flex items-center gap-1.5 group" title="Clic para regenerar contraseña">
                      <Badge tone="green">{t.usuario.correo}</Badge>
                      <RotateCcw size={12} className="text-gray-300 group-hover:text-gray-600" />
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); generarAcceso(t); }} className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 text-xs">
                      <KeyRound size={13} /> Generar acceso
                    </button>
                  )}
                </td>
                <td className="px-4 py-3"><Badge tone={t.activo ? 'green' : 'gray'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={(e) => { e.stopPropagation(); abrirEditar(t); }} className="text-gray-400 hover:text-gray-900 inline-block"><Pencil size={16} /></button>
                  {t.activo ? (
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="text-gray-400 hover:text-red-600 inline-block"><Trash2 size={16} /></button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleReactivar(t.id); }} className="text-gray-400 hover:text-green-600 inline-block"><RotateCcw size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!detalleTutor} onClose={() => setDetalleTutor(null)} title={detalleTutor?.nombre || ''}>
        {detalleTutor && (
          <div>
            <p className="text-sm text-gray-500 mb-3">{detalleTutor.alumnos?.length || 0} alumno(s) asignado(s)</p>
            {detalleTutor.alumnos?.length > 0 ? (
              <div className="space-y-3">
                {detalleTutor.alumnos.map((rel) => (
                  <div key={rel.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{rel.alumno.nombreCompleto}</p>
                      {rel.alumno.horarios.length > 0 ? (
                        rel.alumno.horarios.map((h) => (
                          <p key={h.id} className="text-xs text-gray-500">
                            {h.horario.disciplina.nombre} — {h.horario.nombre}{h.esPrincipal ? '' : ' (extra)'} ·{' '}
                            {h.horario.dias.map((d) => DIAS_LABEL[d]).join('/')} {formatHora12(h.horario.horaInicio)}-{formatHora12(h.horario.horaFin)}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">Sin clase asignada</p>
                      )}
                    </div>
                    <Badge tone="blue">{rel.alumno.cintaActual?.nombre || 'Sin cinta'}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Este tutor aún no tiene alumnos asignados.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
