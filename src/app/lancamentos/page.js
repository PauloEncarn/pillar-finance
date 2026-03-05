'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Loader2, Wallet, X, Search, 
  Landmark, ChevronDown, Layers, Tag, CreditCard, 
  ArrowUpCircle, ArrowDownCircle, Banknote, CalendarDays, AlignLeft,
  User, Building2, Hash, ChevronLeft, ChevronRight, CheckCircle2
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

  // --- LÓGICA DE FILTRO E AGRUPAMENTO ---
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

  // --- HANDLERS ---
  const handleSalvar = async (e) => {
    e.preventDefault();
    setIsSalvando(true);
    try {
      const res = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoItem,
          parcelas: parseInt(novoItem.parcelas)
        })
      });
      if (res.ok) {
        await carregarDados();
        setModalAberto(false);
        setNovoItem(prev => ({ ...prev, descricao: '', valor: '', parcelas: '1' }));
        exibirNotificacao("Lançamento processado!");
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
        exibirNotificacao("Registro removido!");
      }
    } catch (error) { exibirNotificacao("Erro ao excluir", "erro"); }
    finally { setProcessandoId(null); }
  };

  return (
    <div className="relative space-y-6 animate-in fade-in pb-10 p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[120] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-50 text-white font-bold'}`}>
          {notificacao.mensagem}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-3xl text-blue-600"><Wallet size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pillar Finance</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest leading-none">Gestão Operacional de Caixa</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar título..." value={busca} onChange={(e) => {setBusca(e.target.value); setPaginaAtual(1);}} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl"><Plus size={16} /> Novo Registro</button>
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
                <th className="p-6 text-center">Composição</th>
                <th className="p-6 text-center">Status</th>
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
                  t.descricao.startsWith(baseName) && t.valor === item.valor && t.totalParcelas > 1
                ).sort((a,b) => a.parcelaAtual - b.parcelaAtual);

                const pagas = parcelasDoGrupo.filter(t => t.status === 'PAGO').length;
                const isEntrada = item.tipo === 'ENTRADA';
                const corFundo = isEntrada ? 'bg-emerald-50/40' : 'bg-rose-50/40';

                return (
                  <React.Fragment key={item.id}>
                    <tr className={`transition-all hover:bg-white ${corFundo}`}>
                      <td className="p-6 text-center">
                        <span className="text-xs text-slate-600 font-black">{formatarDataExibicao(item.data)}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          {item.totalParcelas > 1 && (
                            <button onClick={() => setGruposAbertos(p => ({...p, [grupoKey]: !estaAberto}))} className={`p-1.5 rounded-lg transition-all ${estaAberto ? 'bg-blue-600 text-white rotate-180' : 'bg-white/70 text-slate-400'}`}>
                              <ChevronDown size={14} />
                            </button>
                          )}
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{baseName}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-0.5">
                              <Landmark size={10} className="text-blue-500"/> {item.banco} | <Tag size={10}/> {item.categoria}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                         <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${item.tipoConta === 'PJ' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                           {item.tipoConta === 'PJ' ? 'PJ' : 'PF'}
                         </span>
                      </td>
                      <td className="p-6 text-center">
                        {item.totalParcelas > 1 ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${pagas === item.totalParcelas ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-blue-600 text-white border-blue-500'}`}>
                            <Layers size={10} /> {pagas}/{item.totalParcelas} PAGAS
                          </div>
                        ) : (
                          <button disabled={processandoId === item.id} onClick={() => handleAlternarStatus(item)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border shadow-sm ${
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
                        <button onClick={() => setModalConfirmacao({ aberto: true, id: item.id, descricao: item.descricao })} className="p-2.5 bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                      </td>
                    </tr>

                    {estaAberto && parcelasDoGrupo.map((parc) => (
                      <tr key={parc.id} className={`animate-in slide-in-from-top-1 border-l-4 ${isEntrada ? 'bg-emerald-50/10 border-emerald-500' : 'bg-rose-50/10 border-rose-500'}`}>
                        <td className="p-4 text-center text-[10px] text-slate-400 font-bold italic">{formatarDataExibicao(parc.data)}</td>
                        <td className="p-4 pl-16">
                            <span className="font-bold text-slate-600 text-[11px] uppercase italic">{parc.descricao}</span>
                        </td>
                        <td className="p-4 text-center">
                           <span className="text-[9px] font-black text-slate-300">{parc.tipoConta}</span>
                        </td>
                        <td className="p-4 text-center">
                            <button disabled={processandoId === parc.id} onClick={() => handleAlternarStatus(parc)} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase shadow-sm ${
                              parc.status === 'PAGO' ? 'bg-emerald-600 text-white' : 
                              parc.status === 'EM ABERTO' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                            }`}>
                                {processandoId === parc.id ? <Loader2 size={10} className="animate-spin" /> : parc.status}
                            </button>
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

      {/* PAGINAÇÃO */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30"><ChevronLeft size={20}/></button>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Página {paginaAtual} de {totalPaginas}</span>
          <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)} className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30"><ChevronRight size={20}/></button>
        </div>
      )}

      {/* MODAL NOVO REGISTRO */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-8 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg"><Plus size={20}/></div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Lançamento de Título</h3>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvar} className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><AlignLeft size={12}/> Descrição</label>
                  <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="Ex: Manutenção Mensal Pillar IT" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><CalendarDays size={12}/> Vencimento</label>
                  <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><Banknote size={12}/> Valor Bruto</label>
                  <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" placeholder="0.00" />
                </div>
              </div>

              {/* CARD FINANCEIRO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 flex items-center gap-2 ml-1"><Landmark size={12}/> Banco Origem</label>
                    <select value={novoItem.banco} onChange={e => setNovoItem({...novoItem, banco: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-600 cursor-pointer">
                      {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 flex items-center gap-2 ml-1"><Tag size={12}/> Categoria</label>
                    <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none">
                      {categoriasGerais.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 flex items-center gap-2 ml-1"><CreditCard size={12}/> Forma Pagamento</label>
                    <select value={novoItem.formaPagamento} onChange={e => setNovoItem({...novoItem, formaPagamento: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none cursor-pointer">
                      {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 flex items-center gap-2 ml-1"><Hash size={12}/> Número de Parcelas</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="360"
                      value={novoItem.parcelas} 
                      onChange={e => setNovoItem({...novoItem, parcelas: e.target.value})} 
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-blue-600 text-sm outline-none focus:ring-1 focus:ring-blue-600" 
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-2">
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-2 block tracking-widest ml-1">Vincular a:</label>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                      <button 
                        type="button"
                        onClick={() => setNovoItem({...novoItem, tipoConta: 'PF'})}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 transition-all ${novoItem.tipoConta === 'PF' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <User size={14}/> PESSOA FÍSICA
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNovoItem({...novoItem, tipoConta: 'PJ'})}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 transition-all ${novoItem.tipoConta === 'PJ' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                      >
                        <Building2 size={14}/> PESSOA JURÍDICA
                      </button>
                    </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto border border-slate-200">
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipo: 'ENTRADA'})} className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'ENTRADA' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>RECEITA (+)</button>
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipo: 'SAIDA'})} className={`flex-1 md:px-8 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'SAIDA' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>DESPESA (-)</button>
                </div>

                <button type="submit" disabled={isSalvando} className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSalvando ? <Loader2 className="animate-spin" size={18} /> : "Finalizar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl border border-slate-100">
            <Trash2 size={48} className="mx-auto text-rose-500 mb-6 animate-bounce" />
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Excluir?</h3>
            <p className="text-slate-400 text-[10px] font-black mb-8 uppercase tracking-widest leading-relaxed">Isso removerá todo o grupo de parcelas permanentemente.</p>
            <div className="flex gap-4">
              <button onClick={() => setModalConfirmacao({ aberto: false, id: null, descricao: '' })} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">Voltar</button>
              <button onClick={confirmarExclusao} className="flex-1 bg-rose-600 text-white py-4 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}