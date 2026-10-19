import React, { useEffect, useState } from 'react';
import { TrendingUp, FileDown } from 'lucide-react';
import api from '../lib/api';
import { Card, EmptyState, PageHeader, Select, Field, Badge, Button, CintaVisual } from '../components/ui';
import ProgresoEvaluacion from '../components/ProgresoEvaluacion';
import AsistenciaAlumno from '../components/AsistenciaAlumno';
import LineaCintas from '../components/LineaCintas';
import LogrosAlumno from '../components/LogrosAlumno';
import ReporteAlumno from '../components/ReporteAlumno';

// Pantalla para administrador, instructor y tutor: elige un alumno y ve su evaluación
// (con selector de mes) y su asistencia en grande. El tutor solo ve a sus propios hijos.
export default function Progreso() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoId, setAlumnoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [detalle, setDetalle] = useState(null); // alumno completo: historial de cintas y logros
  const [verReporte, setVerReporte] = useState(false);

  useEffect(() => {
    api.get('/alumnos')
      .then((r) => {
        const lista = r.data
          .filter((a) => a.estado === 'ACTIVO')
          .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
        setAlumnos(lista);
        if (lista.length === 1) setAlumnoId(lista[0].id);
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    setDetalle(null);
    if (!alumnoId) return;
    api.get(`/alumnos/${alumnoId}`).then((r) => setDetalle(r.data)).catch(() => {});
  }, [alumnoId]);

  const alumno = alumnos.find((a) => a.id === alumnoId);

  return (
    <div>
      <PageHeader
        title="Progreso"
        description="Evaluación, asistencia, cintas y logros de cada alumno"
        action={
          <Button variant="secondary" onClick={() => setVerReporte(true)} disabled={!alumnoId}>
            <FileDown size={16} /> Exportar PDF
          </Button>
        }
      />

      <div className="max-w-md mb-5">
        <Field label="Alumno">
          <Select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)}>
            <option value="">{cargando ? 'Cargando...' : 'Selecciona un alumno...'}</option>
            {alumnos.map((a) => <option key={a.id} value={a.id}>{a.nombreCompleto}</option>)}
          </Select>
        </Field>
      </div>

      {!cargando && alumnos.length === 0 && (
        <EmptyState icon={TrendingUp} title="No hay alumnos para mostrar" />
      )}

      {alumno && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{alumno.nombreCompleto}</h2>
            {alumno.cintaActual && (
              <span className="flex items-center gap-2">
                <CintaVisual color1={alumno.cintaActual.color1} color2={alumno.cintaActual.color2} color3={alumno.cintaActual.color3} width={70} height={20} />
                <Badge tone="blue">{alumno.cintaActual.nombre}</Badge>
              </span>
            )}
          </div>

          <Card className="p-5">
            <ProgresoEvaluacion key={`ev-${alumno.id}`} alumnoId={alumno.id} grande />
          </Card>

          <Card className="p-5">
            <AsistenciaAlumno key={`as-${alumno.id}`} alumnoId={alumno.id} grande />
          </Card>

          <Card className="p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">Progreso de cinta</p>
            {detalle ? (
              <LineaCintas historial={detalle.historialCintas || []} cintaActual={detalle.cintaActual} />
            ) : (
              <p className="text-sm text-gray-400">Cargando...</p>
            )}
          </Card>

          <Card className="p-5">
            {detalle ? (
              <LogrosAlumno alumnoId={alumno.id} logros={detalle.logros || []} puedeEditar={false} />
            ) : (
              <p className="text-sm text-gray-400">Cargando...</p>
            )}
          </Card>
        </div>
      )}

      {verReporte && alumnoId && <ReporteAlumno alumnoId={alumnoId} onCerrar={() => setVerReporte(false)} />}
    </div>
  );
}
