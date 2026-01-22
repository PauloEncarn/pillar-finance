'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2, 
  Wallet, AlertCircle, CheckCircle2, X, Search, ChevronLeft, ChevronRight, 
  Landmark, ChevronDown, ChevronUp, Layers, Calendar, Tag
} from 'lucide-react';

export default function Lancamentos() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const [gruposAbertos, setGruposAbertos] = useState({});
  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null, descricao: '' });
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER"];
  const categoriasGerais = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "SERVICOS", "VENDAS", "OUTROS"];

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

  const [novoItem, setNovoItem] = useState({
    descricao: '', valor: '', tipo: 'SAIDA', categoria: 'COMBUSTIVEL', status: 'PENDENTE', data: '',
    banco: 'ITAU', tipoConta: 'PJ', formaPagamento: 'PIX', parcelas: '1'
  });

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setNovoItem(prev => ({ ...prev, data: hoje }));
    carregarDados();
  }, []);

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return "";
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const exibirNotificacao = (msg, tipo = 'sucesso') => {
    setNotificacao({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3000);
  };

  const transacoesFiltradas = useMemo(() => {
    return transacoes.filter(t => t.descricao?.toLowerCase().includes(busca.toLowerCase()));
  }, [transacoes, busca]);

  const itensPrincipais = useMemo(() => {
    return transacoesFiltradas.filter(t => t.parcelaAtual === 1 || t.totalParcelas <= 1);
  }, [transacoesFiltradas]);

  const totalPaginas = Math.ceil(itensPrincipais.length / itensPorPagina);
  const itensDaPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itensPrincipais.slice(inicio, inicio + itensPorPagina);
  }, [itensPrincipais, paginaAtual]);

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
        setNovoItem(prev => ({ ...prev, descricao: '', valor: '', parcelas: '1' }));
        exibirNotificacao("Lançamento criado!");
      }
    } catch (error) { exibirNotificacao("Erro ao salvar", "erro"); }
    finally { setIsSalvando(false); }
  };

  const handleAlternarStatus = async (item) => {
    const statusCycle = { 'PENDENTE': 'PAGO', 'PAGO': 'EM ABERTO', 'EM ABERTO': 'PENDENTE' };
    const novoStatus = statusCycle[item.status] || 'PENDENTE';
    setProcessandoId(item.id);
    try {
      await fetch(`/api/lancamentos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      setTransacoes(prev => prev.map(t => t.id === item.id ? { ...t, status: novoStatus } : t));
    } catch (error) { exibirNotificacao("Erro ao atualizar", "erro"); }
    finally { setProcessandoId(null); }
  };

  const confirmarExclusao = async () => {
    const id = modalConfirmacao.id;
    const baseName = modalConfirmacao.descricao.split(' (')[0];
    setModalConfirmacao({ aberto: false, id: null, descricao: '' });
    setProcessandoId(id);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTransacoes(prev => prev.filter(item => !item.descricao.startsWith(baseName)));
        exibirNotificacao("Lançamento removido!");
      }
    } catch (error) { exibirNotificacao("Erro ao excluir", "erro"); }
    finally { setProcessandoId(null); }
  };

  return (
    <div className="relative space-y-6 animate-in fade-in pb-10">
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-50 text-white font-bold'}`}>
          <span className="font-bold text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO */}
      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center border border-slate-100">
            <Trash2 size={32} className="mx-auto text-rose-500 mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Excluir Registro?</h3>
            <p className="text-slate-500 text-[10px] font-bold mb-6">ESSA AÇÃO REMOVERÁ O LANÇAMENTO E TODAS AS SUAS PARCELAS DO BANCO.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalConfirmacao({ aberto: false, id: null, descricao: '' })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase">Voltar</button>
              <button onClick={confirmarExclusao} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg uppercase tracking-widest">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-blue-600"><Wallet size={28} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Lançamentos</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Controle de Fluxo Analítico</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"><Plus size={16} /> Novo Registro</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 text-center">Data</th>
                <th className="p-6">Descrição / Banco</th>
                <th className="p-6 text-center">Status / Progresso</th>
                <th className="p-6 text-right">Valor Parcela</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itensDaPagina.map((item) => {
                const baseName = item.descricao.split(' (')[0];
                const grupoKey = `${baseName}-${item.valor}-${item.banco}`;
                const estaAberto = gruposAbertos[grupoKey];
                
                const parcelasDoGrupo = transacoesFiltradas.filter(t => 
                  t.descricao.startsWith(baseName) && 
                  t.valor === item.valor && 
                  t.banco === item.banco &&
                  t.totalParcelas > 1
                ).sort((a,b) => a.parcelaAtual - b.parcelaAtual);

                const pagas = parcelasDoGrupo.filter(t => t.status === 'PAGO').length;
                const isEntrada = item.tipo === 'ENTRADA';
                const corFundo = isEntrada ? 'bg-emerald-100/50 hover:bg-emerald-100/80' : 'bg-rose-100/50 hover:bg-rose-100/80';

                return (
                  <React.Fragment key={item.id}>
                    <tr className={`transition-all ${corFundo}`}>
                      <td className="p-6 text-center">
                        <span className="text-xs text-slate-600 font-black">{formatarDataExibicao(item.data)}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          {item.totalParcelas > 1 && (
                            <button onClick={() => setGruposAbertos(p => ({...p, [grupoKey]: !estaAberto}))} className={`p-1.5 rounded-lg transition-all ${estaAberto ? 'bg-blue-600 text-white rotate-180 shadow-md' : 'bg-white/70 text-slate-400'}`}>
                              <ChevronDown size={14} />
                            </button>
                          )}
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm uppercase tracking-tight">
                              {baseName}
                              {item.totalParcelas > 1 && <span className="ml-2 text-[9px] bg-white/60 px-2 py-0.5 rounded text-slate-600 font-black border border-slate-200">{item.totalParcelas}X</span>}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                              {item.banco} | {item.categoria}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        {item.totalParcelas > 1 ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${pagas === item.totalParcelas ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                            <Layers size={10} /> {pagas}/{item.totalParcelas} PAGAS
                          </div>
                        ) : (
                          <button disabled={processandoId === item.id} onClick={() => handleAlternarStatus(item)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all ${
                            item.status === 'PAGO' ? 'bg-emerald-600 text-white' : 
                            item.status === 'EM ABERTO' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'
                          }`}>
                            {item.status}
                          </button>
                        )}
                      </td>
                      <td className={`p-6 text-right font-black text-sm ${isEntrada ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isEntrada ? '+ ' : '- '}{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-6 text-center">
                        <button onClick={() => setModalConfirmacao({ aberto: true, id: item.id, descricao: item.descricao })} className="p-2 text-slate-500 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>

                    {estaAberto && parcelasDoGrupo.map((parc) => (
                      <tr key={parc.id} className={`animate-in slide-in-from-top-1 duration-200 ${isEntrada ? 'bg-emerald-50/60' : 'bg-rose-50/60'}`}>
                        <td className="p-4 text-center text-[10px] text-slate-600 font-black">{formatarDataExibicao(parc.data)}</td>
                        <td className="p-4 pl-16 font-bold text-slate-600 text-[11px] uppercase">
                          {parc.descricao} 
                        </td>
                        <td className="p-4 text-center">
                           <button disabled={processandoId === parc.id} onClick={() => handleAlternarStatus(parc)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${
                              parc.status === 'PAGO' ? 'bg-emerald-600 text-white' : 
                              parc.status === 'EM ABERTO' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                            }`}>{processandoId === parc.id ? <Loader2 className="animate-spin" size={10} /> : parc.status}</button>
                        </td>
                        <td className={`p-4 text-right font-bold text-xs ${isEntrada ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {Number(parc.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-4 text-center">
                          {/* Lixeira removida daqui por segurança */}
                          <div className="w-8 h-8 mx-auto flex items-center justify-center opacity-20"><Tag size={12}/></div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO REGISTRO */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-6 bg-slate-50 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Novo Registro</h3>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvar} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Descrição</label>
                <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Data Vencimento</label>
                <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Valor Total (R$)</label>
                <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Categoria</label>
                <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                  {categoriasGerais.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Banco</label>
                <select value={novoItem.banco} onChange={e => setNovoItem({...novoItem, banco: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                  {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Fluxo</label>
                <select value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                  <option value="ENTRADA">RECEITA (+)</option>
                  <option value="SAIDA">DESPESA (-)</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Parcelas</label>
                <select value={novoItem.parcelas} onChange={e => setNovoItem({...novoItem, parcelas: e.target.value})} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-700 text-sm">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div className="md:col-span-3 pt-4">
                <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                  {isSalvando ? <Loader2 className="animate-spin" size={20} /> : `Processar Lançamento`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}