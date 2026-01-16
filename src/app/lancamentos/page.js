'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2, Tag, 
  Wallet, AlertCircle, CheckCircle2, X, Search, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function Lancamentos() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const categoriasReceita = ["SERVICOS", "LOCACAO", "VENDAS", "OUTRAS RECEITAS"];
  const categoriasDespesa = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "ADMINISTRATIVO", "OUTRAS DESPESAS"];

  const [novoItem, setNovoItem] = useState({
    descricao: '', valor: '', tipo: 'SAIDA', categoria: 'COMBUSTIVEL', status: 'PENDENTE', data: ''
  });

  // --- FUNÇÃO PARA EXIBIR DATA SEM ERRO DE FUSO ---
  const formatarDataExibicao = (dataString) => {
    if (!dataString) return "";
    // Pegamos apenas a parte YYYY-MM-DD ignorando qualquer informação de hora/fuso
    const apenasData = dataString.split('T')[0];
    const [ano, mes, dia] = apenasData.split('-');
    // Retornamos o texto puro montado manualmente
    return `${dia}/${mes}/${ano}`;
  };

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setTransacoes(data);
    } catch (error) {
      exibirNotificacao("Erro de conexão", "erro");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const hoje = new Date();
    // Garante que o input comece com a data local correta
    const hojeLocal = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    setNovoItem(prev => ({ ...prev, data: hojeLocal }));
    carregarDados();
  }, []);

  const dadosFiltrados = useMemo(() => {
    return transacoes.filter(t => 
      t.descricao.toLowerCase().includes(busca.toLowerCase())
    );
  }, [transacoes, busca]);

  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  
  const transacoesPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return dadosFiltrados.slice(inicio, fim);
  }, [dadosFiltrados, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca]);

  const exibirNotificacao = (msg, tipo = 'sucesso') => {
    setNotificacao({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3000);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!novoItem.descricao || !novoItem.valor) return;
    setIsSalvando(true);
    try {
      const res = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
      });
      if (res.ok) {
        await carregarDados();
        setNovoItem(prev => ({ ...prev, descricao: '', valor: '', status: 'PENDENTE' }));
        setModalAberto(false);
        exibirNotificacao("Lançamento salvo com sucesso!");
      }
    } catch (error) {
      exibirNotificacao("Erro ao salvar", "erro");
    } finally {
      setIsSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.id;
    setModalConfirmacao({ aberto: false, id: null });
    setProcessandoId(id);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransacoes(prev => prev.filter(item => item.id !== id));
        exibirNotificacao("Removido com sucesso");
      }
    } catch (error) {
      exibirNotificacao("Erro ao excluir", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  const handleAlternarStatus = async (item) => {
    const novoStatus = item.status === 'PENDENTE' ? 'PAGO' : 'PENDENTE';
    setProcessandoId(item.id);
    try {
      const res = await fetch(`/api/lancamentos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        setTransacoes(prev => prev.map(t => t.id === item.id ? { ...t, status: novoStatus } : t));
      }
    } catch (error) {
      exibirNotificacao("Erro de atualização", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500 pb-10">
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full ${
          notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-500 text-white'
        }`}>
          {notificacao.tipo === 'sucesso' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tighter">Excluir Registro?</h3>
            <p className="text-slate-500 text-sm mb-6 font-medium">Esta operação não pode ser revertida.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalConfirmacao({ aberto: false, id: null })} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs hover:bg-slate-200 transition-all">CANCELAR</button>
              <button onClick={confirmarExclusao} className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-black text-xs hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">EXCLUIR</button>
            </div>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-center p-8 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Novo Registro</h3>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>
            <form onSubmit={handleSalvar} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição</label>
                <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-blue-600 outline-none" placeholder="Ex: Manutenção Mensal" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tipo</label>
                <select value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value})} className={`w-full p-4 border rounded-2xl font-black outline-none appearance-none cursor-pointer ${novoItem.tipo === 'ENTRADA' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                  <option value="ENTRADA">RECEITA (+)</option>
                  <option value="SAIDA">DESPESA (-)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Categoria</label>
                <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold outline-none cursor-pointer">
                  {(novoItem.tipo === 'ENTRADA' ? categoriasReceita : categoriasDespesa).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor (R$)</label>
                <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-black focus:ring-2 focus:ring-blue-600 outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data</label>
                <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold outline-none" />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center shadow-xl disabled:opacity-50">
                  {isSalvando ? <Loader2 className="animate-spin" size={24} /> : "Finalizar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-blue-600"><Wallet size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Gestão Financeira</h1>
            <p className="text-slate-500 text-sm font-medium">Visualizando {dadosFiltrados.length} registros no total.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-600 w-64 transition-all shadow-sm"
            />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-3 bg-blue-600 hover:bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-200 active:scale-95">
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} /> 
            <p className="font-black uppercase text-xs tracking-widest">Sincronizando Banco de Dados...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lançamento</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transacoesPaginadas.length === 0 ? (
                    <tr><td colSpan="6" className="p-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest">Nenhum registro encontrado.</td></tr>
                  ) : (
                    transacoesPaginadas.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl ${item.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                              {item.tipo === 'ENTRADA' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                            </div>
                            <span className="font-black text-slate-700 text-sm uppercase tracking-tight">{item.descricao}</span>
                          </div>
                        </td>
                        <td className="p-6"><span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl uppercase">{item.categoria}</span></td>
                        {/* AQUI ESTÁ A MUDANÇA: USANDO A NOVA FUNÇÃO DE FORMATAÇÃO */}
                        <td className="p-6 text-sm text-slate-400 font-bold">{formatarDataExibicao(item.data)}</td>
                        <td className="p-6">
                          <button disabled={processandoId === item.id} onClick={() => handleAlternarStatus(item)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${item.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'} disabled:opacity-30`}>
                            {processandoId === item.id ? <Loader2 className="animate-spin" size={12} /> : item.status}
                          </button>
                        </td>
                        <td className={`p-6 text-right font-black text-base ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {item.tipo === 'SAIDA' ? '- ' : '+ '}{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-6 text-center">
                          <button disabled={processandoId === item.id} onClick={() => setModalConfirmacao({ aberto: true, id: item.id })} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Página {paginaAtual} de {totalPaginas || 1}
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual(p => p - 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  disabled={paginaAtual === totalPaginas || totalPaginas === 0}
                  onClick={() => setPaginaAtual(p => p + 1)}
                  className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}