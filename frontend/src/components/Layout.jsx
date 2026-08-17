import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, UserSquare2, Award, Repeat, Wallet, MessageSquare, Package, ShieldCheck, LogOut, ShoppingCart, ClipboardList, Settings, KeyRound, LayoutDashboard, Menu, X } from 'lucide-react';
import api from '../lib/api';
import { Modal, Field, Input, Button } from './ui';

const menuItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMINISTRADOR'] },
  { to: '/alumnos', label: 'Alumnos', icon: Users, roles: ['ADMINISTRADOR', 'INSTRUCTOR', 'TUTOR'] },
  { to: '/tutores', label: 'Tutores', icon: UserSquare2, roles: ['ADMINISTRADOR', 'INSTRUCTOR'] },
  { to: '/cintas', label: 'Cintas', icon: Award, roles: ['ADMINISTRADOR', 'INSTRUCTOR'] },
  { to: '/eventos-cinta', label: 'Cambio de cinta', icon: Repeat, roles: ['ADMINISTRADOR', 'INSTRUCTOR'] },
  { to: '/pagos', label: 'Pagos', icon: Wallet, roles: ['ADMINISTRADOR'] },
  { to: '/comunicacion', label: 'Comunicación', icon: MessageSquare, roles: ['ADMINISTRADOR', 'INSTRUCTOR', 'TUTOR'] },
  { to: '/comportamiento', label: 'Comportamiento', icon: ClipboardList, roles: ['ADMINISTRADOR', 'INSTRUCTOR'] },
  { to: '/inventario', label: 'Inventario', icon: Package, roles: ['ADMINISTRADOR'] },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: ['ADMINISTRADOR'] },
  { to: '/usuarios', label: 'Usuarios', icon: ShieldCheck, roles: ['ADMINISTRADOR'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings, roles: ['ADMINISTRADOR'] },
  { to: '/accesos', label: 'Accesos', icon: KeyRound, roles: ['ADMINISTRADOR'] },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [escuela, setEscuela] = useState({ nombre: 'Escuela', logoUrl: null });
  const [noLeidos, setNoLeidos] = useState(0);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [okPassword, setOkPassword] = useState(false);
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function cambiarPassword(e) {
    e.preventDefault();
    setErrorPassword('');
    setOkPassword(false);
    if (passwordNueva !== passwordConfirmar) {
      setErrorPassword('La confirmación no coincide con la nueva contraseña');
      return;
    }
    setGuardandoPassword(true);
    try {
      await api.post('/auth/change-password', { passwordActual, passwordNueva });
      setOkPassword(true);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (err) {
      setErrorPassword(err.response?.data?.message || 'No se pudo cambiar la contraseña');
    } finally {
      setGuardandoPassword(false);
    }
  }

  useEffect(() => {
    api.get('/escuela').then((res) => setEscuela(res.data)).catch(() => {});

    function actualizarNoLeidos() {
      if (usuario.rol === 'TUTOR') {
        api.get('/conversaciones/no-leidos').then((res) => setNoLeidos(res.data.total)).catch(() => {});
      }
    }
    actualizarNoLeidos();

    // Cuando la pantalla de Comunicación marca mensajes como leídos, este evento
    // avisa al sidebar para que el contador baje al instante, sin recargar la página.
    window.addEventListener('mensajes-leidos', actualizarNoLeidos);
    return () => window.removeEventListener('mensajes-leidos', actualizarNoLeidos);
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  const iniciales = (usuario.nombre || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Fondo oscuro al abrir el menú en móvil, clic para cerrar */}
      {menuAbierto && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMenuAbierto(false)} />
      )}

      <aside
        className={`w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 fixed md:sticky top-0 h-screen z-50 transition-transform duration-200 ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 py-5 border-b border-gray-100 flex items-center gap-2.5 flex-shrink-0">
          {escuela.logoUrl ? (
            <img src={escuela.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate">{escuela.nombre}</p>
            <p className="text-xs text-gray-400">Panel de administración</p>
          </div>
          <button onClick={() => setMenuAbierto(false)} className="md:hidden text-gray-400 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuItems.filter((item) => item.roles.includes(usuario.rol)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {to === '/comunicacion' && noLeidos > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {noLeidos > 9 ? '9+' : noLeidos}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{usuario.nombre || 'Usuario'}</p>
              <p className="text-xs text-gray-400">{usuario.rol}</p>
            </div>
          </div>
          <button
            onClick={() => { setMostrarCambioPassword(true); setOkPassword(false); setErrorPassword(''); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <KeyRound size={16} />
            Cambiar contraseña
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Barra superior solo visible en móvil, con el botón para abrir el menú */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-30">
          <button onClick={() => setMenuAbierto(true)} className="text-gray-600">
            <Menu size={22} />
          </button>
          <p className="font-semibold text-gray-900 text-sm truncate">{escuela.nombre}</p>
        </div>

        {usuario.rol === 'TUTOR' && noLeidos > 0 && (
          <button
            onClick={() => navigate('/comunicacion')}
            className="w-full bg-amber-50 border-b border-amber-200 px-4 md:px-8 py-2.5 text-sm text-amber-800 text-left hover:bg-amber-100 transition-colors"
          >
            Tienes <strong>{noLeidos}</strong> comunicado{noLeidos > 1 ? 's' : ''} sin leer que requieren tu atención — clic para revisarlos
          </button>
        )}
        <div className="p-4 md:p-8 max-w-6xl w-full">{children}</div>
      </main>

      <Modal open={mostrarCambioPassword} onClose={() => setMostrarCambioPassword(false)} title="Cambiar contraseña">
        <form onSubmit={cambiarPassword} className="space-y-3">
          <Field label="Contraseña actual">
            <Input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} required />
          </Field>
          <Field label="Nueva contraseña">
            <Input type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required minLength={6} />
          </Field>
          <Field label="Confirmar nueva contraseña">
            <Input type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} required minLength={6} />
          </Field>
          {errorPassword && <p className="text-sm text-red-600">{errorPassword}</p>}
          {okPassword && <p className="text-sm text-green-600">Contraseña actualizada correctamente.</p>}
          <Button type="submit" disabled={guardandoPassword} className="w-full justify-center">
            {guardandoPassword ? 'Guardando...' : 'Guardar nueva contraseña'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
