'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Save, Settings, Camera, Loader2, 
  Users, Server, Trash2, CheckCircle, AlertCircle, X, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('perfil');
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  // --- CORREÇÃO DO ERRO DE SETSTATE ---
  // Inicializamos o estado com uma função (Lazy Initializer)
  // Isso roda apenas uma vez, antes do primeiro render, evitando o erro de "cascading renders"
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const dadosSalvos = localStorage.getItem('pillar-user');
      return dadosSalvos ? JSON.parse(dadosSalvos) : { role: 'USER' };
    }
    return { role: 'USER' };
  });

  const exibirNotificacao = (msg, tipo = 'sucesso') => {
    setNotificacao({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3000);
  };

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full ${
          notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-500 text-white'
        }`}>
          {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Configurações</h1>
            <p className="text-slate-500 text-sm font-medium">Gestão de conta e diretrizes de administrador.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 border-b border-slate-200">
        <TabButton id="perfil" label="Meu Perfil" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="seguranca" label="Segurança" icon={Lock} activeTab={activeTab} setActiveTab={setActiveTab} />
        {isAdmin && (
          <>
            <TabButton id="usuarios" label="Gestão de Usuários" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="sistema" label="Sistema & SMTP" icon={Server} activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}
      </div>

      <div className="mt-6">
        {activeTab === 'perfil' && <TabPerfil notify={exibirNotificacao} />}
        {activeTab === 'seguranca' && <TabSeguranca notify={exibirNotificacao} />}
        {isAdmin && activeTab === 'usuarios' && <TabAdminUsuarios notify={exibirNotificacao} />}
        {isAdmin && activeTab === 'sistema' && <TabSistemaSMTP />}
      </div>
    </div>
  );
}

function TabButton({ id, label, icon: Icon, activeTab, setActiveTab }) {
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`pb-3 px-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
        activeTab === id
          ? 'text-blue-700 border-b-2 border-blue-700'
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function TabPerfil({ notify }) {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Usando a mesma técnica de inicialização segura aqui
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const dados = localStorage.getItem('pillar-user');
      return dados ? JSON.parse(dados) : { id: '', name: '', email: '', role: 'USER', avatarUrl: null };
    }
    return { id: '', name: '', email: '', role: 'USER', avatarUrl: null };
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('montranel-bucket').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('montranel-bucket').getPublicUrl(fileName);
      setUser(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      notify("Foto carregada!");
    } catch (err) {
      notify("Erro no upload", "erro");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/update', {
        method: 'PATCH',
        body: JSON.stringify({ id: user.id, name: user.name, avatarUrl: user.avatarUrl })
      });
      if (res.ok) {
        localStorage.setItem('pillar-user', JSON.stringify(user));
        window.dispatchEvent(new Event('storage'));
        notify("Perfil atualizado!");
      }
    } catch (err) {
      notify("Erro ao salvar", "erro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
      <div className="lg:col-span-1 flex flex-col items-center text-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div onClick={() => fileInputRef.current.click()} className="relative group cursor-pointer mb-6 w-32 h-32 bg-slate-50 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
          {uploading ? <Loader2 className="animate-spin text-blue-600" /> : user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
          ) : <User size={40} className="text-slate-300" />}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="text-white" size={20} /></div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{user.name}</h3>
      </div>

      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome Completo</label>
              <input type="text" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Principal</label>
              <input type="email" value={user.email} disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-medium" />
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-50 pt-6">
            <button disabled={isLoading} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 flex items-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50">
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              {isLoading ? 'Sincronizando...' : 'Confirmar Mudanças'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabSeguranca({ notify }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm max-w-2xl animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Lock size={20} /></div>
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Segurança da Conta</h2>
      </div>
      <form className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Senha Atual</label>
          <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nova Senha</label>
          <input type="password" placeholder="Nova senha" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
        </div>
        <button type="button" onClick={() => notify("Função indisponível", "erro")} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-rose-600 transition-all shadow-xl">Atualizar Senha</button>
      </form>
    </div>
  );
}

function TabAdminUsuarios({ notify }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [modalDelete, setModalDelete] = useState({ aberto: false, id: null, nome: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsersList(data);
    } catch (e) { notify("Erro ao carregar lista", "erro"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    const id = modalDelete.id;
    setModalDelete({ aberto: false, id: null });
    setProcessandoId(id);
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      notify("Usuário removido");
      fetchUsers();
    } catch (e) { notify("Erro ao remover", "erro"); }
    finally { setProcessandoId(null); }
  };

  const handleApprove = async (user) => {
    setProcessandoId(user.id);
    try {
      await fetch('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id: user.id, approved: true }) });
      notify("Aprovado!");
      fetchUsers();
    } catch (e) { notify("Erro", "erro"); }
    finally { setProcessandoId(null); }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
      {modalDelete.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Remover Usuário?</h3>
            <p className="text-slate-500 text-sm mb-6">Confirma a exclusão de <b>{modalDelete.nome}</b>?</p>
            <div className="flex gap-3">
              <button onClick={() => setModalDelete({ aberto: false })} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs">VOLTAR</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs">EXCLUIR</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Colaboradores Cadastrados</h2>
        <button onClick={fetchUsers}><Loader2 className={loading ? "animate-spin text-blue-600" : "text-slate-300"} size={18} /></button>
      </div>

      <table className="w-full text-left">
        <thead className="bg-slate-50/50 text-[9px] uppercase text-slate-400 font-black tracking-widest">
          <tr>
            <th className="p-5">Nome</th>
            <th className="p-5">Acesso</th>
            <th className="p-5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {usersList.map(u => (
            <tr key={u.id} className="hover:bg-slate-50 transition-all">
              <td className="p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
                  {u.avatarUrl ? <Image src={u.avatarUrl} fill className="object-cover" unoptimized alt="avatar"/> : <User className="m-2 text-slate-300" size={20} />}
                </div>
                <div className="text-xs font-bold text-slate-700">{u.name}</div>
              </td>
              <td className="p-5">
                {!u.approved ? (
                  <button onClick={() => handleApprove(u)} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[9px] font-black border border-orange-100 animate-pulse">LIBERAR</button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black">ATIVO</span>
                )}
              </td>
              <td className="p-5 text-right">
                <button onClick={() => setModalDelete({ aberto: true, id: u.id, nome: u.name })} className="p-2 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabSistemaSMTP() {
  const logs = [
    { id: 1, data: 'Hoje 14:30', evento: 'Email de Boas-vindas enviado', status: 'OK' },
    { id: 2, data: 'Hoje 10:15', evento: 'Falha no envio de Relatório (Timeout)', status: 'ERRO' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform"><Server size={140} /></div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-2"><Server size={16} /> Status SMTP</h3>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-fit">
          <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Conexão</p>
          <div className="font-black text-emerald-400 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            ONLINE
          </div>
        </div>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Logs Recentes</h3>
        <div className="bg-slate-50 rounded-2xl p-6 font-mono text-[11px] space-y-3 border border-slate-100">
          {logs.map(log => (
            <div key={log.id} className="flex gap-4 border-b border-slate-200/50 pb-3 last:border-0 last:pb-0 items-center">
              <span className="text-slate-400 font-bold">{log.data}</span>
              <span className={log.status === 'OK' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>[{log.status}]</span>
              <span className="text-slate-600">{log.evento}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}