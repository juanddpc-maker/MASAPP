import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Tutores from './pages/Tutores';
import Cintas from './pages/Cintas';
import Usuarios from './pages/Usuarios';
import Pagos from './pages/Pagos';
import Inventario from './pages/Inventario';
import Comunicacion from './pages/Comunicacion';
import EventosCinta from './pages/EventosCinta';
import Ventas from './pages/Ventas';
import Comportamiento from './pages/Comportamiento';
import Configuracion from './pages/Configuracion';
import Layout from './components/Layout';
import './styles.css';

function RutaProtegida({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
        <Route path="/alumnos" element={<RutaProtegida><Alumnos /></RutaProtegida>} />
        <Route path="/tutores" element={<RutaProtegida><Tutores /></RutaProtegida>} />
        <Route path="/cintas" element={<RutaProtegida><Cintas /></RutaProtegida>} />
        <Route path="/eventos-cinta" element={<RutaProtegida><EventosCinta /></RutaProtegida>} />
        <Route path="/pagos" element={<RutaProtegida><Pagos /></RutaProtegida>} />
        <Route path="/comunicacion" element={<RutaProtegida><Comunicacion /></RutaProtegida>} />
        <Route path="/comportamiento" element={<RutaProtegida><Comportamiento /></RutaProtegida>} />
        <Route path="/inventario" element={<RutaProtegida><Inventario /></RutaProtegida>} />
        <Route path="/ventas" element={<RutaProtegida><Ventas /></RutaProtegida>} />
        <Route path="/usuarios" element={<RutaProtegida><Usuarios /></RutaProtegida>} />
        <Route path="/configuracion" element={<RutaProtegida><Configuracion /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/alumnos" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
