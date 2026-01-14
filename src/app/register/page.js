'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      alert("Conta criada com sucesso! Faça login.");
      router.push('/login');

    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      
      {/* LADO ESQUERDO (Visual) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-600 rounded-full blur-[128px] opacity-40"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-30"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold flex items-center gap-2 tracking-tight">
            Pillar<span className="text-emerald-400">Finance</span>
          </h1>
        </div>

        <div className="relative z-10 mb-20">
          <h2 className="text-5xl font-bold leading-tight mb-6">
            Comece sua jornada <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              agora mesmo.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Junte-se a gestores que transformaram a maneira de controlar o fluxo de caixa.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-600">
          © 2026 Pillar Finance.
        </div>
      </div>

      {/* LADO DIREITO (Formulário) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 fade-in">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900">Crie sua conta</h2>
            <p className="text-slate-500 mt-2">Preencha os dados abaixo para começar.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Input Nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Seu Nome"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
            >
              {isLoading ? 'Criando conta...' : 'Cadastrar'} <ArrowRight size={20} />
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              Já tem uma conta? <Link href="/login" className="text-indigo-600 font-bold hover:underline">Faça login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}