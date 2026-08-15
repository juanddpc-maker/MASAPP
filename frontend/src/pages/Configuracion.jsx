import React, { useEffect, useState } from 'react';
import { Trash2, Pencil, X } from 'lucide-react';
import api from '../lib/api';
import { Card, PageHeader, Button, Input, Select, Table, Field, DiasSemanaSelect, TimeSelect, formatHora12, DIAS_LABEL } from '../components/ui';

const horarioVacio = { disciplinaId: '', nombre: '', dias: [], horaInicio: '17:00', horaFin: '18:00', costoExtra: '' };

export default function Configuracion() {
  const [escuela, setEscuela] = useState({ nombre: '', logoUrl: '' });
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');

  const [disciplinas, setDisciplinas] = useState([]);
  const [nuevaDisciplina, setNuevaDisciplina] = useState('');
  const [editandoDisciplinaId, setEditandoDisciplinaId] = useState(null);
  const [nombreEditadoDisciplina, setNombreEditadoDisciplina] = useState('');

  const [horarios, setHorarios] = useState([]);
  const [formHorario, setFormHorario] = useState(horarioVacio);
  const [editandoHorarioId, setEditandoHorarioId] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [editandoCategoriaId, setEditandoCategoriaId] = useState(null);
  const [nombreEditadoCategoria, setNombreEditadoCategoria] = useState('');

  function cargar() {
    api.get('/escuela').then((res) => setEscuela({ nombre: res.data.nombre, logoUrl: res.data.logoUrl || '' }));
    api.get('/disciplinas').then((res) => setDisciplinas(res.data));
    api.get('/horarios').then((res) => setHorarios(res.data));
    api.get('/categorias').then((res) => setCategorias(res.data));
  }
  useEffect(cargar, []);

  async function guardarEscuela(e) {
    e.preventDefault();
    setError('');
    setGuardado(false);
    try {
      await api.put('/escuela', escuela);
      setGuardado(true);
    } catch {
      setError('No se pudo guardar');
    }
  }

  // --- Disciplinas ---
  async function agregarDisciplina(e) {
    e.preventDefault();
    if (!nuevaDisciplina.trim()) return;
    try {
      await api.post('/disciplinas', { nombre: nuevaDisciplina });
      setNuevaDisciplina('');
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo agregar la disciplina. Si el problema persiste, cierra sesión y vuelve a entrar.');
    }
  }

  function abrirEditarDisciplina(d) {
    setEditandoDisciplinaId(d.id);
    setNombreEditadoDisciplina(d.nombre);
  }

  async function guardarDisciplinaEditada(id) {
    if (!nombreEditadoDisciplina.trim()) return;
    await api.put(`/disciplinas/${id}`, { nombre: nombreEditadoDisciplina });
    setEditandoDisciplinaId(null);
    cargar();
  }

  async function eliminarDisciplina(id) {
    if (!confirm('¿Eliminar esta disciplina?')) return;
    try {
      await api.delete(`/disciplinas/${id}`);
      cargar();
    } catch {
      alert('No se puede eliminar: tiene horarios asociados');
    }
  }

  // --- Categorías (inventario) ---
  async function agregarCategoria(e) {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      await api.post('/categorias', { nombre: nuevaCategoria });
      setNuevaCategoria('');
      cargar();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo agregar la categoría. Si el problema persiste, cierra sesión y vuelve a entrar.');
    }
  }

  function abrirEditarCategoria(c) {
    setEditandoCategoriaId(c.id);
    setNombreEditadoCategoria(c.nombre);
  }

  async function guardarCategoriaEditada(id) {
    if (!nombreEditadoCategoria.trim()) return;
    await api.put(`/categorias/${id}`, { nombre: nombreEditadoCategoria });
    setEditandoCategoriaId(null);
    cargar();
  }

  async function eliminarCategoria(id) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    try {
      await api.delete(`/categorias/${id}`);
      cargar();
    } catch {
      alert('No se puede eliminar: tiene productos asociados');
    }
  }

  // --- Horarios ---
  function abrirNuevoHorario() {
    setFormHorario(horarioVacio);
    setEditandoHorarioId(null);
  }

  function abrirEditarHorario(h) {
    setFormHorario({
      disciplinaId: h.disciplinaId, nombre: h.nombre, dias: h.dias, horaInicio: h.horaInicio, horaFin: h.horaFin,
      costoExtra: h.costoExtra != null ? String(h.costoExtra) : '',
    });
    setEditandoHorarioId(h.id);
  }

  async function guardarHorario(e) {
    e.preventDefault();
    if (!formHorario.disciplinaId || !formHorario.nombre || formHorario.dias.length === 0) return;
    const payload = { ...formHorario, costoExtra: formHorario.costoExtra ? Number(formHorario.costoExtra) : null };
    if (editandoHorarioId) {
      await api.put(`/horarios/${editandoHorarioId}`, payload);
    } else {
      await api.post('/horarios', payload);
    }
    abrirNuevoHorario();
    cargar();
  }

  async function eliminarHorario(id) {
    if (!confirm('¿Eliminar este horario?')) return;
    await api.delete(`/horarios/${id}`);
    cargar();
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Configuración" description="Datos de la escuela, disciplinas y horarios" />

      <Card className="p-6 max-w-lg">
        <h2 className="font-medium text-gray-900 mb-4">Escuela</h2>
        <form onSubmit={guardarEscuela} className="space-y-4">
          <Field label="Nombre de la escuela">
            <Input value={escuela.nombre} onChange={(e) => setEscuela({ ...escuela, nombre: e.target.value })} />
          </Field>
          <Field label="URL del logo (opcional)">
            <Input placeholder="https://..." value={escuela.logoUrl} onChange={(e) => setEscuela({ ...escuela, logoUrl: e.target.value })} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {guardado && <p className="text-sm text-green-600">Guardado. Refresca la página para verlo en el menú.</p>}
          <Button type="submit">Guardar cambios</Button>
        </form>
      </Card>

      <Card className="p-6 max-w-lg">
        <h2 className="font-medium text-gray-900 mb-4">Disciplinas</h2>
        <form onSubmit={agregarDisciplina} className="flex gap-2 mb-4">
          <Input placeholder="Nombre (ej. Karate)" value={nuevaDisciplina} onChange={(e) => setNuevaDisciplina(e.target.value)} />
          <Button type="submit">Agregar</Button>
        </form>
        <div className="space-y-1">
          {disciplinas.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
              {editandoDisciplinaId === d.id ? (
                <>
                  <Input value={nombreEditadoDisciplina} onChange={(e) => setNombreEditadoDisciplina(e.target.value)} className="mr-2" />
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => guardarDisciplinaEditada(d.id)} className="text-green-600 text-xs font-medium">Guardar</button>
                    <button onClick={() => setEditandoDisciplinaId(null)} className="text-gray-400"><X size={14} /></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-gray-900">{d.nombre}</span>
                  <div className="flex gap-2">
                    <button onClick={() => abrirEditarDisciplina(d)} className="text-gray-400 hover:text-gray-900"><Pencil size={14} /></button>
                    <button onClick={() => eliminarDisciplina(d.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {disciplinas.length === 0 && <p className="text-sm text-gray-400">Aún no hay disciplinas.</p>}
        </div>
      </Card>

      <Card className="p-6 max-w-2xl">
        <h2 className="font-medium text-gray-900 mb-4">Horarios</h2>
        <form onSubmit={guardarHorario} className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Disciplina">
              <Select value={formHorario.disciplinaId} onChange={(e) => setFormHorario({ ...formHorario, disciplinaId: e.target.value })}>
                <option value="">Selecciona...</option>
                {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Nombre del grupo">
              <Input placeholder="ej. Grupo A" value={formHorario.nombre} onChange={(e) => setFormHorario({ ...formHorario, nombre: e.target.value })} />
            </Field>
          </div>

          <Field label="Días de la semana (uno o más)">
            <DiasSemanaSelect selected={formHorario.dias} onChange={(dias) => setFormHorario({ ...formHorario, dias })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora de inicio">
              <TimeSelect value={formHorario.horaInicio} onChange={(horaInicio) => setFormHorario({ ...formHorario, horaInicio })} />
            </Field>
            <Field label="Hora de fin">
              <TimeSelect value={formHorario.horaFin} onChange={(horaFin) => setFormHorario({ ...formHorario, horaFin })} />
            </Field>
          </div>

          <Field label="Costo extra (opcional)">
            <Input
              type="number"
              placeholder="ej. 150 — se cobra aparte SOLO si es un horario extra del alumno, no el principal"
              value={formHorario.costoExtra}
              onChange={(e) => setFormHorario({ ...formHorario, costoExtra: e.target.value })}
            />
          </Field>

          <div className="flex gap-2">
            <Button type="submit">{editandoHorarioId ? 'Guardar cambios' : 'Agregar horario'}</Button>
            {editandoHorarioId && <Button type="button" variant="secondary" onClick={abrirNuevoHorario}>Cancelar edición</Button>}
          </div>
        </form>
        <Table columns={['Disciplina', 'Grupo', 'Días', 'Hora', 'Costo extra', '']}>
          {horarios.map((h) => (
            <tr key={h.id}>
              <td className="px-4 py-3 text-gray-600">{h.disciplina.nombre}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{h.nombre}</td>
              <td className="px-4 py-3 text-gray-600">{h.dias.map((d) => DIAS_LABEL[d]).join(', ')}</td>
              <td className="px-4 py-3 text-gray-600">{formatHora12(h.horaInicio)} – {formatHora12(h.horaFin)}</td>
              <td className="px-4 py-3 text-gray-600">{h.costoExtra ? `$${h.costoExtra}` : '-'}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <button onClick={() => abrirEditarHorario(h)} className="text-gray-400 hover:text-gray-900 inline-block"><Pencil size={14} /></button>
                <button onClick={() => eliminarHorario(h.id)} className="text-gray-400 hover:text-red-600 inline-block"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </Table>
        {horarios.length === 0 && <p className="text-sm text-gray-400 mt-2">Aún no hay horarios.</p>}
      </Card>

      <Card className="p-6 max-w-lg">
        <h2 className="font-medium text-gray-900 mb-4">Categorías de inventario</h2>
        <form onSubmit={agregarCategoria} className="flex gap-2 mb-4">
          <Input placeholder="Nombre (ej. Uniforme)" value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} />
          <Button type="submit">Agregar</Button>
        </form>
        <div className="space-y-1">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
              {editandoCategoriaId === c.id ? (
                <>
                  <Input value={nombreEditadoCategoria} onChange={(e) => setNombreEditadoCategoria(e.target.value)} className="mr-2" />
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => guardarCategoriaEditada(c.id)} className="text-green-600 text-xs font-medium">Guardar</button>
                    <button onClick={() => setEditandoCategoriaId(null)} className="text-gray-400"><X size={14} /></button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-gray-900">{c.nombre}</span>
                  <div className="flex gap-2">
                    <button onClick={() => abrirEditarCategoria(c)} className="text-gray-400 hover:text-gray-900"><Pencil size={14} /></button>
                    <button onClick={() => eliminarCategoria(c.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          {categorias.length === 0 && <p className="text-sm text-gray-400">Aún no hay categorías.</p>}
        </div>
      </Card>
    </div>
  );
}
