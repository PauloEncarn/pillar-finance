import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./ClientLayout"; // Vamos criar esse já já

const inter = Inter({ subsets: ["latin"] });

// Isso aqui é o que faz a sua LOGO aparecer na aba do navegador
export const metadata = {
  title: "Montranel Finance",
  icons: {
    icon: "/logo.jpg", 
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        {/* Chamamos o componente que cuida da Sidebar e do Login */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}