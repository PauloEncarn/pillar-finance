'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar"; 
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

// IMPORTANTE: Esta função precisa ser 'export default'
export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Lista de páginas onde a Sidebar NÃO deve aparecer
  const isLoginPage = pathname === '/login' || pathname === '/register';

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        
        {/* Renderiza a Sidebar apenas se NÃO for página de login/registro */}
        {!isLoginPage && <Sidebar />}
        
        {/* Ajusta a margem do conteúdo principal */}
        <main className={`${!isLoginPage ? 'ml-64' : 'w-full'} min-h-screen transition-all duration-300`}>
          <div className={!isLoginPage ? "p-8 max-w-7xl mx-auto" : ""}>
             {children}
          </div>
        </main>
      </body>
    </html>
  );
}