'use client';

import { useState } from 'react';
import { 
  User, Lock, History, Activity, Save, Server, 
  CheckCircle, XCircle, Clock, ShieldCheck, RefreshCw, 
  FileText, Edit3, Trash2, PlusCircle 
} from 'lucide-react';

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('perfil'); // 'perfil', 'auditoria', 'sistema'

  // MENU DE NAVEGAÇÃO INTERNO
  const tabs = [
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'auditoria', label: 'Histórico de Atividades', icon: History },
    { id: 'sistema', label: 'Monitoramento do Sistema', icon: Activity },
  ];

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Configurações</h1>
          <p className="text-slate-500 mt-1">Gerencie sua conta e visualize logs do sistema.</p>
        </div>
      </div>

      {/* NAVEGAÇÃO (SUBMENUS) */}
      <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-full md:w-fit shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="fade-in">
        {activeTab === 'perfil' && <TabPerfil />}
        {activeTab === 'auditoria' && <TabAuditoria />}
        {activeTab === 'sistema' && <TabSistema />}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: PERFIL DO USUÁRIO ---
function TabPerfil() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      alert("Dados atualizados com sucesso!");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Coluna da Foto */}
      <div className="md:col-span-1">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="w-32 h-32 bg-slate-100 rounded-full mb-4 flex items-center justify-center text-slate-300 border-4 border-white shadow-lg">
            <User size={64} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Administrador</h3>
          <p className="text-slate-500 text-sm mb-4">admin@pillar.finance</p>
          <button className="text-indigo-600 text-sm font-bold hover:underline">Alterar Foto</button>
        </div>
      </div>

      {/* Coluna do Formulário */}
      <div className="md:col-span-2">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Edit3 size={20} className="text-indigo-600" />
            Dados Pessoais
          </h2>
          
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Completo</label>
                <input type="text" defaultValue="Administrador do Sistema" className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-800 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                <input type="email" defaultValue="admin@pillar.finance" className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-800 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all" />
              </div>
            </div>

            <hr className="border-slate-100" />

            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Lock size={16} className="text-slate-400" />
                Segurança
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Senha Atual</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-800 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-800 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button disabled={isLoading} className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold flex items-center gap-2 disabled:opacity-70">
                <Save size={18} />
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTE: AUDITORIA (LOGS) ---
function TabAuditoria() {
  // MOCK DE DADOS: No futuro virá do banco (Tabela 'audit_logs')
  const logs = [
    { id: 1, usuario: 'Admin', acao: 'INSERT', detalhe: 'Novo lançamento: Recebimento X', data: 'Hoje, 10:42', modulo: 'Lançamentos' },
    { id: 2, usuario: 'Admin', acao: 'UPDATE', detalhe: 'Alterou status para PAGO: Conta Luz', data: 'Hoje, 09:15', modulo: 'Lançamentos' },
    { id: 3, usuario: 'Admin', acao: 'DELETE', detalhe: 'Removeu lançamento: Teste Errado', data: 'Ontem, 16:20', modulo: 'Lançamentos' },
    { id: 4, usuario: 'Sistema', acao: 'SYSTEM', detalhe: 'Backup automático realizado', data: 'Ontem, 00:00', modulo: 'Backup' },
    { id: 5, usuario: 'Admin', acao: 'LOGIN', detalhe: 'Login realizado com sucesso', data: 'Ontem, 08:00', modulo: 'Autenticação' },
  ];

  const getIcon = (acao) => {
    switch(acao) {
      case 'INSERT': return <PlusCircle size={16} className="text-emerald-500" />;
      case 'UPDATE': return <Edit3 size={16} className="text-blue-500" />;
      case 'DELETE': return <Trash2 size={16} className="text-rose-500" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  const getBadge = (acao) => {
    switch(acao) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'UPDATE': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DELETE': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="font-bold text-slate-800">Trilha de Auditoria</h2>
        <p className="text-xs text-slate-500">Registro de segurança de todas as ações.</p>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50">
          <tr>
            <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Ação</th>
            <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
            <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhe da Operação</th>
            <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
              <td className="p-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getBadge(log.acao)}`}>
                  {getIcon(log.acao)}
                  {log.acao}
                </span>
              </td>
              <td className="p-5 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                  {log.usuario.charAt(0)}
                </div>
                <span className="text-sm font-bold text-slate-700">{log.usuario}</span>
              </td>
              <td className="p-5">
                <p className="text-sm text-slate-700 font-medium">{log.detalhe}</p>
                <p className="text-xs text-slate-400">{log.modulo}</p>
              </td>
              <td className="p-5 text-sm text-slate-500 text-right font-mono text-xs">
                {log.data}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- SUB-COMPONENTE: MONITORAMENTO (O antigo conteúdo) ---
function TabSistema() {
  const [isTesting, setIsTesting] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, status: 'SUCCESS', data: '14/01/2026 08:00', mensagem: 'Relatório diário enviado', destinatario: 'admin@pillar.com' },
    { id: 2, status: 'ERROR', data: '12/01/2026 08:00', mensagem: 'Falha SMTP: Timeout', destinatario: 'admin@pillar.com' },
  ]);

  const handleTestarConexao = () => {
    setIsTesting(true);
    setTimeout(() => {
      const novoLog = {
        id: Date.now(),
        status: Math.random() > 0.3 ? 'SUCCESS' : 'ERROR',
        data: new Date().toLocaleString('pt-BR').slice(0, 16),
        mensagem: 'Teste manual de conexão SMTP',
        destinatario: 'Sistema'
      };
      setLogs([novoLog, ...logs]);
      setIsTesting(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail</p>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">SMTP <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span></h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Server size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cron Job</p>
            <h3 className="text-lg font-bold text-slate-800">Vercel</h3>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Clock size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Segurança</p>
            <h3 className="text-lg font-bold text-slate-800">HTTPS</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
        </div>
      </div>

      {/* Logs do Sistema */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Logs de Automação</h2>
          <button onClick={handleTestarConexao} disabled={isTesting} className="text-indigo-600 text-sm font-bold flex items-center gap-2 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-all">
             {isTesting ? <RefreshCw className="animate-spin" size={16} /> : <Activity size={16} />} Testar Conexão
          </button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50">
             <tr>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Mensagem</th>
              <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-5"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{log.status === 'SUCCESS' ? <CheckCircle size={12}/> : <XCircle size={12}/>}{log.status}</span></td>
                <td className="p-5 text-sm text-slate-700">{log.mensagem}</td>
                <td className="p-5 text-sm text-slate-500 text-right font-mono">{log.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}