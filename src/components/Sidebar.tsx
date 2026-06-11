import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, LineChart, Settings, Menu, Zap, Rocket } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Zap, label: 'Entity Explorer', path: '/explorer' },
    // { icon: Rocket, label: 'SpaceX Launches', path: '/launches' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 hidden md:flex flex-col">
      <div className="p-6 text-2xl font-bold border-b border-slate-800 flex items-center gap-2">
        <LineChart className="text-blue-400" />
        <span>MarketIntel</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800 text-xs text-slate-500">
        v1.0.4-legacy
      </div>
    </aside>
  );
};

export default Sidebar;
