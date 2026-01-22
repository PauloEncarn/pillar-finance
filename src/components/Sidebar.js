'use client';

import { memo, useState } from 'react'; // Adicionamos useState
import Link from 'next/link';
import Image from 'next/image'; 
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  LogOut,
  FileSpreadsheet,
  Menu, // Ícone para abrir
  X     // Ícone para fechar
} from 'lucide-react';

function SidebarBase() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false); // Estado do menu mobile

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
    <>
      {/* BOTÃO HAMBÚRGUER (Aparece apenas no Mobile) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] p-2 bg-blue-900 text-white rounded-lg md:hidden shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* OVERLAY (Escurece o fundo quando o menu abre no mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[40] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ASIDE (A Sidebar em si) */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-[#0f172a] text-white flex flex-col border-r border-slate-800 shadow-2xl z-[50]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        
        {/* ÁREA DA LOGO */}
        <div className="h-24 md:h-32 bg-white flex items-center justify-center overflow-hidden relative border-b-4 border-blue-900">
          <div className="relative w-full h-full p-2">
            <Image 
              src="/logo.jpg" 
              alt="M. Montranel Logo"
              fill
              className="object-contain"
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
                onClick={() => setIsOpen(false)} // Fecha ao clicar no mobile
                className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg transition-all group ${
                  isActive 
                    ? 'bg-blue-900 text-white shadow-md shadow-black/40 border-l-4 border-blue-50' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className={`${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'}`} />
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
    </>
  );
}

export const Sidebar = memo(SidebarBase);