import React, { useEffect, useState } from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, EmptyState, PageHeader, Button, Select } from '../components/ui';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [alumnoId, setAlumnoId] = useState('');
  const [varianteId, setVarianteId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState('');

  function cargar() {
    Promise.all([api.get('/ventas'), api.get('/alumnos'), api.get('/inventario/productos')])
      .then(([v, a, p]) => { setVentas(v.data); setAlumnos(a.data); setProductos(p.data); })
      .catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  const variantes = productos.flatMap((p) => p.variantes.map((v) => ({ ...v, nombreProducto: p.nombre })));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/ventas', { alumnoId, items: [{ varianteId, cantidad: Number(cantidad) }] });
      setMostrarForm(false);
      setAlumnoId(''); setVarianteId(''); setCantidad(1);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar la venta');
    }
  }

  return (
    <div>
      <PageHeader
        title="Ventas"
        description="Uniformes y equipo vendido a alumnos"
        action={<Button onClick={() => setMostrarForm(!mostrarForm)}><Plus size={16} />Registrar venta</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)} required>
              <option value="">Alumno</option>
              {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
            </Select>
            <Select value={varianteId} onChange={(e) => setVarianteId(e.target.value)} required>
              <option value="">Producto</option>
              {variantes.map((v) => (
                <option key={v.id} value={v.id}>{v.nombreProducto} - {v.talla || v.sku} (${v.precio})</option>
              ))}
            </Select>
            <input
              type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit">Registrar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {ventas.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Aún no hay ventas registradas" />
        ) : (
          <Table columns={['Alumno', 'Fecha', 'Total', 'Estado']}>
            {ventas.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{v.alumno.nombreCompleto}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(v.fecha).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-gray-600">${v.total}</td>
                <td className="px-4 py-3 text-gray-600">{v.estado}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
