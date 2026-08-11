import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Ban, Pencil, RotateCcw, KeyRound } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Select, Field } from '../components/ui';

const rolTono = { ADMINISTRADOR: 'blue', INSTRUCTOR: 'amber', TUTOR: 'gray' };
const vacioCrear = { nombre: '', correo: '', password: '', rol: 'INSTRUCTOR' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(vacioCrear);
  const [error, setError] = useState('');
  const [credenciales, setCredenciales] = useState(null);

  function cargar() {
    api.get('/usuarios').then((res) => setUsuarios(res.data)).catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  function abrirNuevo() {
    setForm(vacioCrear);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEditar(u) {
    setForm({ nombre: u.nombre, correo: u.correo, rol: u.rol, activo: u.activo });
    setEditandoId(u.id);
    setMostrarForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (editandoId) {
        await api.put(`/usuarios/${editandoId}`, { nombre: form.nombre, correo: form.correo, rol: form.rol, activo: form.activo });
      } else {
        await api.post('/usuarios', form);
      }
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el usuario');
    }
  }

  async function handleDesactivar(id) {
    if (!confirm('¿Desactivar este usuario?')) return;
    await api.delete(`/usuarios/${id}`);
    cargar();
  }

  async function handleReactivar(id) {
    await api.put(`/usuarios/${id}`, { activo: true });
    cargar();
  }

  async function handleResetPassword(u) {
    if (!confirm(`¿Generar una nueva contraseña temporal para ${u.correo}? La anterior dejará de funcionar.`)) return;
    const { data } = await api.post(`/usuarios/${u.id}/reset-password`);
    setCredenciales(data);
  }

  return (
    <div>
      <PageHeader
        title="Usuarios del sistema"
        description="Administradores, instructores y accesos de tutores"
        action={<Button onClick={abrirNuevo}><Plus size={16} />Crear usuario</Button>}
      />

      {credenciales && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
          <p className="text-sm font-medium text-amber-900">Contraseña regenerada</p>
          <p className="text-sm text-amber-800 mt-1">
            Correo: <span className="font-mono">{credenciales.correo}</span> · Nueva contraseña temporal:{' '}
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

            <Field label="Correo (login)">
              <Input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
            </Field>

            {!editandoId && (
              <Field label="Contraseña inicial">
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </Field>
            )}

            <Field label="Rol">
              <Select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="TUTOR">Tutor</option>
              </Select>
            </Field>

            {editandoId && (
              <Field label="Estado">
                <Select value={form.activo ? 'true' : 'false'} onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </Select>
              </Field>
            )}

            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {usuarios.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Aún no hay usuarios adicionales" />
        ) : (
          <Table columns={['Nombre', 'Correo (login)', 'Rol', 'Estado', '']}>
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{u.correo}</td>
                <td className="px-4 py-3"><Badge tone={rolTono[u.rol]}>{u.rol}</Badge></td>
                <td className="px-4 py-3"><Badge tone={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => handleResetPassword(u)} className="text-gray-400 hover:text-gray-900 inline-block" title="Regenerar contraseña"><KeyRound size={16} /></button>
                  <button onClick={() => abrirEditar(u)} className="text-gray-400 hover:text-gray-900 inline-block" title="Editar"><Pencil size={16} /></button>
                  {u.activo ? (
                    <button onClick={() => handleDesactivar(u.id)} className="text-gray-400 hover:text-red-600 inline-block" title="Desactivar"><Ban size={16} /></button>
                  ) : (
                    <button onClick={() => handleReactivar(u.id)} className="text-gray-400 hover:text-green-600 inline-block" title="Reactivar"><RotateCcw size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
