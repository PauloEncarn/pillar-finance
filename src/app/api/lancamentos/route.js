'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Wallet, X, Search, Landmark, Tag, 
  CreditCard, CheckCircle2, DollarSign, Loader2,
  ChevronDown, Layers, ChevronLeft, ChevronRight
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
  const [modalPagamento, setModalPagamento] = useState({ aberto: false, item: null, parcelas: '1', banco: 'ITAU', forma: 'PIX', data: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null, descricao: '' });
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER"];
  const categoriasGerais = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "SERVICOS", "VENDAS", "FINANCIAMENTO", "OUTROS"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO DEBITO", "CREDITO", "DINHEIRO", "DEBITO EM CONTA"];

  // CORREÇÃO DO ERRO DE SETSTATE: Inicialização via função (Lazy Initializer)
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
      exibirNotificacao("Erro de conexão", "erro"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
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

  const transacoesFiltradas = useMemo(() => transacoes.filter(t => t.descricao?.toLowerCase().includes(busca.toLowerCase())), [transacoes, busca]);
  const itensPrincipais = useMemo(() => transacoesFiltradas.filter(t => t.parcelaAtual === 1 || t.totalParcelas <= 1), [transacoesFiltradas]);
  
  const totalPaginas = Math.ceil(itensPrincipais.length / itensPorPagina);
  const itensDaPagina = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itensPrincipais.slice(inicio, inicio + itensPorPagina);
  }, [itensPrincipais, paginaAtual]);

  const handleSalvarComprometimento = async (e) => {
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
        exibirNotificacao("Lançamento registrado!");
      }
    } catch (error) { exibirNotificacao("Erro ao salvar", "erro"); }
    finally { setIsSalvando(false); }
  };

  const handleEfetivarBaixa = async (e) => {
    e.preventDefault();
    setProcessandoId(modalPagamento.item.id);
    try {
      const res = await fetch(`/api/lancamentos/${modalPagamento.item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banco: modalPagamento.banco,
          formaPagamento: modalPagamento.forma,
          parcelas: modalPagamento.parcelas,
          dataPagamento: modalPagamento.data
        })
      });
      if (res.ok) {
        await carregarDados();
        setModalPagamento({ aberto: false, item: null });
        exibirNotificacao("Pagamento realizado!");
      }
    } catch (error) { exibirNotificacao("Erro na baixa", "erro"); }
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
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] px-6 py-4 rounded-2xl shadow-2xl border ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500 text-white font-bold' : 'bg-rose-900 text-white font-bold'}`}>
          {notificacao.mensagem}
        </div>
      )}

      {/* MODAL BAIXA (PAGAMENTO) */}
      {modalPagamento.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="font-black uppercase flex items-center gap-2"><DollarSign size={20}/> Liquidar Título</h3>
              <button onClick={() => setModalPagamento({ aberto: false })}><X /></button>
            </div>
            <form onSubmit={handleEfetivarBaixa} className="p-8 space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Item Selecionado</p>
                  <p className="text-sm font-bold text-slate-700">{modalPagamento.item?.descricao} - R$ {Number(modalPagamento.item?.valor).toLocaleString('pt-BR')}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Data da Baixa</label>
                    <input type="date" required value={modalPagamento.data} onChange={e => setModalPagamento({...modalPagamento, data: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Parcelamento</label>
                    <select value={modalPagamento.parcelas} onChange={e => setModalPagamento({...modalPagamento, parcelas: e.target.value})} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-700 text-sm">
                      <option value="1">À VISTA (1x)</option>
                      {Array.from({ length: 119 }, (_, i) => i + 2).map(n => (
                        <option key={n} value={n}>{n >= 60 ? 'FINANC.' : 'PARCELADO'} {n}x</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Banco</label>
                    <select value={modalPagamento.banco} onChange={e => setModalPagamento({...modalPagamento, banco: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                      {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Forma de Pagto</label>
                    <select value={modalPagamento.forma} onChange={e => setModalPagamento({...modalPagamento, forma: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                      {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
               </div>
               <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Confirmar Pagamento</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO REGISTRO (PASSO 1) */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Novo Lançamento</h3>
              <button onClick={() => setModalAberto(false)}><X /></button>
            </div>
            <form onSubmit={handleSalvarComprometimento} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Descrição do Título</label>
                <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" placeholder="Ex: Financiamento de Ativos" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Valor Bruto</label>
                <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Data de Vencimento</label>
                <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Categoria</label>
                <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                  {categoriasGerais.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Fluxo</label>
                <select value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm">
                  <option value="SAIDA">DESPESA (-)</option>
                  <option value="ENTRADA">RECEITA (+)</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-4 border-t border-slate-50 mt-2">
                <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase text-xs shadow-xl hover:bg-blue-600 transition-all">
                   {isSalvando ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Agendar Título"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-blue-600 shadow-blue-50"><Wallet size={28} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Controle Financeiro</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Compromissos e Baixas</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Pesquisar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg transition-all"><Plus size={16} /> Novo Registro</button>
        </div>
      </div>

      {/* TABELA ANALÍTICA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 text-center">Data</th>
                <th className="p-6">Descrição / Info</th>
                <th className="p-6 text-center">Status / Ação</th>
                <th className="p-6 text-right">Valor</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itensDaPagina.map((item) => {
                const isEntrada = item.tipo === 'ENTRADA';
                const corFundo = isEntrada ? 'bg-emerald-50/40' : 'bg-rose-50/40';
                return (
                  <tr key={item.id} className={`transition-all ${corFundo}`}>
                    <td className="p-6 text-center text-xs font-black text-slate-500">{formatarDataExibicao(item.data)}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-sm uppercase">{item.descricao}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mt-0.5">
                           <Tag size={10}/> {item.categoria} | <Landmark size={10}/> {item.banco === 'AGUARDANDO' ? 'PENDENTE' : item.banco}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {item.status === 'PAGO' ? (
                        <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 justify-center w-fit mx-auto"><CheckCircle2 size={12}/> Pago</div>
                      ) : (
                        <button 
                          onClick={() => setModalPagamento({ 
                            aberto: true, 
                            item, 
                            parcelas: '1', 
                            banco: 'ITAU', 
                            forma: 'PIX', 
                            data: new Date().toISOString().split('T')[0] 
                          })}
                          className="bg-white text-emerald-600 border border-emerald-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                        >
                          Lançar Pagto
                        </button>
                      )}
                    </td>
                    <td className={`p-6 text-right font-black text-sm ${isEntrada ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-6 text-center">
                      <button onClick={() => setModalConfirmacao({ aberto: true, id: item.id, descricao: item.descricao })} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}