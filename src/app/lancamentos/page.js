'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2, Tag, Wallet } from 'lucide-react';

export default function Lancamentos() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const categoriasReceita = ["SERVICOS", "LOCACAO", "VENDAS", "OUTRAS RECEITAS"];
  const categoriasDespesa = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "ADMINISTRATIVO", "OUTRAS DESPESAS"];

  const [novoItem, setNovoItem] = useState({
    descricao: '',
    valor: '',
    tipo: 'SAIDA',
    categoria: 'OUTRAS DESPESAS',
    status: 'PENDENTE',
    data: ''
  });

  const carregarDados = async () => {
    try {
      const res = await fetch('/api/lancamentos');
      if (!res.ok) throw new Error('Falha ao buscar');
      const data = await res.json();
      setTransacoes(data);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setNovoItem(prev => ({ ...prev, data: hoje }));
    carregarDados();
  }, []);

  useEffect(() => {
    if (novoItem.tipo === 'ENTRADA') {
      setNovoItem(prev => ({ ...prev, categoria: 'SERVICOS' }));
    } else {
      setNovoItem(prev => ({ ...prev, categoria: 'COMBUSTIVEL' }));
    }
  }, [novoItem.tipo]);

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!novoItem.descricao || !novoItem.valor) return;

    try {
      const res = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
      });

      if (res.ok) {
        await carregarDados();
        setNovoItem({ ...novoItem, descricao: '', valor: '', status: 'PENDENTE' });
      } else {
        alert("Erro ao salvar.");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    setTransacoes(prev => prev.filter(item => item.id !== id));
    try {
      await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
    } catch (error) {
      carregarDados();
    }
  };

  const handleAlternarStatus = async (item) => {
    const novoStatus = item.status === 'PENDENTE' ? 'PAGO' : 'PENDENTE';
    setTransacoes(prev => prev.map(t => t.id === item.id ? { ...t, status: novoStatus } : t));
    try {
      await fetch(`/api/lancamentos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
    } catch (error) {
      carregarDados();
    }
  };

  return (
    <div className="space-y-8 fade-in h-full pb-10">
      
      {/* --- CABEÇALHO PADRONIZADO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Gestão Financeira
            </h1>
            <p className="text-slate-500 text-sm">
              Controle de receitas, despesas e fluxo de caixa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <span className="text-slate-500 text-xs font-bold uppercase">Registros:</span>
          <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-xs font-bold">
            {transacoes.length}
          </span>
        </div>
      </div>

      {/* --- FORMULÁRIO --- */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
          Novo Lançamento
        </h2>
        
        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
            <input 
              type="text" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-blue-600 outline-none placeholder:text-slate-400"
              placeholder="Ex: Abastecimento"
              value={novoItem.descricao}
              onChange={e => setNovoItem({...novoItem, descricao: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
            <select 
              className={`w-full p-2.5 border rounded-lg font-bold outline-none cursor-pointer transition-colors ${
                novoItem.tipo === 'ENTRADA' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
              value={novoItem.tipo}
              onChange={e => setNovoItem({...novoItem, tipo: e.target.value})}
            >
              <option value="ENTRADA">Receita (+)</option>
              <option value="SAIDA">Despesa (-)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
              <Tag size={12} /> Categoria
            </label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-blue-600 outline-none cursor-pointer"
              value={novoItem.categoria}
              onChange={e => setNovoItem({...novoItem, categoria: e.target.value})}
            >
              {(novoItem.tipo === 'ENTRADA' ? categoriasReceita : categoriasDespesa).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
            <input 
              type="number" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="0,00"
              value={novoItem.valor}
              onChange={e => setNovoItem({...novoItem, valor: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
             <input 
                type="date"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                value={novoItem.data}
                onChange={e => setNovoItem({...novoItem, data: e.target.value})}
             />
          </div>

          <div className="md:col-span-1">
            <button type="submit" className="w-full bg-blue-700 text-white p-2.5 rounded-lg hover:bg-blue-800 transition-all shadow-md font-bold flex justify-center items-center active:scale-95">
              <Plus size={24} />
            </button>
          </div>
        </form>
      </div>

      {/* --- TABELA --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} /> 
            <p>Carregando financeiro...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">Nenhum lançamento registrado.</td>
                </tr>
              ) : (
                transacoes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-bold text-slate-700 flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${item.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {item.tipo === 'ENTRADA' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                      </div>
                      {item.descricao}
                    </td>
                    <td className="p-4">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{item.categoria}</span>
                    </td>
                    <td className="p-4 text-sm text-slate-500 font-mono">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleAlternarStatus(item)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all border ${
                          item.status === 'PAGO' 
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                            : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className={`p-4 text-right font-bold text-sm ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.tipo === 'SAIDA' ? '-' : '+'}
                      {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-center">
                       <button onClick={() => handleExcluir(item.id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}