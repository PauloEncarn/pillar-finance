'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Loader2, Wallet, X, Search, 
  Landmark, ChevronDown, Layers, Tag, CreditCard, 
  ArrowUpCircle, ArrowDownCircle, Banknote, CalendarDays, AlignLeft
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

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER", "NUBANK", "INTER"];
  const categoriasGerais = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "SERVICOS", "VENDAS", "OUTROS"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO DEBITO", "CREDITO", "DINHEIRO"];

  const [novoItem, setNovoItem] = useState({
    descricao: '', valor: '', tipo: 'SAIDA', categoria: 'COMBUSTIVEL', status: 'PENDENTE', data: '',
    banco: 'ITAU', tipoConta: 'PJ', formaPagamento: 'PIX', parcelas: '1'
  });

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
    <div className="relative space-y-6 animate-in fade-in pb-10 p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-50 text-white font-bold'}`}>
          {notificacao.mensagem}
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO */}
      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center border border-slate-100">
            <Trash2 size={32} className="mx-auto text-rose-500 mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Excluir Registro?</h3>
            <p className="text-slate-500 text-[10px] font-bold mb-6 tracking-wide uppercase">Isso removerá o grupo completo de parcelas.</p>
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
          <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-3xl text-blue-600"><Wallet size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pillar Finance</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Controle de Fluxo Operacional</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-100/50"><Plus size={16} /> Novo Registro</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 text-center">Data</th>
                <th className="p-6">Descrição / Informações</th>
                <th className="p-6 text-center">Status / Progresso</th>
                <th className="p-8 text-right">Valor Parcela</th>
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
                  t.totalParcelas > 1
                ).sort((a,b) => a.parcelaAtual - b.parcelaAtual);

                const pagas = parcelasDoGrupo.filter(t => t.status === 'PAGO').length;
                const isEntrada = item.tipo === 'ENTRADA';
                const corFundo = isEntrada ? 'bg-emerald-50/40 hover:bg-emerald-50/80' : 'bg-rose-50/40 hover:bg-rose-50/80';

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
                              {item.totalParcelas > 1 && <span className="ml-2 text-[9px] bg-white/80 px-2 py-0.5 rounded text-blue-600 font-black border border-blue-100">{item.totalParcelas}X</span>}
                            </span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-0.5">
                              <Landmark size={10} className="text-blue-500"/> {item.banco} | <Tag size={10} className="text-slate-400"/> {item.categoria} | <CreditCard size={10} className="text-slate-400"/> {item.formaPagamento}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        {item.totalParcelas > 1 ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${pagas === item.totalParcelas ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-blue-600 text-white border-blue-500'}`}>
                            <Layers size={10} /> {pagas}/{item.totalParcelas} PAGAS
                          </div>
                        ) : (
                          <button disabled={processandoId === item.id} onClick={() => handleAlternarStatus(item)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-sm transition-all border ${
                            item.status === 'PAGO' ? 'bg-emerald-600 text-white border-emerald-500' : 
                            item.status === 'EM ABERTO' ? 'bg-blue-600 text-white border-blue-500' : 'bg-orange-500 text-white border-orange-400'
                          }`}>
                            {item.status}
                          </button>
                        )}
                      </td>
                      <td className={`p-8 text-right font-black text-base ${isEntrada ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isEntrada ? '+ ' : '- '}{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-6 text-center">
                        <button onClick={() => setModalConfirmacao({ aberto: true, id: item.id, descricao: item.descricao })} className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm"><Trash2 size={18} /></button>
                      </td>
                    </tr>

                    {estaAberto && parcelasDoGrupo.map((parc) => (
                      <tr key={parc.id} className={`animate-in slide-in-from-top-1 duration-200 border-l-4 ${isEntrada ? 'bg-emerald-50/20 border-emerald-500' : 'bg-rose-50/20 border-rose-500'}`}>
                        <td className="p-4 text-center text-[10px] text-slate-400 font-bold italic">{formatarDataExibicao(parc.data)}</td>
                        <td className="p-4 pl-16">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-600 text-[11px] uppercase">{parc.descricao}</span>
                              <span className="text-[7px] font-black text-slate-400 uppercase opacity-60">{parc.formaPagamento}</span>
                            </div>
                        </td>
                        <td className="p-4 text-center">
                            <button disabled={processandoId === parc.id} onClick={() => handleAlternarStatus(parc)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase shadow-sm ${
                              parc.status === 'PAGO' ? 'bg-emerald-600 text-white' : 
                              parc.status === 'EM ABERTO' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                            }`}>{processandoId === parc.id ? <Loader2 className="animate-spin" size={10} /> : parc.status}</button>
                        </td>
                        <td className={`p-4 text-right font-bold text-xs ${isEntrada ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {Number(parc.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-4 text-center opacity-10"><Tag size={12}/></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO REGISTRO - LAYOUT ATUALIZADO */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-8 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white"><Plus size={20}/></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Novo Lançamento</h3>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvar} className="p-8 space-y-6 overflow-y-auto">
              {/* SEÇÃO: O QUE É? */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><AlignLeft size={12}/> Descrição do Título</label>
                  <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ex: Mensalidade Internet Pillar IT" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><CalendarDays size={12}/> Data Vencimento</label>
                  <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><Banknote size={12}/> Valor Total</label>
                  <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-600" placeholder="0.00" />
                </div>
              </div>

              {/* SEÇÃO: COMO PAGA? */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 flex items-center gap-2 ml-1"><Landmark size={12}/> Banco de Saída/Entrada</label>
                  <select value={novoItem.banco} onChange={e => setNovoItem({...novoItem, banco: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none cursor-pointer focus:border-blue-600">
                    {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 flex items-center gap-2 ml-1"><CreditCard size={12}/> Forma de Pagamento</label>
                  <select value={novoItem.formaPagamento} onChange={e => setNovoItem({...novoItem, formaPagamento: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none cursor-pointer focus:border-blue-600">
                    {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><Tag size={12}/> Categoria</label>
                  <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none">
                    {categoriasGerais.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><Layers size={12}/> Parcelamento</label>
                  <select value={novoItem.parcelas} onChange={e => setNovoItem({...novoItem, parcelas: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-blue-700 text-sm outline-none">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
              </div>

              {/* SEÇÃO: FLUXO */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                  <button 
                    type="button"
                    onClick={() => setNovoItem({...novoItem, tipo: 'ENTRADA'})}
                    className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'ENTRADA' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    <div className="flex items-center justify-center gap-2"><ArrowUpCircle size={14}/> RECEITA</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNovoItem({...novoItem, tipo: 'SAIDA'})}
                    className={`flex-1 md:px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'SAIDA' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    <div className="flex items-center justify-center gap-2"><ArrowDownCircle size={14}/> DESPESA</div>
                  </button>
                </div>

                <button type="submit" disabled={isSalvando} className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3">
                  {isSalvando ? <Loader2 className="animate-spin" size={18} /> : <>Efetivar Lançamento <Plus size={16}/></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}