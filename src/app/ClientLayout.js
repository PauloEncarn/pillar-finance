'use client';

import { Sidebar } from "@/components/Sidebar";
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }) {
  const pathname = usePathname();
  // Se for página de login ou registro, não mostra a sidebar
  const isLoginPage = pathname === '/login' || pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {!isLoginPage && <Sidebar />}

      <main className={`
        flex-1 flex flex-col transition-all duration-300
        ${!isLoginPage 
          ? 'p-4 md:p-8 md:ml-64 mt-14 md:mt-0' 
          : 'w-full'}
      `}>
        {children}
      </main>
    </div>
  );
}