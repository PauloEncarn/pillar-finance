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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 px-2 md:px-0">
      
      {/* NOTIFICAÇÃO RESPONSIVA */}
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 left-5 md:left-auto z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top md:slide-in-from-right-full ${
          notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-500 text-white'
        }`}>
          {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-xs md:text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Settings size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter uppercase">Configurações</h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Gestão de conta e diretrizes.</p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS (Scroll lateral no Mobile) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 md:gap-4 border-b border-slate-200 pb-px">
        <TabButton id="perfil" label="Perfil" icon={User} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="seguranca" label="Senha" icon={Lock} activeTab={activeTab} setActiveTab={setActiveTab} />
        {isAdmin && (
          <>
            <TabButton id="usuarios" label="Usuários" icon={Users} activeTab={activeTab} setActiveTab={setActiveTab} />
            <TabButton id="sistema" label="Sistema" icon={Server} activeTab={activeTab} setActiveTab={setActiveTab} />
          </>
        )}
      </div>

      {/* CONTEÚDO DAS ABAS */}
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
      className={`pb-3 px-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
        activeTab === id
          ? 'text-blue-700 border-blue-700'
          : 'text-slate-400 border-transparent hover:text-slate-600'
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in">
      <div className="lg:col-span-1 flex flex-col items-center text-center bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div onClick={() => fileInputRef.current.click()} className="relative group cursor-pointer mb-6 w-28 h-28 md:w-32 md:h-32 bg-slate-50 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
          {uploading ? <Loader2 className="animate-spin text-blue-600" /> : user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
          ) : <User size={36} className="text-slate-300" />}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="text-white" size={20} /></div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        <h3 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{user.name}</h3>
      </div>

      <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nome Completo</label>
              <input type="text" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Email</label>
              <input type="email" value={user.email} disabled className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed font-medium text-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button disabled={isLoading} className="w-full md:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-xl">
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabSeguranca({ notify }) {
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm max-w-2xl mx-auto md:mx-0 animate-in fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Lock size={18} /></div>
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Segurança</h2>
      </div>
      <form className="space-y-5">
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Senha Atual</label>
          <input type="password" placeholder="••••••••" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nova Senha</label>
          <input type="password" placeholder="Nova senha" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <button type="button" onClick={() => notify("Função indisponível", "erro")} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-xl">Atualizar Senha</button>
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
      notify("Removido!");
      fetchUsers();
    } catch (e) { notify("Erro", "erro"); }
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
    <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
      {modalDelete.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center border border-slate-100">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
            <h3 className="text-lg font-black text-slate-800 mb-2 uppercase">Excluir?</h3>
            <p className="text-slate-500 text-xs mb-6">Confirma a exclusão de <b>{modalDelete.nome}</b>?</p>
            <div className="flex gap-2">
              <button onClick={() => setModalDelete({ aberto: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px]">VOLTAR</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-[10px]">EXCLUIR</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-[9px] md:text-[10px] font-black text-slate-800 uppercase tracking-widest">Colaboradores</h2>
        <button onClick={fetchUsers}><Loader2 className={loading ? "animate-spin text-blue-600" : "text-slate-300"} size={16} /></button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[8px] md:text-[9px] uppercase text-slate-400 font-black tracking-widest">
            <tr>
              <th className="p-4 md:p-5">Nome</th>
              <th className="p-4 md:p-5">Status</th>
              <th className="p-4 md:p-5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {usersList.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 md:p-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden relative flex-shrink-0">
                    {u.avatarUrl ? <Image src={u.avatarUrl} fill className="object-cover" unoptimized alt="avatar"/> : <User className="m-1.5 text-slate-300" size={18} />}
                  </div>
                  <div className="font-bold text-slate-700 truncate max-w-[100px] md:max-w-none">{u.name}</div>
                </td>
                <td className="p-4 md:p-5">
                  {!u.approved ? (
                    <button onClick={() => handleApprove(u)} className="px-2 py-1 bg-orange-50 text-orange-600 rounded-full text-[8px] font-black border border-orange-100">LIBERAR</button>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black">ATIVO</span>
                  )}
                </td>
                <td className="p-4 md:p-5 text-right">
                  <button onClick={() => setModalDelete({ aberto: true, id: u.id, nome: u.name })} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabSistemaSMTP() {
  const logs = [
    { id: 1, data: 'Hoje 14:30', evento: 'Email Boas-vindas', status: 'OK' },
    { id: 2, data: 'Hoje 10:15', evento: 'Falha Relatório', status: 'ERRO' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2"><Server size={14} /> SMTP</h3>
        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-fit">
          <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Status</p>
          <div className="font-black text-emerald-400 flex items-center gap-2 text-xs md:text-sm">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            ONLINE
          </div>
        </div>
      </div>
      <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Logs</h3>
        <div className="bg-slate-50 rounded-2xl p-4 md:p-6 font-mono text-[10px] space-y-3 border border-slate-100">
          {logs.map(log => (
            <div key={log.id} className="flex flex-wrap gap-2 md:gap-4 border-b border-slate-200/50 pb-3 last:border-0 last:pb-0 items-center">
              <span className="text-slate-400 font-bold">{log.data}</span>
              <span className={log.status === 'OK' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>[{log.status}]</span>
              <span className="text-slate-600 truncate flex-1">{log.evento}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}