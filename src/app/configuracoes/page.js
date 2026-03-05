'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Save, Settings, Camera, Loader2, 
  Users, Server, Trash2, CheckCircle, AlertCircle, X, CheckCircle2, Plus, Mail, Shield, Key
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
        <div className={`fixed top-5 right-5 left-5 md:left-auto z-[120] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top md:slide-in-from-right-full ${
          notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-500 text-white'
        }`}>
          {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-xs md:text-sm uppercase tracking-widest">{notificacao.mensagem}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Settings size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter uppercase leading-none">Configurações</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Gestão de conta e diretrizes do sistema.</p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO POR ABAS */}
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
  
  const [user, setUser] = useState({ id: '', name: '', email: '', role: 'USER', avatarUrl: null });

  useEffect(() => {
    const dados = localStorage.getItem('pillar-user');
    if (dados) setUser(JSON.parse(dados));
  }, []);

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
      <div className="lg:col-span-1 flex flex-col items-center text-center bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div onClick={() => fileInputRef.current.click()} className="relative group cursor-pointer mb-6 w-32 h-32 bg-slate-50 rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
          {uploading ? <Loader2 className="animate-spin text-blue-600" /> : user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
          ) : <User size={48} className="text-slate-300" />}
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="text-white" size={24} /></div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">{user.name}</h3>
        <p className="text-[10px] font-bold text-blue-600 uppercase mt-1 tracking-widest">{user.role}</p>
      </div>

      <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nome Completo</label>
              <input type="text" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">E-mail Principal</label>
              <input type="email" value={user.email} disabled className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-400 cursor-not-allowed font-medium text-sm" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button disabled={isLoading} className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 flex items-center justify-center gap-2 transition-all shadow-xl">
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              Salvar Perfil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabSeguranca({ notify }) {
  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl animate-in fade-in">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm"><Lock size={20} /></div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Alterar Senha</h2>
      </div>
      <form className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Senha Atual</label>
            <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block ml-1">Nova Senha</label>
            <input type="password" placeholder="Mínimo 6 caracteres" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          </div>
        </div>
        <button type="button" onClick={() => notify("Função em manutenção", "erro")} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-xl">Confirmar Nova Senha</button>
      </form>
    </div>
  );
}

function TabAdminUsuarios({ notify }) {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [modalDelete, setModalDelete] = useState({ aberto: false, id: null, nome: '' });
  const [modalNovoUsuario, setModalNovoUsuario] = useState(false);
  const [novoUser, setNovoUser] = useState({ name: '', email: '', password: '', role: 'USER' });

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

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUser) 
      });
      if (res.ok) {
        notify("Usuário cadastrado!");
        setModalNovoUsuario(false);
        setNovoUser({ name: '', email: '', password: '', role: 'USER' });
        fetchUsers();
      } else {
        const error = await res.json();
        notify(error.error || "Erro no cadastro", "erro");
      }
    } catch (e) { notify("Falha na conexão", "erro"); }
    finally { setLoading(false); }
  };

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
      notify("Acesso liberado!");
      fetchUsers();
    } catch (e) { notify("Erro", "erro"); }
    finally { setProcessandoId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
         <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em] italic">Gestão de Equipe</h2>
         <button onClick={() => setModalNovoUsuario(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-slate-900 transition-all">
           <Plus size={14}/> Novo Usuário
         </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in">
        {/* MODAL NOVO USUÁRIO */}
        {modalNovoUsuario && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Cadastrar Colaborador</h3>
                <button onClick={() => setModalNovoUsuario(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
              </div>
              <form onSubmit={handleCadastro} className="p-8 space-y-5">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input type="text" required placeholder="NOME COMPLETO" value={novoUser.name} onChange={e => setNovoUser({...novoUser, name: e.target.value.toUpperCase()})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input type="email" required placeholder="E-MAIL" value={novoUser.email} onChange={e => setNovoUser({...novoUser, email: e.target.value.toLowerCase()})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input type="password" required placeholder="SENHA INICIAL" value={novoUser.password} onChange={e => setNovoUser({...novoUser, password: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <select value={novoUser.role} onChange={e => setNovoUser({...novoUser, role: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none cursor-pointer">
                    <option value="USER">COLABORADOR (USER)</option>
                    <option value="ADMIN">ADMINISTRADOR (ADMIN)</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-600 transition-all flex justify-center">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : "Efetivar Cadastro"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DELETE */}
        {modalDelete.aberto && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center border border-slate-100">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
              <h3 className="text-lg font-black text-slate-800 mb-2 uppercase italic">Remover Usuário?</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-6">Ação irreversível para <b>{modalDelete.nome}</b>.</p>
              <div className="flex gap-2">
                <button onClick={() => setModalDelete({ aberto: false })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-[10px] uppercase">Voltar</button>
                <button onClick={handleDelete} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaboradores Cadastrados</h2>
          <button onClick={fetchUsers} className="p-2 hover:bg-white rounded-lg transition-all"><Loader2 className={loading ? "animate-spin text-blue-600" : "text-slate-300"} size={16} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/30 text-[9px] uppercase text-slate-400 font-black tracking-widest">
              <tr>
                <th className="p-5">Informação</th>
                <th className="p-5">Permissão</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden relative flex-shrink-0 shadow-sm border-2 border-white">
                      {u.avatarUrl ? <Image src={u.avatarUrl} fill className="object-cover" unoptimized alt="avatar"/> : <User className="m-2 text-slate-300" size={18} />}
                    </div>
                    <div>
                      <div className="font-black text-slate-700 uppercase text-[11px] tracking-tight">{u.name}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${u.role === 'ADMIN' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-5">
                    {!u.approved ? (
                      <button onClick={() => handleApprove(u)} className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[8px] font-black border border-orange-200 animate-pulse hover:animate-none">LIBERAR</button>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black border border-emerald-100">ATIVO</span>
                    )}
                  </td>
                  <td className="p-5 text-right">
                    <button onClick={() => setModalDelete({ aberto: true, id: u.id, nome: u.name })} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabSistemaSMTP() {
  const [dados, setDados] = useState({ smtp: {}, logs: [] });
  const [loading, setLoading] = useState(true);

  const fetchSistema = async () => {
    try {
      setLoading(false);
      const res = await fetch('/api/admin/sistema');
      const data = await res.json();
      setDados(data);
    } catch (e) {
      console.error("Erro ao carregar sistema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSistema(); }, []);

  if (loading) return <div className="p-10 text-center uppercase font-black text-[10px] animate-pulse">Sincronizando Núcleo...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[250px]">
        <div className="z-10">
           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-2 italic"><Server size={14} /> Núcleo SMTP</h3>
           <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-fit">
             <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Status do Host: {dados.smtp.host}</p>
             <div className={`font-black flex items-center gap-2 text-sm md:text-base ${dados.smtp.online ? 'text-emerald-400' : 'text-rose-400'}`}>
               <div className="relative flex h-2.5 w-2.5">
                 {dados.smtp.online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                 <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dados.smtp.online ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500'}`}></span>
               </div>
               {dados.smtp.online ? 'CONECTADO / ONLINE' : 'DESCONECTADO / ERRO'}
             </div>
           </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-5">
           <Server size={200} />
        </div>
      </div>

      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 italic">Logs de Eventos Reais</h3>
        <div className="bg-slate-50 rounded-[2rem] p-6 font-mono text-[10px] space-y-4 border border-slate-100 overflow-y-auto max-h-[300px]">
          {dados.logs.length > 0 ? dados.logs.map(log => (
            <div key={log.id} className="flex flex-wrap gap-4 border-b border-slate-200/50 pb-4 last:border-0 last:pb-0 items-center">
              <span className="text-slate-400 font-bold">{new Date(log.data).toLocaleString('pt-BR')}</span>
              <span className={log.status === 'OK' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>[{log.status}]</span>
              <span className="text-slate-700 font-bold flex-1 uppercase tracking-tight">{log.evento}</span>
            </div>
          )) : (
            <div className="text-slate-400 italic">Nenhum evento registrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}