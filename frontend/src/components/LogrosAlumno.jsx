import React, { useState } from 'react';
import { Trophy, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';
import { Input, Button } from './ui';

const vacio = { titulo: '', fecha: new Date().toISOString().slice(0, 10), descripcion: '' };

// Logros del alumno (torneos, reconocimientos...). Se capturan a mano.
// `puedeEditar`: admin e instructor. Los tutores solo ven la lista.
export default function LogrosAlumno({ alumnoId, logros = [], puedeEditar, onCambio }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(vacio);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  function abrirNuevo() {
    setEditandoId(null);
    setForm(vacio);
    setMostrarForm(!mostrarForm);
  }

  function abrirEdicion(l) {
    setEditandoId(l.id);
    setForm({ titulo: l.titulo, fecha: l.fecha.slice(0, 10), descripcion: l.descripcion || '' });
    setMostrarForm(true);
  }

  async function guardar() {
    if (form.titulo.trim().length < 2 || !form.fecha) {
      setError('Escribe el título y la fecha del logro');
      return;
    }
    setError('');
    try {
      if (editandoId) await api.put(`/logros/${editandoId}`, form);
      else await api.post('/logros', { alumnoId, ...form });
      setMostrarForm(false);
      setEditandoId(null);
      setForm(vacio);
      onCambio?.();
    } catch {
      setError('No se pudo guardar el logro');
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este logro?')) return;
    await api.delete(`/logros/${id}`);
    onCambio?.();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">Logros</p>
        {puedeEditar && (
          <button onClick={abrirNuevo} className="text-xs text-gray-500 hover:text-gray-900">+ Agregar logro</button>
        )}
      </div>

      {puedeEditar && mostrarForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <Input placeholder="Ej. Torneo 2026 Primer Lugar Kata" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <Input placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button onClick={guardar} className="w-full justify-center">{editandoId ? 'Guardar cambios' : 'Guardar logro'}</Button>
        </div>
      )}

      {logros.length > 0 ? (
        <div className="space-y-2">
          {logros.map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-sm">
              <Trophy size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{l.titulo}</p>
                <p className="text-xs text-gray-400">{new Date(l.fecha).toLocaleDateString(undefined, { timeZone: 'UTC' })}</p>
                {l.descripcion && <p className="text-xs text-gray-600 mt-0.5">{l.descripcion}</p>}
              </div>
              {puedeEditar && (
                <span className="flex gap-2 flex-shrink-0">
                  <button onClick={() => abrirEdicion(l)} className="text-gray-400 hover:text-gray-900"><Pencil size={12} /></button>
                  <button onClick={() => eliminar(l.id)} className="text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Sin logros registrados todavía.</p>
      )}
    </div>
  );
}
