'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Loader2, 
  Wallet, X, Search, ChevronLeft, ChevronRight, 
  Landmark, ChevronDown, Layers, Calendar, Tag, CreditCard, CheckCircle2, DollarSign
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
  const [modalPagamento, setModalPagamento] = useState({ aberto: false, item: null });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null, descricao: '' });
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER"];
  const categoriasGerais = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "SERVICOS", "VENDAS", "FINANCIAMENTO", "OUTROS"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO DEBITO", "CREDITO", "DINHEIRO", "DEBITO EM CONTA"];

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

  const confirmarPagamento = async (e) => {
    e.preventDefault();
    const { item } = modalPagamento;
    setProcessandoId(item.id);
    try {
      const res = await fetch(`/api/lancamentos/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'PAGO',
          banco: item.banco,
          formaPagamento: item.formaPagamento,
          data: item.data // Data da baixa real
        })
      });
      if (res.ok) {
        await carregarDados();
        setModalPagamento({ aberto: false, item: null });
        exibirNotificacao("Pagamento realizado!");
      }
    } catch (error) { exibirNotificacao("Erro ao processar", "erro"); }
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
        exibirNotificacao("Removido com sucesso!");
      }
    } catch (error) { exibirNotificacao("Erro ao excluir", "erro"); }
    finally { setProcessandoId(null); }
  };

  return (
    <div className="relative space-y-6 animate-in fade-in pb-10">
      
      {/* NOTIFICAÇÃO */}
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500/50 text-white' : 'bg-rose-900 border-rose-50 text-white font-bold'}`}>
          <span className="font-bold text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      {/* MODAL LANÇAR PAGAMENTO (BAIXA) */}
      {modalPagamento.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
              <h3 className="font-black text-emerald-800 uppercase tracking-tighter flex items-center gap-2"><DollarSign size={20}/> Confirmar Pagamento</h3>
              <button onClick={() => setModalPagamento({ aberto: false, item: null })}><X size={20}/></button>
            </div>
            <form onSubmit={confirmarPagamento} className="p-6 space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase">Confirmando pagamento de: <span className="text-slate-800">{modalPagamento.item?.descricao}</span></p>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Data do Pagamento</label>
                <input type="date" required value={modalPagamento.item?.data} onChange={e => setModalPagamento({ aberto: true, item: {...modalPagamento.item, data: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Banco de Saída</label>
                <select value={modalPagamento.item?.banco} onChange={e => setModalPagamento({ aberto: true, item: {...modalPagamento.item, banco: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                  {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Forma Utilizada</label>
                <select value={modalPagamento.item?.formaPagamento} onChange={e => setModalPagamento({ aberto: true, item: {...modalPagamento.item, formaPagamento: e.target.value}})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                  {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Efetivar Baixa</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO EXCLUSÃO */}
      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center border border-slate-100">
            <Trash2 size={32} className="mx-auto text-rose-500 mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Excluir Grupo?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalConfirmacao({ aberto: false, id: null, descricao: '' })} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase">Voltar</button>
              <button onClick={confirmarExclusao} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold text-xs shadow-lg uppercase">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-blue-600 shadow-blue-50"><Wallet size={28} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Lançamentos</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Fluxo de Caixa e Financiamentos</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition-all" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"><Plus size={16} /> Novo Lançamento</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 text-center">Vencimento</th>
                <th className="p-6">Descrição / Informações</th>
                <th className="p-6 text-center">Progresso / Status</th>
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
                const corFundo = isEntrada ? 'bg-emerald-100/30' : 'bg-rose-100/30';

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
                            <span className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-0.5">
                              <Landmark size={10}/> {item.banco} | <Tag size={10}/> {item.categoria} | <CreditCard size={10}/> {item.formaPagamento}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        {item.totalParcelas > 1 ? (
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${pagas === item.totalParcelas ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-blue-600 text-white border-blue-700'}`}>
                            <Layers size={10} /> {pagas}/{item.totalParcelas} PAGAS
                          </div>
                        ) : (
                          <button 
                            onClick={() => item.status !== 'PAGO' && setModalPagamento({ aberto: true, item: item })}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm transition-all flex items-center gap-2 mx-auto ${
                              item.status === 'PAGO' ? 'bg-emerald-600 text-white cursor-default' : 
                              'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                            }`}
                          >
                            {item.status === 'PAGO' ? <CheckCircle2 size={12}/> : <DollarSign size={12}/>}
                            {item.status === 'PAGO' ? 'PAGO' : 'LANÇAR PAGTO'}
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
                      <tr key={parc.id} className={`animate-in slide-in-from-top-1 duration-200 ${isEntrada ? 'bg-emerald-50/40' : 'bg-rose-50/40'}`}>
                        <td className="p-4 text-center text-[10px] text-slate-600 font-black">{formatarDataExibicao(parc.data)}</td>
                        <td className="p-4 pl-16">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-600 text-[11px] uppercase">{parc.descricao}</span>
                              <span className="text-[7px] font-black text-slate-400 uppercase">{parc.formaPagamento}</span>
                           </div>
                        </td>
                        <td className="p-4 text-center">
                           <button 
                             onClick={() => parc.status !== 'PAGO' && setModalPagamento({ aberto: true, item: parc })}
                             className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border transition-all ${
                              parc.status === 'PAGO' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}>{parc.status === 'PAGO' ? 'PAGO' : 'LANÇAR PAGTO'}</button>
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
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Vencimento Original</label>
                <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Valor Unitário / Parcela</label>
                <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-600" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Categoria</label>
                <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                  {categoriasGerais.map(c => <option key={c} value={c}>{c}</option>)}
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
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block ml-1">Quantidade Parcelas</label>
                <select value={novoItem.parcelas} onChange={e => setNovoItem({...novoItem, parcelas: e.target.value})} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-700 text-sm">
                  {Array.from({ length: 120 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div className="md:col-span-3 pt-4 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-4">Nota: Os dados de banco e forma de pagamento serão solicitados no momento da baixa (Pagamento).</p>
                <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50">
                  {isSalvando ? <Loader2 className="animate-spin" size={20} /> : `Agendar Lançamento`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}