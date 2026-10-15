import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, X } from 'lucide-react';
import api from '../lib/api';
import { Input, Button } from './ui';

const MAX_LADO = 1024; // px: suficiente para ver el crecimiento sin llenar el almacenamiento

// Reduce la imagen en el navegador antes de subirla (JPEG ~0.8) para cuidar el espacio gratis.
function reducirImagen(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagen no válida')); };
    img.src = url;
  });
}

const hoy = () => new Date().toISOString().slice(0, 10);

// Galería de fotos del alumno, ordenada por fecha. Admin/instructor suben y borran; tutores solo ven.
export default function FotosAlumno({ alumnoId, puedeEditar }) {
  const [fotos, setFotos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [fecha, setFecha] = useState(hoy());
  const [nota, setNota] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [ampliada, setAmpliada] = useState(null);
  const inputRef = useRef(null);

  async function cargar() {
    try {
      const { data } = await api.get('/fotos', { params: { alumnoId } });
      setFotos(data);
      setError('');
    } catch {
      setError('No se pudieron cargar las fotos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { setCargando(true); cargar(); }, [alumnoId]);

  async function subir() {
    if (!archivo) { setError('Elige una foto'); return; }
    setSubiendo(true);
    setError('');
    try {
      const blob = await reducirImagen(archivo);
      const fd = new FormData();
      fd.append('foto', blob, 'foto.jpg');
      fd.append('alumnoId', alumnoId);
      fd.append('fecha', fecha);
      if (nota.trim()) fd.append('nota', nota.trim());
      await api.post('/fotos', fd);
      setArchivo(null); setNota(''); setFecha(hoy()); setMostrarForm(false);
      if (inputRef.current) inputRef.current.value = '';
      await cargar();
    } catch {
      setError('No se pudo subir la foto');
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta foto?')) return;
    await api.delete(`/fotos/${id}`);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">Fotos</p>
        {puedeEditar && (
          <button onClick={() => setMostrarForm(!mostrarForm)} className="text-xs text-gray-500 hover:text-gray-900">+ Agregar foto</button>
        )}
      </div>

      {puedeEditar && mostrarForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
          <input ref={inputRef} type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="text-xs w-full" />
          <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <Input placeholder="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
          <Button onClick={subir} disabled={subiendo} className="w-full justify-center">{subiendo ? 'Subiendo...' : 'Subir foto'}</Button>
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {cargando ? (
        <p className="text-sm text-gray-400">Cargando fotos...</p>
      ) : fotos.length === 0 ? (
        <p className="text-sm text-gray-400 flex items-center gap-1"><Camera size={14} /> Sin fotos todavía.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <div key={f.id} className="relative group">
              <button onClick={() => setAmpliada(f)} className="block w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
                {f.url && <img src={f.url} alt={f.nota || 'Foto'} className="w-full h-full object-cover" loading="lazy" />}
              </button>
              <p className="text-[11px] text-gray-500 mt-0.5">{new Date(f.fecha).toLocaleDateString()}</p>
              {puedeEditar && (
                <button onClick={() => eliminar(f.id)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-gray-500 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {ampliada && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setAmpliada(null)}>
          <button className="absolute top-4 right-4 text-white"><X size={24} /></button>
          <div className="max-w-full max-h-full text-center" onClick={(e) => e.stopPropagation()}>
            <img src={ampliada.url} alt="" className="max-h-[80vh] max-w-full rounded-lg mx-auto" />
            <p className="text-white text-sm mt-2">{new Date(ampliada.fecha).toLocaleDateString()}{ampliada.nota ? ` · ${ampliada.nota}` : ''}</p>
          </div>
        </div>
      )}
    </div>
  );
}
