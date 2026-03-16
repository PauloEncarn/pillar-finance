'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
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
      // NORMALIZAÇÃO: Garantimos que os dados cheguem na API padronizados
      const dadosParaEnvio = {
        name: formData.name.toUpperCase().trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnvio)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      // Feedback para o usuário sobre a aprovação pendente
      alert("Solicitação enviada! Aguarde a aprovação de um administrador para acessar o sistema.");
      router.push('/login');

    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      
      {/* LADO ESQUERDO (Visual / Marketing) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-600 rounded-full blur-[128px] opacity-40"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[128px] opacity-30"></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-black flex items-center gap-2 tracking-tighter italic uppercase">
            Pillar<span className="text-emerald-400">Finance</span>
          </h1>
        </div>

        <div className="relative z-10 mb-20">
          <h2 className="text-5xl font-black leading-tight mb-6 uppercase italic tracking-tighter">
            Comece sua jornada <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              agora mesmo.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md font-medium">
            Junte-se à Montranel e transforme a maneira de gerenciar seu fluxo de caixa corporativo.
          </p>
        </div>

        <div className="relative z-10 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
          © 2026 Pillar Finance & IT Management.
        </div>
      </div>

      {/* LADO DIREITO (Formulário) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 md:bg-white">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-700">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Crie sua conta</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Preencha os dados abaixo para solicitar acesso.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* Input Nome - Força Visualmente Maiúsculo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all uppercase placeholder:text-slate-300"
                  placeholder="EX: PAULO ENCARNAÇÃO"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            {/* Input Email - Força Visualmente Minúsculo */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Defina sua Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-slate-200 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> 
                  Processando Cadastro...
                </>
              ) : (
                <>
                  Solicitar Acesso <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Já possui uma credencial? <Link href="/login" className="text-emerald-600 hover:underline decoration-2 underline-offset-4">Fazer login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}