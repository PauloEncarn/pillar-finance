'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Lancamentos() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [novoItem, setNovoItem] = useState({
    descricao: '',
    valor: '',
    tipo: 'SAIDA',
    categoria: 'FIXO',
    status: 'PENDENTE',
    data: ''
  });

  // --- 1. BUSCAR DADOS (GET) ---
  const carregarDados = async () => {
    try {
      const res = await fetch('/api/lancamentos');
      
      if (!res.ok) throw new Error('Falha ao buscar');
      
      const data = await res.json();
      setTransacoes(data);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao carregar lançamentos. Verifique se o servidor está rodando.");
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega ao abrir a tela
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setNovoItem(prev => ({ ...prev, data: hoje }));
    carregarDados();
  }, []);

  // --- 2. SALVAR NOVO (POST) ---
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
        await carregarDados(); // Recarrega a lista do banco
        setNovoItem({ 
          ...novoItem, 
          descricao: '', 
          valor: '',
          data: new Date().toISOString().split('T')[0] 
        });
      } else {
        const erro = await res.json();
        alert(erro.error || "Erro ao salvar.");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  // --- 3. EXCLUIR (DELETE) ---
  const handleExcluir = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    // Otimista: Remove da tela na hora para parecer instantâneo
    setTransacoes(prev => prev.filter(item => item.id !== id));

    try {
      await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
    } catch (error) {
      alert("Erro ao excluir no servidor.");
      carregarDados(); // Desfaz se der erro
    }
  };

  // --- 4. ALTERAR STATUS (PATCH) ---
  const handleAlternarStatus = async (item) => {
    const novoStatus = item.status === 'PENDENTE' ? 'PAGO' : 'PENDENTE';
    
    // Otimista: Atualiza a cor na tela na hora
    setTransacoes(prev => prev.map(t => 
      t.id === item.id ? { ...t, status: novoStatus } : t
    ));

    try {
      await fetch(`/api/lancamentos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
    } catch (error) {
      console.error("Erro ao atualizar status");
      carregarDados(); // Desfaz se der erro
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Lançamentos</h1>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
          {transacoes.length} registros
        </span>
      </div>

      {/* Formulário de Cadastro */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
          Nova Movimentação
        </h2>
        
        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descrição</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-800 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
              placeholder="Ex: Pagamento de Cliente"
              value={novoItem.descricao}
              onChange={e => setNovoItem({...novoItem, descricao: e.target.value})}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Valor</label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 text-sm font-bold">R$</span>
              <input 
                type="number" 
                className="w-full p-3 pl-10 bg-slate-50 border-none rounded-xl text-slate-800 font-bold outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
                placeholder="0,00"
                value={novoItem.valor}
                onChange={e => setNovoItem({...novoItem, valor: e.target.value})}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo</label>
            <select 
              className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              value={novoItem.tipo}
              onChange={e => setNovoItem({...novoItem, tipo: e.target.value})}
            >
              <option value="ENTRADA">Entrada (+)</option>
              <option value="SAIDA">Saída (-)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status Inicial</label>
            <select 
              className="w-full p-3 bg-slate-50 border-none rounded-xl text-slate-700 font-medium outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              value={novoItem.status}
              onChange={e => setNovoItem({...novoItem, status: e.target.value})}
            >
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold flex justify-center items-center gap-2 active:scale-95">
              <Plus size={20} /> Salvar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Listagem */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="animate-spin text-indigo-500" size={32} /> 
            <p>Sincronizando com o banco de dados...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transacoes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Plus size={24} />
                      </div>
                      <p>Nenhum lançamento encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transacoes.map((item) => (
                  <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="p-5 font-bold text-slate-700 flex items-center gap-3">
                      <div className={`p-2 rounded-lg shadow-sm ${item.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {item.tipo === 'ENTRADA' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                      </div>
                      {item.descricao}
                    </td>
                    <td className="p-5 text-sm text-slate-500 font-medium">{item.data}</td>
                    <td className="p-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                        {item.categoria}
                      </span>
                    </td>
                    
                    {/* Botão de Status Interativo */}
                    <td className="p-5">
                      <button 
                        onClick={() => handleAlternarStatus(item)}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 transition-all hover:scale-105 active:scale-95 ${
                          item.status === 'PAGO' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                            : 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'PAGO' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                        {item.status}
                      </button>
                    </td>

                    <td className={`p-5 text-right font-bold text-base ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.tipo === 'SAIDA' ? '-' : '+'}
                      {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    
                    <td className="p-5 text-center flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleExcluir(item.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                        title="Excluir lançamento"
                      >
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