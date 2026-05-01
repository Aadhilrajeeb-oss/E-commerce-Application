import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Package, Users, LogOut, ShoppingCart, BarChart2 } from 'lucide-react';
import api from '../../api/axiosInstance';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Orders', path: '/orders', icon: ShoppingCart },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">TechMart Admin</h1>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-400' : ''} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-gray-900 border border-gray-800">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors duration-200"
          >
            <LogOut size={18} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-end px-8 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
          {/* Header controls, notifications, etc. */}
        </header>
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          <div className="max-w-7xl mx-auto relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
