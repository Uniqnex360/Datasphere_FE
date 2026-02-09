import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  FileCheck,
  FolderTree,
  Settings as SettingsIcon,
  Image,
  Upload,
  Share2,
  Users,
  Menu,
  X,
  Sliders,
  Building2,
  Grid2x2,
  Tag,
  LogOut,
  CircleDollarSign
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { name: 'Vendors', icon: Building2, page: 'vendors' },
  { name: 'Brands', icon: Tag, page: 'brands' },
  { name: 'Categories', icon: FolderTree, page: 'categories' },
  { name: 'Attributes', icon: Sliders, page: 'attributes' },
  { name: 'Products', icon: Package, page: 'products' },
  { name: 'Price', icon: CircleDollarSign, page: 'price' },
  { name: 'Inventory', icon: Grid2x2, page: 'inventory' },
  { name: 'Digital Assets', icon: Image, page: 'assets' },
  { name: 'Enrichment', icon: FileCheck, page: 'enrichment' },
  { name: 'Channels', icon: Share2, page: 'channels' },
  { name: 'Users', icon: Users, page: 'users' },
  { name: 'Settings', icon: SettingsIcon, page: 'settings' },
];

export function Layout({ children, currentPage, onNavigate, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4">
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
              <img src="/Datasphere-logo (1).png" alt="DataSphere Logo" className="w-7 h-7" />

            <h1 className="text-xl font-bold text-gray-900">DataSphere</h1>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-10 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-16 lg:pl-64">
        <main className="p-6">{children}</main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
