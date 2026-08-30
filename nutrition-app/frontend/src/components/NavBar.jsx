import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Hoy', icon: '🏠' },
  { to: '/alimentos', label: 'Alimentos', icon: '🥗' },
  { to: '/favoritos', label: 'Favoritos', icon: '❤️' },
  { to: '/progreso', label: 'Progreso', icon: '📈' },
  { to: '/perfil', label: 'Perfil', icon: '⚙️' },
];

export default function NavBar() {
  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
