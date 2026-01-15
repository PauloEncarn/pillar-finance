'use client';

import { memo } from 'react'; // 1. Importação para performance
import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  LogOut,
  FileSpreadsheet
} from 'lucide-react';

// 2. Mudamos de "export function" para apenas "function" interna
function SidebarBase() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('pillar-user');
    localStorage.removeItem('pillar-token');
    router.push('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Painel Geral', href: '/' },
    { icon: Wallet, label: 'Gestão Financeira', href: '/lancamentos' },
    { icon: FileSpreadsheet, label: 'Relatórios', href: '/relatorios' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f172a] text-white flex flex-col border-r border-slate-800 shadow-2xl z-50">
      
      {/* ÁREA DA LOGO */}
      <div className="h-32 bg-white flex items-center justify-center overflow-hidden relative border-b-4 border-blue-900">
        <div className="relative w-full h-full">
          {/* Certifique-se de ter a imagem logo.jpg na pasta public */}
          <Image 
            src="/logo.jpg" 
            alt="M. Montranel Logo"
            fill
            className="object-contain scale-90"
            priority
          />
        </div>
      </div>

      {/* NAVEGAÇÃO */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
          Operacional
        </p>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg transition-all group ${
                isActive 
                  ? 'bg-blue-900 text-white shadow-md shadow-black/40 translate-x-1 border-l-4 border-blue-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
              }`}
            >
              <Icon size={20} className={`${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* RODAPÉ */}
      <div className="p-4 border-t border-slate-800 bg-[#0B1221]">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all text-sm font-medium"
        >
          <LogOut size={20} />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}

// 3. Exportamos a versão OTIMIZADA (Memorizada)
// O React só vai renderizar isso de novo se algo drástico mudar na estrutura, ignorando atualizações de dados do dashboard.
export const Sidebar = memo(SidebarBase);