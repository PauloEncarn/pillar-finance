'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Wallet, X, Search, Landmark, Tag, 
  CreditCard, CheckCircle2, DollarSign, Loader2
} from 'lucide-react';

export default function Lancamentos() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [busca, setBusca] = useState('');
  
  const [modalAberto, setModalAberto] = useState(false);
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  // Inicialização segura para evitar erro de cascading renders
  const [novoItem, setNovoItem] = useState(() => {
    const hoje = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';
    return {
      descricao: '', valor: '', tipo: 'SAIDA', categoria: 'OUTROS', tipoConta: 'PJ', data: hoje
    };
  });

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setTransacoes(data);
    } catch (error) { 
      console.error("Erro ao carregar:", error);
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setIsSalvando(true);
    try {
      const res = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
      });
      if (res.ok) {
        await carregarDados();
        setModalAberto(false);
        setNovoItem(prev => ({ ...prev, descricao: '', valor: '' }));
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSalvando(false);
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      const res = await fetch(`/api/lancamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) carregarDados();
    } catch (error) {
      console.error("Erro ao mudar status:", error);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Wallet size={24}/></div>
          <h1 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Lançamentos</h1>
        </div>
        <button onClick={() => setModalAberto(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-600 transition-all shadow-lg">
          Novo Registro
        </button>
      </div>

      {/* TABELA BASEADA NO SEU BACKEND FUNCIONAL */}
      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Vencimento</th>
                <th className="p-6">Descrição</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-6 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr>
              ) : transacoes.map((item) => (
                <tr key={item.id} className={item.tipo === 'ENTRADA' ? 'bg-emerald-50/20' : 'bg-rose-50/20'}>
                  <td className="p-6 text-xs font-bold text-slate-500">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 text-sm uppercase">{item.descricao}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mt-0.5">
                        <Tag size={10}/> {item.categoria} | <Landmark size={10}/> {item.banco}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button 
                      onClick={() => handleMudarStatus(item.id, item.status === 'PAGO' ? 'PENDENTE' : 'PAGO')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                        item.status === 'PAGO' ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-600'
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className={`p-6 text-right font-black text-sm ${item.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SIMPLIFICADO PARA SEU POST */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Novo Compromisso</h3>
              <button onClick={() => setModalAberto(false)}><X /></button>
            </div>
            <form onSubmit={handleSalvar} className="p-8 space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Descrição</label>
                <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Valor</label>
                  <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Data</label>
                  <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Fluxo</label>
                  <select value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm">
                    <option value="SAIDA">SAÍDA (-)</option>
                    <option value="ENTRADA">ENTRADA (+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Categoria</label>
                  <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm">
                    <option value="OUTROS">OUTROS</option>
                    <option value="FINANCIAMENTO">FINANCIAMENTO</option>
                    <option value="MANUTENCAO">MANUTENÇÃO</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-600 transition-all">
                {isSalvando ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Registrar Lançamento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}