import React, { useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Select } from '../components/ui';

const tipoTono = { POSITIVO: 'green', NEGATIVO: 'red', NEUTRO: 'gray' };

export default function Comportamiento() {
  const [registros, setRegistros] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ alumnoId: '', tipo: 'NEUTRO', categoria: '', descripcion: '', notificarTutor: false });
  const [error, setError] = useState('');

  function cargar() {
    Promise.all([api.get('/comportamiento'), api.get('/alumnos')])
      .then(([r, a]) => { setRegistros(r.data); setAlumnos(a.data); })
      .catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/comportamiento', form);
      setForm({ alumnoId: '', tipo: 'NEUTRO', categoria: '', descripcion: '', notificarTutor: false });
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo crear el registro');
    }
  }

  return (
    <div>
      <PageHeader
        title="Comportamiento"
        description="Bitácora de conducta de los alumnos"
        action={<Button onClick={() => setMostrarForm(!mostrarForm)}><Plus size={16} />Nuevo registro</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <Select value={form.alumnoId} onChange={(e) => setForm({ ...form, alumnoId: e.target.value })} required>
              <option value="">Alumno</option>
              {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
            </Select>
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="POSITIVO">Positivo</option>
              <option value="NEGATIVO">Negativo</option>
              <option value="NEUTRO">Neutro</option>
            </Select>
            <input
              placeholder="Categoría (disciplina, actitud...)" value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg" required
            />
            <textarea
              placeholder="Descripción" value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg" rows={3} required
            />
            <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.notificarTutor} onChange={(e) => setForm({ ...form, notificarTutor: e.target.checked })} />
              Notificar al tutor (crea una conversación)
            </label>
            {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
            <div className="col-span-2 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {registros.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Aún no hay registros de comportamiento" />
        ) : (
          <Table columns={['Alumno', 'Tipo', 'Categoría', 'Fecha', 'Seguimiento']}>
            {registros.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.alumno?.nombreCompleto}</td>
                <td className="px-4 py-3"><Badge tone={tipoTono[r.tipo]}>{r.tipo}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{r.categoria}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(r.fecha).toLocaleDateString()}</td>
                <td className="px-4 py-3">{r.requiereSeguimiento && <Badge tone="amber">Pendiente</Badge>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
