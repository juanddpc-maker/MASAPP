import React, { useEffect, useState } from 'react';
import { Package, Plus, ChevronDown, ChevronUp, Pencil, Trash2, RotateCcw, PackagePlus } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Input, Select, Field, Modal } from '../components/ui';

const vacio = { nombre: '', categoriaId: '', precioBase: '' };
const movimientoVacio = { tipo: 'ENTRADA', cantidad: '', nota: '' };
const tipoLabel = { ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste', VENTA: 'Venta', DEVOLUCION: 'Devolución' };
const tipoTono = { ENTRADA: 'green', SALIDA: 'red', AJUSTE: 'amber', VENTA: 'blue', DEVOLUCION: 'gray' };

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [form, setForm] = useState(vacio);
  const [varianteForm, setVarianteForm] = useState({ talla: '', color: '', sku: '', precio: '', stockInicial: '' });
  const [error, setError] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [varianteSeleccionada, setVarianteSeleccionada] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [formMovimiento, setFormMovimiento] = useState(movimientoVacio);
  const [errorMovimiento, setErrorMovimiento] = useState('');

  function cargar() {
    Promise.all([api.get('/inventario/productos'), api.get('/categorias')])
      .then(([p, c]) => { setProductos(p.data); setCategorias(c.data); })
      .catch(() => setError('No se pudo cargar'));
  }
  useEffect(cargar, []);

  function abrirNuevo() {
    setForm(vacio);
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEditar(p) {
    setForm({ nombre: p.nombre, categoriaId: p.categoriaId, precioBase: String(p.precioBase) });
    setEditandoId(p.id);
    setMostrarForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, precioBase: Number(form.precioBase) };
      if (editandoId) {
        await api.put(`/inventario/productos/${editandoId}`, payload);
      } else {
        await api.post('/inventario/productos', payload);
      }
      setMostrarForm(false);
      cargar();
    } catch {
      setError('No se pudo guardar el producto');
    }
  }

  async function handleDesactivar(id) {
    if (!confirm('¿Dar de baja este producto?')) return;
    await api.delete(`/inventario/productos/${id}`);
    cargar();
  }

  async function handleReactivar(id) {
    await api.put(`/inventario/productos/${id}`, { activo: true });
    cargar();
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

  // --- Movimientos de inventario (entradas para reabastecer, salidas, ajustes) ---
  async function abrirMovimientos(variante) {
    setVarianteSeleccionada(variante);
    setFormMovimiento(movimientoVacio);
    setErrorMovimiento('');
    setCargandoMovimientos(true);
    try {
      const { data } = await api.get(`/inventario/variantes/${variante.id}/movimientos`);
      setMovimientos(data);
    } finally {
      setCargandoMovimientos(false);
    }
  }

  async function registrarMovimiento() {
    setErrorMovimiento('');
    if (!formMovimiento.cantidad || Number(formMovimiento.cantidad) <= 0) {
      setErrorMovimiento('Indica una cantidad válida');
      return;
    }
    try {
      await api.post(`/inventario/variantes/${varianteSeleccionada.id}/movimientos`, {
        tipo: formMovimiento.tipo,
        cantidad: Number(formMovimiento.cantidad),
        nota: formMovimiento.nota || undefined,
      });
      setFormMovimiento(movimientoVacio);
      const { data } = await api.get(`/inventario/variantes/${varianteSeleccionada.id}/movimientos`);
      setMovimientos(data);
      cargar(); // refresca el stock mostrado en la tabla principal
    } catch (err) {
      setErrorMovimiento(err.response?.data?.message || 'No se pudo registrar el movimiento');
    }
  }

  const productosVisibles = productos.filter((p) => mostrarInactivos || p.activo);

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Uniformes, protecciones y accesorios"
        action={<Button onClick={abrirNuevo}><Plus size={16} />Agregar producto</Button>}
      />

      {mostrarForm && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3">
            <Field label="Nombre">
              <Input placeholder="ej. Uniforme Karate" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </Field>
            <Field label="Categoría">
              <Select value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })} required>
                <option value="">Selecciona...</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Select>
            </Field>
            <Field label="Precio base">
              <Input type="number" value={form.precioBase} onChange={(e) => setForm({ ...form, precioBase: e.target.value })} required />
            </Field>
            {categorias.length === 0 && <p className="col-span-3 text-sm text-amber-600">Primero da de alta una categoría en Configuración.</p>}
            {error && <p className="col-span-3 text-sm text-red-600">{error}</p>}
            <div className="col-span-3 flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="secondary" onClick={() => setMostrarForm(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
        Mostrar productos dados de baja
      </label>

      {productosVisibles.length === 0 ? (
        <Card><EmptyState icon={Package} title="Aún no hay productos" /></Card>
      ) : (
        <div className="space-y-3">
          {productosVisibles.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="w-full flex items-center justify-between px-5 py-4">
                <button className="flex-1 flex items-center gap-3 text-left" onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{p.nombre}</p>
                      {!p.activo && <Badge tone="gray">Inactivo</Badge>}
                    </div>
                    <p className="text-sm text-gray-400">{p.categoria?.nombre} · ${p.precioBase} · {p.variantes.length} variantes</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => abrirEditar(p)} className="text-gray-400 hover:text-gray-900 p-1.5" title="Editar"><Pencil size={16} /></button>
                  {p.activo ? (
                    <button onClick={() => handleDesactivar(p.id)} className="text-gray-400 hover:text-red-600 p-1.5" title="Dar de baja"><Trash2 size={16} /></button>
                  ) : (
                    <button onClick={() => handleReactivar(p.id)} className="text-gray-400 hover:text-green-600 p-1.5" title="Reactivar"><RotateCcw size={16} /></button>
                  )}
                  <button onClick={() => setExpandido(expandido === p.id ? null : p.id)} className="text-gray-400 p-1.5">
                    {expandido === p.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {expandido === p.id && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {p.variantes.length > 0 && (
                    <Table columns={['Talla', 'Color', 'SKU', 'Precio', 'Stock', '']}>
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
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => abrirMovimientos(v)} className="text-gray-400 hover:text-gray-900 inline-flex items-center gap-1 text-xs" title="Agregar o ajustar stock">
                              <PackagePlus size={15} /> Movimientos
                            </button>
                          </td>
                        </tr>
                      ))}
                    </Table>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Agregar variante nueva</p>
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

      <Modal
        open={!!varianteSeleccionada}
        onClose={() => setVarianteSeleccionada(null)}
        title={varianteSeleccionada ? `${varianteSeleccionada.talla || ''} ${varianteSeleccionada.color || ''} — ${varianteSeleccionada.sku}` : ''}
      >
        {varianteSeleccionada && (
          <div>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">Stock actual</span>
              <Badge tone={varianteSeleccionada.inventario?.stockActual <= varianteSeleccionada.inventario?.stockMinimo ? 'red' : 'green'}>
                {varianteSeleccionada.inventario?.stockActual ?? 0} unidades
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <Select value={formMovimiento.tipo} onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo: e.target.value })}>
                <option value="ENTRADA">Entrada (reabastecer)</option>
                <option value="SALIDA">Salida (manual)</option>
                <option value="AJUSTE">Ajuste</option>
                <option value="DEVOLUCION">Devolución</option>
              </Select>
              <Input type="number" min="1" placeholder="Cantidad" value={formMovimiento.cantidad} onChange={(e) => setFormMovimiento({ ...formMovimiento, cantidad: e.target.value })} />
              <Button onClick={registrarMovimiento}>Registrar</Button>
            </div>
            <Input placeholder="Nota (opcional, ej. compra a proveedor X)" value={formMovimiento.nota} onChange={(e) => setFormMovimiento({ ...formMovimiento, nota: e.target.value })} className="mb-4" />
            {errorMovimiento && <p className="text-sm text-red-600 mb-3">{errorMovimiento}</p>}

            <p className="text-xs font-medium text-gray-500 mb-2">Historial de movimientos</p>
            {cargandoMovimientos ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : movimientos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin movimientos todavía.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {movimientos.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                    <div>
                      <Badge tone={tipoTono[m.tipo]}>{tipoLabel[m.tipo]}</Badge>
                      <span className="text-gray-500 ml-2">{m.nota}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-medium">{m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION' ? '+' : '-'}{m.cantidad}</p>
                      <p className="text-xs text-gray-400">{new Date(m.fecha).toLocaleDateString()} · {m.usuario?.nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
