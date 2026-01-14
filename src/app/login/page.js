'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({ email: '', password: '' });

 // ... imports

  // DENTRO DO COMPONENTE LOGIN:
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao entrar.');
      }

      // SALVA O USUÁRIO REAL NO NAVEGADOR
      localStorage.setItem('pillar-user', JSON.stringify(data.user));
      
      // Redireciona
      router.push('/');

    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex bg-slate-100">
      
      {/* --- LADO ESQUERDO (Painel Industrial) --- */}
      <div className="hidden lg:flex w-5/12 bg-[#0f172a] relative flex-col justify-center overflow-hidden border-r-4 border-blue-900">
        
        {/* Fundo texturizado sutil */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>

        {/* FAIXA BRANCA DA LOGO (Solução para bordas) */}
        <div className="relative z-10 bg-white w-full py-12 pl-12 pr-4 shadow-2xl my-8 border-l-8 border-blue-600">
          <div className="relative w-full h-32">
             <Image 
                src="/logo.jpg" 
                alt="M. Montranel Logo"
                fill
                className="object-contain object-left" // Joga a logo para a esquerda
                priority
             />
          </div>
        </div>

        <div className="px-12 relative z-10 text-white mt-4">
          <h2 className="text-3xl font-bold uppercase tracking-tight">
            Gestão Integrada
          </h2>
          <p className="text-slate-400 mt-2 text-lg">
            Sistema de controle de montagem e logística.
          </p>
        </div>

        <div className="absolute bottom-8 left-12 text-xs text-slate-500 uppercase tracking-widest">
          © 2026 M. Montranel Ltda.
        </div>
      </div>

      {/* --- LADO DIREITO (Formulário Limpo) --- */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100">
          
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
            <p className="text-slate-500 text-sm mt-1">Identifique-se para acessar o painel operacional.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Usuário / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                  placeholder="admin@montranel.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Senha de Acesso</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                  placeholder="••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#0f172a] text-white py-4 rounded-lg font-bold hover:bg-blue-900 transition-all shadow-lg flex justify-center items-center gap-2 mt-4"
            >
              {isLoading ? 'Verificando...' : 'ENTRAR'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}