import React from 'react';
import Logo from './Logo';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: (
      <svg width="28" height="28" fill="none" stroke="#a21caf" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>
    ) },
  { label: 'POS', to: '/pos', icon: (
      <svg width="28" height="28" fill="none" stroke="#a21caf" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
    ) },
  { label: 'Cashiers', to: '/cashiers', icon: (
      <svg width="28" height="28" fill="none" stroke="#a21caf" strokeWidth="2.2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>
    ) },
  { label: 'Inventory', to: '/inventory', icon: (
      <svg width="28" height="28" fill="none" stroke="#a21caf" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
    ) },
  { label: 'Logs', to: '/logs', icon: (
      <svg width="28" height="28" fill="none" stroke="#a21caf" strokeWidth="2.2" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h2"/></svg>
    ) },
];

function NavAdmin() {
  return (
    <aside className="backdrop-blur-xl bg-white/60 border border-purple-100 shadow-2xl rounded-3xl flex flex-col items-center py-8 px-3 w-28 min-h-screen gap-6 relative z-20">
      <Logo size={56} className="mb-10 drop-shadow-lg" />
      <nav className="flex flex-col gap-4 w-full" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            aria-label={item.label}
            className={({ isActive }) =>
              `group flex flex-col items-center w-full py-4 rounded-2xl transition-all font-semibold text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 relative
              ${isActive ? 'bg-gradient-to-r from-purple-500/80 to-purple-700/90 text-white shadow-xl scale-105' : 'bg-white/60 text-purple-700 hover:bg-purple-100/80 hover:text-purple-900'}
              `
            }
            tabIndex={0}
          >
            <span className="mb-1 relative">
              {item.icon}
              {/* Animated active indicator */}
              <span className={`absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-lg transition-all duration-300 ${window.location.pathname === item.to ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></span>
            </span>
            <span className="mt-1" aria-hidden="true">{item.label}</span>
            {/* Tooltip */}
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-purple-700 text-white text-xs rounded-lg px-3 py-1 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default NavAdmin; 