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
      </body>
    </html>
  );
}