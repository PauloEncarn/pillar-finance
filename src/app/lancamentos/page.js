'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Loader2, Wallet, X, Search, Edit3,
  Landmark, Tag, CheckCircle2, DollarSign,
  User, Building2, ArrowUpRight, ArrowDownLeft, AlertTriangle, Calendar,
  CreditCard, ChevronDown, Layers, ChevronLeft, ChevronRight, RotateCcw, Check
} from 'lucide-react';

export default function Lancamentos() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSalvando, setIsSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 8;

  const [gruposAbertos, setGruposAbertos] = useState({});
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });
  
  const [modalPagamento, setModalPagamento] = useState({ 
    aberto: false, item: null, parcelas: '1', banco: 'ITAU', forma: 'PIX', data: new Date().toISOString().split('T')[0]
  });

  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER"];
  const categoriasGerais = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "SERVICOS", "VENDAS", "OUTROS"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO DEBITO", "CREDITO", "DINHEIRO", "TRANSFERENCIA", "FINANCIAMENTO"];

  const [novoItem, setNovoItem] = useState({
    descricao: '', valor: '', tipo: 'SAIDA', categoria: 'OUTROS', tipoConta: 'PJ'
  });

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setTransacoes(Array.isArray(data) ? data : []);
    } catch (error) { exibirNotificacao("Erro de conexão", "erro"); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { carregarDados(); }, []);

  const exibirNotificacao = (msg, tipo = 'sucesso') => {
    setNotificacao({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3000);
  };

  // --- LÓGICA DE FILTRO E PAGINAÇÃO ---
  const transacoesFiltradas = useMemo(() => transacoes.filter(t => t.descricao?.toLowerCase().includes(busca.toLowerCase())), [transacoes, busca]);
  const itensPrincipais = useMemo(() => transacoesFiltradas.filter(t => t.parcelaAtual === 1 || t.totalParcelas <= 1), [transacoesFiltradas]);
  const totalPaginas = Math.ceil(itensPrincipais.length / itensPorPagina);
  const itensDaPagina = useMemo(() => itensPrincipais.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina), [itensPrincipais, paginaAtual]);

  // --- HANDLERS ---
  const handleUpdateStatus = async (id, novoStatus) => {
    setProcessandoId(id);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });
      if (res.ok) {
        await carregarDados();
        exibirNotificacao(novoStatus === 'PAGO' ? "Pago!" : "Estornado!");
      }
    } catch (error) { exibirNotificacao("Erro ao atualizar", "erro"); }
    finally { setProcessandoId(null); }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setIsSalvando(true);
    const url = modoEdicao ? `/api/lancamentos/${novoItem.id}` : '/api/lancamentos';
    const method = modoEdicao ? 'PATCH' : 'POST';
    try {
      const payload = { ...novoItem, data: new Date().toISOString() };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { await carregarDados(); fecharModal(); exibirNotificacao("Sucesso!"); }
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
      if (res.ok) { await carregarDados(); setModalPagamento({ ...modalPagamento, aberto: false }); exibirNotificacao("Baixa efetuada!"); }
    } catch (error) { exibirNotificacao("Erro na baixa", "erro"); }
    finally { setProcessandoId(null); }
  };

  const abrirEdicao = (item) => { setNovoItem({ ...item, valor: item.valor.toString() }); setModoEdicao(true); setModalAberto(true); };
  const fecharModal = () => { setModalAberto(false); setModoEdicao(false); setNovoItem({ descricao: '', valor: '', tipo: 'SAIDA', categoria: 'OUTROS', tipoConta: 'PJ' }); };

  return (
    <div className="relative space-y-6 max-w-[1600px] mx-auto p-4 pb-20 font-sans tracking-tight">
      
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[120] px-6 py-4 rounded-2xl shadow-2xl border font-black uppercase text-[10px] tracking-widest ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-rose-900 text-white'}`}>
          {notificacao.mensagem}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-3xl text-blue-600"><Wallet size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pillar Finance</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-widest">Gestão Operacional</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto items-center">
          <div className="relative flex-1 lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Pesquisar..." value={busca} onChange={(e) => {setBusca(e.target.value); setPaginaAtual(1);}} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl"><Plus size={18} /> Novo</button>
        </div>
      </div>

      {/* TABELA AGRUPADA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="p-8">Descrição / Cabeçalho</th>
              <th className="p-8 text-center">Tipo</th>
              <th className="p-8 text-center">Ações de Gestão</th>
              <th className="p-8 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {itensDaPagina.map((item) => {
              const baseName = item.descricao.split(' (')[0];
              const estaAberto = gruposAbertos[item.id];
              const parcelasDoGrupo = transacoesFiltradas.filter(t => t.descricao.startsWith(baseName) && t.totalParcelas > 1).sort((a,b) => a.parcelaAtual - b.parcelaAtual);
              const pagasCount = parcelasDoGrupo.filter(t => t.status === 'PAGO').length;

              return (
                <React.Fragment key={item.id}>
                  <tr className={`transition-all ${item.tipo === 'ENTRADA' ? 'bg-emerald-50/10' : 'bg-rose-50/10'}`}>
                    <td className="p-8">
                      <div className="flex items-center gap-4">
                        {item.totalParcelas > 1 && (
                          <button onClick={() => setGruposAbertos(prev => ({...prev, [item.id]: !estaAberto}))} className={`p-2 rounded-xl transition-all ${estaAberto ? 'bg-blue-600 text-white shadow-lg rotate-180' : 'bg-slate-100 text-slate-400'}`}><ChevronDown size={16} /></button>
                        )}
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{baseName}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1 mt-1"><Tag size={10}/> {item.categoria}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-8 text-center"><span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-50 border border-slate-100">{item.tipoConta}</span></td>
                    <td className="p-8 text-center">
                      <div className="flex items-center justify-center gap-3">
                        {item.totalParcelas > 1 ? (
                          <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-2"><Layers size={12}/> {pagasCount} / {item.totalParcelas}</div>
                        ) : (
                          item.status === 'PAGO' ? (
                            <button onClick={() => handleUpdateStatus(item.id, 'PENDENTE')} className="group bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 mx-auto"><CheckCircle2 size={14}/> Pago <RotateCcw size={12} className="hidden group-hover:block ml-1"/></button>
                          ) : (
                            <button onClick={() => setModalPagamento({...modalPagamento, aberto: true, item, parcelas: '1'})} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Liquidar</button>
                          )
                        )}
                        {/* BOTÃO EDITAR PRINCIPAL */}
                        {item.status !== 'PAGO' && (
                          <button onClick={() => abrirEdicao(item)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit3 size={18}/></button>
                        )}
                        {/* BOTÃO EXCLUIR PRINCIPAL */}
                        <button onClick={() => setModalExcluir({ aberto: true, id: item.id })} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                      </div>
                    </td>
                    <td className="p-8 text-right font-black text-base">{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  </tr>

                  {/* PARCELAS INDIVIDUAIS COM OPÇÃO DE PAGAMENTO DETALHADO */}
                  {estaAberto && parcelasDoGrupo.map((parc) => (
                    <tr key={parc.id} className="bg-slate-50/50 border-l-4 border-blue-500">
                      <td className="p-4 pl-20 text-[10px] font-black text-slate-400 uppercase">
                        {parc.parcelaAtual}º Parc - Vecto: {new Date(parc.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td colSpan="2" className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${parc.status === 'PAGO' ? 'text-emerald-600 bg-emerald-100' : 'text-amber-600 bg-amber-100'}`}>
                            {parc.status} {parc.status === 'PAGO' && `(${parc.formaPagamento})`}
                          </span>
                          
                          {parc.status === 'PAGO' ? (
                            <button disabled={processandoId === parc.id} onClick={() => handleUpdateStatus(parc.id, 'PENDENTE')} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg" title="Estornar"><RotateCcw size={16}/></button>
                          ) : (
                            <button onClick={() => setModalPagamento({...modalPagamento, aberto: true, item: parc, parcelas: '1'})} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Informar Pagamento Detalhado"><Check size={18}/></button>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-black text-slate-500">{Number(parc.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => p - 1)} className="p-2 rounded-xl bg-white border disabled:opacity-30"><ChevronLeft/></button>
          <span className="text-xs font-black text-slate-400 uppercase">Página {paginaAtual} de {totalPaginas}</span>
          <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => p + 1)} className="p-2 rounded-xl bg-white border disabled:opacity-30"><ChevronRight/></button>
        </div>
      )}

      {/* MODAL LIQUIDAR (USADO PARA TÍTULOS E PARCELAS) */}
      {modalPagamento.aberto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center italic">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><DollarSign size={24}/> Informar Pagamento</h3>
              <button onClick={() => setModalPagamento({ ...modalPagamento, aberto: false })}><X size={24} /></button>
            </div>
            <form onSubmit={handleEfetivarBaixa} className="p-10 space-y-5">
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Item selecionado</p>
                  <p className="text-lg font-black text-slate-800 uppercase leading-tight">{modalPagamento.item?.descricao}</p>
                  <p className="text-2xl font-black text-emerald-600 mt-2 tracking-tighter">R$ {Number(modalPagamento.item?.valor).toLocaleString('pt-BR')}</p>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1 italic">Data Real do Pagamento</label>
                    <input type="date" required value={modalPagamento.data} onChange={e => setModalPagamento({...modalPagamento, data: e.target.value})} className="w-full p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl font-black text-emerald-700 outline-none focus:ring-4 focus:ring-emerald-200 transition-all" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Banco Origem</label>
                    <div className="relative">
                      <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                      <select value={modalPagamento.banco} onChange={e => setModalPagamento({...modalPagamento, banco: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none">
                        {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Forma de Pagto</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                      <select value={modalPagamento.forma} onChange={e => setModalPagamento({...modalPagamento, forma: e.target.value})} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs outline-none">
                        {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
               </div>

               {/* PARCELAMENTO SÓ APARECE SE NÃO FOR UMA PARCELA JÁ EXISTENTE */}
               {modalPagamento.item?.totalParcelas <= 1 && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Dividir em Parcelas?</label>
                    <select value={modalPagamento.parcelas} onChange={e => setModalPagamento({...modalPagamento, parcelas: e.target.value})} className="w-full p-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-black text-sm outline-none">
                      <option value="1">NÃO (PAGAMENTO ÚNICO)</option>
                      {Array.from({ length: 119 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
               )}

               <button type="submit" disabled={processandoId} className="w-full bg-emerald-600 text-white p-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50">
                  {processandoId ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar e Lançar"}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NOVO REGISTRO / EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{modoEdicao ? 'Editar Registro' : 'Agendar Novo Título'}</h3>
              <button onClick={fecharModal} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24}/></button>
            </div>
            <form onSubmit={handleSalvar} className="p-10 space-y-6">
              <input type="text" required placeholder="Descrição" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none" value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} />
              <input type="number" step="0.01" required placeholder="Valor (R$)" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-black text-lg outline-none" value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipo: 'ENTRADA'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'ENTRADA' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>RECEITA</button>
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipo: 'SAIDA'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'SAIDA' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>DESPESA</button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipoConta: 'PF'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipoConta === 'PF' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>PF</button>
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipoConta: 'PJ'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipoConta === 'PJ' ? 'bg-white text-blue-600' : 'text-slate-400'}`}>PJ</button>
                </div>
              </div>
              <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl">Confirmar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {modalExcluir.aberto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl border border-slate-100">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><AlertTriangle size={48}/></div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Excluir?</h3>
            <p className="text-slate-400 text-[10px] font-black mb-8 uppercase tracking-widest">Ação irreversível.</p>
            <div className="flex gap-4">
              <button onClick={() => setModalExcluir({ aberto: false, id: null })} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">Voltar</button>
              <button onClick={handleExcluir} className="flex-1 bg-rose-600 text-white py-4 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}