import React, { useEffect, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader, Button, Select, Modal } from '../components/ui';

const estadoTono = { ABIERTA: 'amber', CERRADA: 'gray' };
const tipoLabel = {
  COMPORTAMIENTO: 'Comportamiento', PROGRESO: 'Progreso', REUNION: 'Reunión',
  PAGO: 'Pago', EXAMEN: 'Examen', AVISO_GENERAL: 'Aviso general', CONSULTA_TUTOR: 'Consulta tutor',
};

export default function Comunicacion() {
  const [conversaciones, setConversaciones] = useState([]);
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [filtroTutorId, setFiltroTutorId] = useState('');

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);

  function cargar() {
    api.get('/conversaciones').then((res) => setConversaciones(res.data)).catch(() => {});
  }
  useEffect(cargar, []);

  async function abrir(id) {
    setCargandoDetalle(true);
    try {
      const { data } = await api.get(`/conversaciones/${id}`);
      setDetalle(data);
      // Avisa al sidebar (Layout) que baje el contador de no leídos, sin esperar a navegar de página
      window.dispatchEvent(new Event('mensajes-leidos'));
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function enviarRespuesta() {
    if (!respuesta.trim()) return;
    setEnviando(true);
    try {
      await api.post(`/conversaciones/${detalle.id}/mensajes`, { contenido: respuesta });
      setRespuesta('');
      const { data } = await api.get(`/conversaciones/${detalle.id}`);
      setDetalle(data);
      cargar();
    } finally {
      setEnviando(false);
    }
  }

  async function cambiarEstado(nuevoEstado) {
    await api.put(`/conversaciones/${detalle.id}`, { estado: nuevoEstado });
    setDetalle({ ...detalle, estado: nuevoEstado });
    cargar();
  }

  // Lista única de tutores presentes en las conversaciones, para el filtro
  const tutoresEnConversaciones = Array.from(
    new Map(conversaciones.map((c) => [c.tutorId, c.tutor])).values(),
  );

  const conversacionesFiltradas = conversaciones.filter(
    (c) => (!soloAbiertas || c.estado === 'ABIERTA') && (!filtroTutorId || c.tutorId === filtroTutorId),
  );

  return (
    <div>
      <PageHeader title="Comunicación" description="Conversaciones con tutores por tema" />

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={soloAbiertas} onChange={(e) => setSoloAbiertas(e.target.checked)} />
          Solo conversaciones abiertas
        </label>
        <Select value={filtroTutorId} onChange={(e) => setFiltroTutorId(e.target.value)} className="!w-auto max-w-xs">
          <option value="">Todos los tutores</option>
          {tutoresEnConversaciones.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </Select>
      </div>

      <Card>
        {conversacionesFiltradas.length === 0 ? (
          <EmptyState icon={MessageSquare} title="Sin conversaciones" description="Se crean desde el perfil de un alumno." />
        ) : (
          <Table columns={['Alumno', 'Tutor', 'Asunto', 'Tema', 'Estado', 'Mensajes', '']}>
            {conversacionesFiltradas.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => abrir(c.id)}>
                <td className="px-4 py-3 font-medium text-gray-900">{c.alumno.nombreCompleto}</td>
                <td className="px-4 py-3 text-gray-600">{c.tutor.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{c.asunto}</td>
                <td className="px-4 py-3 text-gray-600">{tipoLabel[c.tipo] || c.tipo}</td>
                <td className="px-4 py-3"><Badge tone={estadoTono[c.estado]}>{c.estado}</Badge></td>
                <td className="px-4 py-3 text-gray-600">{c.mensajes?.length || 0}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-400">Ver →</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={!!detalle || cargandoDetalle} onClose={() => setDetalle(null)} title={detalle?.asunto || 'Cargando...'}>
        {cargandoDetalle ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : detalle && (
          <div className="flex flex-col h-[60vh]">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <Badge tone={estadoTono[detalle.estado]}>{detalle.estado}</Badge>
              {detalle.estado === 'ABIERTA' ? (
                <Button variant="secondary" onClick={() => cambiarEstado('CERRADA')}>Marcar como concluida</Button>
              ) : (
                <Button variant="secondary" onClick={() => cambiarEstado('ABIERTA')}>Reabrir</Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
              {detalle.mensajes.map((m) => (
                <div key={m.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {m.emisor?.nombre || 'Usuario'} · {new Date(m.fechaEnvio).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-900">{m.contenido}</p>
                </div>
              ))}
            </div>

            {detalle.estado === 'ABIERTA' && (
              <div className="flex gap-2 flex-shrink-0">
                <textarea
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900/10"
                  rows={2}
                  placeholder="Escribe una respuesta..."
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                />
                <Button onClick={enviarRespuesta} disabled={enviando}>
                  <Send size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
