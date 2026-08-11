import React, { useEffect, useState } from 'react';
import { Package, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input } from '../components/ui';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [form, setForm] = useState({ nombre: '', categoria: '', precioBase: '' });
  const [varianteForm, setVarianteForm] = useState({ talla: '', color: '', sku: '', precio: '', stockInicial: '' });
  const [error, setError] = useState('');

  function cargar() {
    api.get('/inventario/productos').then((res) => setProductos(res.data)).catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/inventario/productos', { ...form, precioBase: Number(form.precioBase) });
      setForm({ nombre: '', categoria: '', precioBase: '' });
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo crear el producto');
    }
  }

  async function agregarVariante(productoId) {
    try {
      await api.post(`/inventario/productos/${productoId}/variantes`, {
        ...varianteForm,
        precio: Number(varianteForm.precio),
        stockInicial: Number(varianteForm.stockInicial),
      });
      setVarianteForm({ talla: '', color: '', sku: '', precio: '', stockInicial: '' });
      cargar();
    } catch {
      alert('No se pudo agregar la variante (revisa que el SKU sea único)');
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Uniformes, protecciones y accesorios"
        action={<Button onClick={() => setMostrarForm(!mostrarForm)}><Plus size={16} />Agregar producto</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Input placeholder="Nombre (ej. Uniforme Karate)" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            <Input placeholder="Categoría" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} required />
            <Input placeholder="Precio base" type="number" value={form.precioBase} onChange={(e) => setForm({ ...form, precioBase: e.target.value })} required />
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      {productos.length === 0 ? (
        <Card><EmptyState icon={Package} title="Aún no hay productos" /></Card>
      ) : (
        <div className="space-y-3">
          {productos.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4"
                onClick={() => setExpandido(expandido === p.id ? null : p.id)}
              >
                <div className="text-left">
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  <p className="text-sm text-gray-400">{p.categoria} · ${p.precioBase} · {p.variantes.length} variantes</p>
                </div>
                {expandido === p.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {expandido === p.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {p.variantes.length > 0 && (
                    <Table columns={['Talla', 'Color', 'SKU', 'Precio', 'Stock']}>
                      {p.variantes.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-3 text-gray-600">{v.talla || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{v.color || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{v.sku}</td>
                          <td className="px-4 py-3 text-gray-600">${v.precio}</td>
                          <td className="px-4 py-3">
                            <Badge tone={v.inventario?.stockActual <= v.inventario?.stockMinimo ? 'red' : 'green'}>
                              {v.inventario?.stockActual ?? 0} und.
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </Table>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Agregar variante</p>
                    <div className="grid grid-cols-5 gap-2">
                      <Input placeholder="Talla" value={varianteForm.talla} onChange={(e) => setVarianteForm({ ...varianteForm, talla: e.target.value })} />
                      <Input placeholder="Color" value={varianteForm.color} onChange={(e) => setVarianteForm({ ...varianteForm, color: e.target.value })} />
                      <Input placeholder="SKU" value={varianteForm.sku} onChange={(e) => setVarianteForm({ ...varianteForm, sku: e.target.value })} />
                      <Input placeholder="Precio" type="number" value={varianteForm.precio} onChange={(e) => setVarianteForm({ ...varianteForm, precio: e.target.value })} />
                      <Input placeholder="Stock inicial" type="number" value={varianteForm.stockInicial} onChange={(e) => setVarianteForm({ ...varianteForm, stockInicial: e.target.value })} />
                    </div>
                    <Button className="mt-2" onClick={() => agregarVariante(p.id)}>Agregar variante</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
