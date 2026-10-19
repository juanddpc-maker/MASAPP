import React from 'react';
import { CintaVisual, Badge } from './ui';

// Línea de progreso de cinta: cada cambio con su fecha y diplomas. El más reciente va primero.
export default function LineaCintas({ historial = [], cintaActual }) {
  if (historial.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        <p>Aún no tiene cambios de cinta registrados.</p>
        {cintaActual && (
          <p className="mt-2 flex items-center gap-2">
            Cinta actual:
            <CintaVisual color1={cintaActual.color1} color2={cintaActual.color2} color3={cintaActual.color3} width={56} height={16} />
            <Badge tone="blue">{cintaActual.nombre}</Badge>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {historial.map((h, i) => (
        <div key={h.id} className="flex items-start gap-3 text-sm avoid-break">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${i === 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <CintaVisual color1={h.cinta.color1} color2={h.cinta.color2} color3={h.cinta.color3} width={56} height={16} />
              <span className={i === 0 ? 'font-medium text-gray-900' : 'text-gray-700'}>{h.cinta.nombre}</span>
              <span className="text-xs text-gray-400">{new Date(h.fechaObtencion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            {(h.diplomaNuevo || h.diplomaAnterior || h.instructor) && (
              <p className="text-xs text-gray-500 mt-0.5">
                {h.diplomaNuevo && <>Diploma: <span className="text-gray-700">{h.diplomaNuevo}</span></>}
                {h.diplomaNuevo && h.diplomaAnterior && ' · '}
                {h.diplomaAnterior && <>Anterior: {h.diplomaAnterior}</>}
                {(h.diplomaNuevo || h.diplomaAnterior) && h.instructor && ' · '}
                {h.instructor && <>Instructor: {h.instructor}</>}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
