import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { TotemView } from './views/TotemView';
import { KitchenView } from './views/KitchenView';
import { ManagerView } from './views/ManagerView';
import { Monitor, BarChart2, Settings } from 'lucide-react';

const NavLink: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/' && location.pathname === '');
  
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all ${isActive ? 'bg-red-600 text-white shadow-lg scale-110' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-bold">{label}</span>
    </Link>
  );
};

// Simple dock for demonstration purposes
const GlobalNavigation = () => {
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-2xl z-50 flex gap-4 border border-gray-200">
      <NavLink to="/" icon={<Monitor size={20} />} label="Totem" />
      <NavLink to="/cozinha" icon={<BarChart2 size={20} />} label="Cozinha" />
      <NavLink to="/admin" icon={<Settings size={20} />} label="Admin" />
    </div>
  );
}

const App: React.FC = () => {
  return (
    <StoreProvider>
      <HashRouter>
        <div className="relative">
          <Routes>
            <Route path="/" element={<TotemView />} />
            <Route path="/cozinha" element={<KitchenView />} />
            <Route path="/admin" element={<ManagerView />} />
          </Routes>
          <GlobalNavigation />
        </div>
      </HashRouter>
    </StoreProvider>
  );
};

export default App;