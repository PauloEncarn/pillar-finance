'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <div className="min-h-screen flex">
          
          {/* Sidebar só aparece se NÃO for login */}
          {!isLoginPage && <Sidebar />}

          {/* Se for login: Ocupa 100% da largura (w-full) e sem p-8 (padding)
              Se não for: Tem a margem da sidebar (ml-64) e padding (p-8)
          */}
          <main className={`flex-1 flex flex-col ${!isLoginPage ? 'ml-64 p-8' : 'w-full'}`}>
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}