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
  const [modalPagamento, setModalPagamento] = useState({ aberto: false, item: null, parcelas: '1', banco: 'ITAU', forma: 'PIX', data: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, id: null });
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
    } catch (error) { exibirNotificacao("Erro de conexão", "erro"); }
    finally { setIsLoading(false); }
  };

  const [novoItem, setNovoItem] = useState({
    descricao: '', valor: '', tipo: 'SAIDA', categoria: 'COMBUSTIVEL', tipoConta: 'PJ', data: ''
  });

  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setNovoItem(prev => ({ ...prev, data: hoje }));
    carregarDados();
  }, []);

  const exibirNotificacao = (msg, tipo = 'sucesso') => {
    setNotificacao({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3000);
  };

  // --- LÓGICA DE FILTRAGEM ---
  const transacoesFiltradas = useMemo(() => transacoes.filter(t => t.descricao?.toLowerCase().includes(busca.toLowerCase())), [transacoes, busca]);
  const itensPrincipais = useMemo(() => transacoesFiltradas.filter(t => t.parcelaAtual === 1 || t.totalParcelas <= 1), [transacoesFiltradas]);
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
        body: JSON.stringify({ ...novoItem, status: 'PENDENTE', parcelas: '1' })
      });
      if (res.ok) {
        await carregarDados();
        setModalAberto(false);
        exibirNotificacao("Compromisso registrado!");
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
        exibirNotificacao("Pagamento/Financiamento Processado!");
      }
    } catch (error) { exibirNotificacao("Erro na baixa", "erro"); }
    finally { setProcessandoId(null); }
  };

  return (
    <div className="relative space-y-6 animate-in fade-in pb-10">
      {/* NOTIFICAÇÃO */}
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[110] px-6 py-4 rounded-2xl shadow-2xl border ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-rose-900 text-white font-bold'}`}>
          <span className="font-bold text-sm">{notificacao.mensagem}</span>
        </div>
      )}

      {/* MODAL EFETIVAR PAGAMENTO/FINANCIAMENTO */}
      {modalPagamento.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tighter flex items-center gap-2"><CheckCircle2 /> Efetivar Liquidação</h3>
              <button onClick={() => setModalPagamento({ aberto: false })}><X /></button>
            </div>
            <form onSubmit={handleEfetivarBaixa} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl mb-2 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Item Selecionado</p>
                  <p className="text-sm font-bold text-slate-700">{modalPagamento.item?.descricao} - R$ {Number(modalPagamento.item?.valor).toLocaleString('pt-BR')}</p>
               </div>
               <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Data da Baixa (Hoje)</label>
                <input type="date" required value={modalPagamento.data} onChange={e => setModalPagamento({...modalPagamento, data: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Modalidade / Parcelas</label>
                <select value={modalPagamento.parcelas} onChange={e => setModalPagamento({...modalPagamento, parcelas: e.target.value})} className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl font-black text-blue-700 text-sm">
                  <option value="1">À VISTA (1x)</option>
                  {Array.from({ length: 119 }, (_, i) => i + 2).map(n => (
                    <option key={n} value={n}>{n === 120 ? 'FINANCIAMENTO' : 'PARCELADO'} {n}x</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Banco</label>
                <select value={modalPagamento.banco} onChange={e => setModalPagamento({...modalPagamento, banco: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                  {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Forma de Pagto</label>
                <select value={modalPagamento.forma} onChange={e => setModalPagamento({...modalPagamento, forma: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                  {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all">Confirmar Pagamento e Gerar Fluxo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-2xl text-blue-600"><Wallet size={28} /></div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Gestão Financeira</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Lançamentos e Liquidações</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg"><Plus size={16} /> Novo Registro</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6 text-center">Data</th>
                <th className="p-6">Descrição / Informações</th>
                <th className="p-6 text-center">Status / Ação</th>
                <th className="p-6 text-right">Valor</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itensDaPagina.map((item) => {
                const isEntrada = item.tipo === 'ENTRADA';
                const corFundo = isEntrada ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'bg-rose-50/30 hover:bg-rose-50/50';

                return (
                  <tr key={item.id} className={`transition-all ${corFundo}`}>
                    <td className="p-6 text-center text-xs font-black text-slate-500">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 text-sm uppercase">{item.descricao}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mt-0.5">
                           <Tag size={10}/> {item.categoria} | <Landmark size={10}/> {item.banco || 'AGUARDANDO PAGTO'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      {item.status === 'PAGO' ? (
                        <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-sm">PAGO</span>
                      ) : (
                        <button 
                          onClick={() => setModalPagamento({ aberto: true, item, parcelas: '1', banco: 'ITAU', forma: 'PIX', data: new Date().toISOString().split('T')[0] })}
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
                      <button onClick={() => setModalConfirmacao({ aberto: true, id: item.id })} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO REGISTRO (SIMPLIFICADO) */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Novo Lançamento</h3>
              <button onClick={() => setModalAberto(false)}><X /></button>
            </div>
            <form onSubmit={handleSalvarComprometimento} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Descrição do Compromisso</label>
                <input type="text" required value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" placeholder="Ex: Compra de Caminhão" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Valor Total</label>
                <input type="number" step="0.01" required value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Vencimento Original</label>
                <input type="date" required value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Categoria</label>
                <select value={novoItem.categoria} onChange={e => setNovoItem({...novoItem, categoria: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  {categoriasGerais.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Fluxo</label>
                <select value={novoItem.tipo} onChange={e => setNovoItem({...novoItem, tipo: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                  <option value="SAIDA">DESPESA (-)</option>
                  <option value="ENTRADA">RECEITA (+)</option>
                </select>
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase text-xs shadow-xl">Registrar e Aguardar Pagamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}