'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  
  const [mode, setMode] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    // REMOVEMOS O .toLowerCase() DAQUI
    // Agora o e-mail vai EXATAMENTE como você digitou no campo
    const emailParaEnvio = formData.email.trim();

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: emailParaEnvio, 
            password: formData.password 
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao realizar login');

        localStorage.setItem('pillar-token', data.token);
        localStorage.setItem('pillar-user', JSON.stringify(data.user));
        setSuccessUser(data.user);

        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2500);

      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...formData, 
            email: emailParaEnvio 
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar');

        alert('Conta enviada para aprovação!');
        setMode('login');
        setLoading(false);
      }
    } catch (err) {
      setErro(err.message);
      setLoading(false);
    }
  };

  if (successUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4">
        <div className="flex flex-col items-center animate-in zoom-in duration-700">
          <div className="relative w-32 h-32 mb-6">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-800 flex items-center justify-center">
              {successUser.avatarUrl ? (
                <Image src={successUser.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-4xl font-bold text-white">{successUser.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full border-4 border-slate-900">
              <CheckCircle size={20} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 italic uppercase tracking-tighter">
            Bem-vindo, {successUser.name.split(' ')[0]}!
          </h2>
          <p className="text-slate-400 font-medium uppercase text-[10px] tracking-widest">Acessando infraestrutura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex flex-col items-center text-center">
            <div className="relative w-48 h-24 mb-2">
              <Image src="/logo.jpg" alt="Logo" fill className="object-contain" priority />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Pillar Management</h2>
          </div>

          {erro && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase">
              <AlertCircle size={18} />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm uppercase"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="EXEMPLO@MONTRANEL.COM"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={formData.email}
                  // REMOVIDO o toLowerCase() daqui para você usar maiúsculas livremente
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-blue-700 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (mode === 'login' ? 'Acessar Sistema' : 'Solicitar Acesso')}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
              {mode === 'login' ? 'Não possui conta? ' : 'Já possui acesso? '}
              <span className="font-black underline underline-offset-4">{mode === 'login' ? 'CRIAR CONTA' : 'LOGAR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}