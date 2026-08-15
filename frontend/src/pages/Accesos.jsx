import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import api from '../lib/api';
import { Card, Table, Badge, EmptyState, PageHeader } from '../components/ui';

const rolTono = { ADMINISTRADOR: 'blue', INSTRUCTOR: 'amber', TUTOR: 'gray' };

export default function Accesos() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/logs/logins').then((res) => setLogs(res.data));
  }, []);

  return (
    <div>
      <PageHeader title="Accesos" description="Registro de inicios de sesión (últimos 200)" />
      <Card>
        {logs.length === 0 ? (
          <EmptyState icon={KeyRound} title="Aún no hay accesos registrados" />
        ) : (
          <Table columns={['Nombre', 'Correo', 'Rol', 'Fecha y hora']}>
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{l.correo}</td>
                <td className="px-4 py-3"><Badge tone={rolTono[l.rol]}>{l.rol}</Badge></td>
                <td className="px-4 py-3 text-gray-500 text-sm">{new Date(l.fecha).toLocaleString()}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
