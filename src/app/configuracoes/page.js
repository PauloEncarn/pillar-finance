'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Save, Settings, Camera, Loader2, 
  Users, Server, Trash2, CheckCircle, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('perfil');
  const [currentUser, setCurrentUser] = useState({ role: 'USER' });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('pillar-user');
    if (dadosSalvos) {
      setTimeout(() => {
        setCurrentUser(JSON.parse(dadosSalvos));
      }, 0);
    }
  }, []);

  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6 fade-in pb-10">
      
      {/* --- CABEÇALHO PADRONIZADO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
            <Settings size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Configurações do Sistema
            </h1>
            <p className="text-slate-500 text-sm">
              Gerencie seu perfil, segurança e preferências.
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE ABAS */}
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
        {activeTab === 'perfil' && <TabPerfil />}
        {activeTab === 'seguranca' && <TabSeguranca />}
        {isAdmin && activeTab === 'usuarios' && <TabAdminUsuarios />}
        {isAdmin && activeTab === 'sistema' && <TabSistemaSMTP />}
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function TabButton({ id, label, icon: Icon, activeTab, setActiveTab }) {
  return (
    <button
      onClick={() => setActiveTab(id)}
      className={`pb-3 px-2 text-sm font-bold transition-all flex items-center gap-2 ${
        activeTab === id
          ? 'text-blue-700 border-b-2 border-blue-700'
          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );
}

function TabPerfil() {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState({ id: '', name: '', email: '', role: 'USER', avatarUrl: null });

  useEffect(() => {
    const dados = localStorage.getItem('pillar-user');
    if (dados) setTimeout(() => setUser(JSON.parse(dados)), 0);
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
    } catch (err) {
      alert('Erro no upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch('/api/users/update', {
        method: 'PATCH',
        body: JSON.stringify({ id: user.id, name: user.name, avatarUrl: user.avatarUrl })
      });
      localStorage.setItem('pillar-user', JSON.stringify(user));
      window.dispatchEvent(new Event('storage'));
      alert("Salvo com sucesso!");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div onClick={() => fileInputRef.current.click()} className="relative group cursor-pointer mb-4 w-40 h-40 bg-slate-100 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
          {uploading ? <Loader2 className="animate-spin text-blue-600" /> : user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
          ) : <User size={48} className="text-slate-300" />}
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"><Camera className="text-white" /></div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
        <h3 className="font-bold text-slate-800">{user.name}</h3>
        <p className="text-xs text-slate-500">{user.role}</p>
      </div>

      <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
            <input type="text" value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Email (Login)</label>
            <input type="email" value={user.email} disabled className="w-full p-3 bg-slate-100 border rounded-xl text-slate-400 cursor-not-allowed" />
            <p className="text-[10px] text-slate-400 mt-1">Para mudar o email, contate um Administrador.</p>
          </div>
          <div className="flex justify-end pt-4">
            <button disabled={isLoading} className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 flex items-center gap-2">
              {isLoading ? 'Salvando...' : 'Salvar'} <Save size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TabSeguranca() {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Lock size={20} /> Alterar Senha</h2>
      <form className="space-y-4">
        <div><label className="text-xs font-bold text-slate-500 uppercase">Senha Atual</label><input type="password" className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
        <div><label className="text-xs font-bold text-slate-500 uppercase">Nova Senha</label><input type="password" className="w-full p-3 bg-slate-50 border rounded-xl" /></div>
        <button type="button" onClick={() => alert('Funcionalidade será implementada na próxima atualização de segurança.')} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold">Atualizar Senha</button>
      </form>
    </div>
  );
}

function TabAdminUsuarios() {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsersList(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza?')) return;
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleApprove = async (user) => {
    if (!confirm(`Confirmar aprovação de acesso para ${user.name}?`)) return;
    await fetch('/api/admin/users', {
      method: 'PATCH',
      body: JSON.stringify({ id: user.id, approved: true })
    });
    fetchUsers();
  };

  const toggleAdmin = async (user) => {
      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
      if (!confirm(`Alterar cargo de ${user.name}?`)) return;
      await fetch('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id: user.id, role: newRole }) });
      fetchUsers();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Cadastro de Usuários</h2>
          <p className="text-sm text-slate-500">Gerencie permissões e aprovações pendentes.</p>
        </div>
        <button onClick={fetchUsers} className="text-blue-600 text-sm font-bold hover:underline">Atualizar</button>
      </div>

      {loading ? <div className="p-8 text-center text-slate-400">Carregando...</div> : (
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4">Usuário</th>
              <th className="p-4">Status</th>
              <th className="p-4">Cargo</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {usersList.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
                    {u.avatarUrl ? <Image src={u.avatarUrl} fill className="object-cover" unoptimized alt="avatar"/> : <User className="m-2 text-slate-400" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block">{u.name}</span>
                    <span className="text-xs text-slate-400">{u.email}</span>
                  </div>
                </td>
                <td className="p-4">
                  {u.approved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <CheckCircle size={12} /> APROVADO
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleApprove(u)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 animate-pulse cursor-pointer shadow-sm"
                    >
                      <AlertCircle size={12} /> LIBERAR ACESSO
                    </button>
                  )}
                </td>
                <td className="p-4">
                  <span onClick={() => toggleAdmin(u)} className={`cursor-pointer px-2 py-1 rounded border text-xs font-bold ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-slate-500 border-transparent hover:border-slate-300'}`}>
                    {u.role === 'ADMIN' ? 'ADMIN' : 'USER'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(u.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function TabSistemaSMTP() {
  const logs = [
    { id: 1, data: 'Hoje 14:30', evento: 'Email de Boas-vindas enviado', status: 'OK' },
    { id: 2, data: 'Hoje 10:15', evento: 'Falha no envio de Relatório (Timeout)', status: 'ERRO' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
        <h3 className="font-bold flex items-center gap-2 mb-4"><Server size={20} /> Status do Servidor de Email</h3>
        <div className="flex gap-4">
          <div className="bg-slate-800 p-4 rounded-xl flex-1">
            <p className="text-xs text-slate-400 uppercase font-bold">Status</p>
            <p className="font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={14} /> ONLINE</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4">Logs de Envio (SMTP)</h3>
        <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-200">
          {logs.map(log => (
            <div key={log.id} className="flex gap-3 border-b border-slate-200 pb-2 last:border-0 last:pb-0">
              <span className="text-slate-400">{log.data}</span>
              <span className={log.status === 'OK' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>[{log.status}]</span>
              <span className="text-slate-700">{log.evento}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}