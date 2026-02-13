'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Trash2, Loader2, Wallet, X, Search, Edit3,
  Landmark, Tag, CheckCircle2, DollarSign,
  User, Building2, ArrowUpRight, ArrowDownLeft, AlertTriangle
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
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modalExcluir, setModalExcluir] = useState({ aberto: false, id: null });
  const [modalPagamento, setModalPagamento] = useState({ 
    aberto: false, item: null, parcelas: '1', banco: 'ITAU', forma: 'PIX', data: '' 
  });
  const [notificacao, setNotificacao] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER"];
  const categoriasGerais = ["COMBUSTIVEL", "MANUTENCAO", "PECAS", "SALARIOS", "ALIMENTACAO", "ALUGUEL", "IMPOSTOS", "SERVICOS", "VENDAS", "FINANCIAMENTO", "OUTROS"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO DEBITO", "CREDITO", "DINHEIRO"];

  // Inicialização do estado do formulário
  const [novoItem, setNovoItem] = useState({
    descricao: '', valor: '', tipo: 'SAIDA', categoria: 'OUTROS', tipoConta: 'PJ', data: new Date().toISOString().split('T')[0]
  });

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setTransacoes(Array.isArray(data) ? data : []);
    } catch (error) { 
      exibirNotificacao("Erro ao carregar dados", "erro"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { carregarDados(); }, []);

  const exibirNotificacao = (msg, tipo = 'sucesso') => {
    setNotificacao({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setNotificacao({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3000);
  };

  // Lógica para Salvar ou Editar
  const handleSalvar = async (e) => {
    e.preventDefault();
    setIsSalvando(true);
    const url = modoEdicao ? `/api/lancamentos/${novoItem.id}` : '/api/lancamentos';
    const method = modoEdicao ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoItem)
      });
      if (res.ok) {
        await carregarDados();
        fecharModal();
        exibirNotificacao(modoEdicao ? "Registro atualizado!" : "Título agendado!");
      }
    } catch (error) { 
      exibirNotificacao("Erro ao processar requisição", "erro"); 
    } finally { 
      setIsSalvando(false); 
    }
  };

  // Lógica para Excluir
  const handleExcluir = async () => {
    setProcessandoId(modalExcluir.id);
    try {
      const res = await fetch(`/api/lancamentos/${modalExcluir.id}`, { method: 'DELETE' });
      if (res.ok) {
        await carregarDados();
        setModalExcluir({ aberto: false, id: null });
        exibirNotificacao("Registro removido!", "sucesso");
      }
    } catch (error) { 
      exibirNotificacao("Erro ao excluir", "erro"); 
    } finally { 
      setProcessandoId(null); 
    }
  };

  // Lógica para Baixa Financeira (Liquidação)
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
        exibirNotificacao("Baixa efetuada com sucesso!");
      }
    } catch (error) { 
      exibirNotificacao("Erro na liquidação", "erro"); 
    } finally { 
      setProcessandoId(null); 
    }
  };

  const abrirEdicao = (item) => {
    setNovoItem({ 
      ...item, 
      valor: item.valor.toString(), 
      data: item.data.split('T')[0] 
    });
    setModoEdicao(true);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setModoEdicao(false);
    setNovoItem({ 
      descricao: '', valor: '', tipo: 'SAIDA', categoria: 'OUTROS', tipoConta: 'PJ', 
      data: new Date().toISOString().split('T')[0] 
    });
  };

  const transacoesFiltradas = useMemo(() => transacoes.filter(t => t.descricao?.toLowerCase().includes(busca.toLowerCase())), [transacoes, busca]);
  const itensDaPagina = useMemo(() => transacoesFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina), [transacoesFiltradas, paginaAtual]);

  return (
    <div className="relative space-y-6 max-w-[1600px] mx-auto p-4 pb-20 font-sans">
      
      {/* NOTIFICAÇÃO */}
      {notificacao.visivel && (
        <div className={`fixed top-5 right-5 z-[120] px-6 py-4 rounded-2xl shadow-2xl border font-black uppercase text-[10px] tracking-widest animate-in fade-in slide-in-from-right-5 ${notificacao.tipo === 'sucesso' ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-rose-900 border-rose-400 text-white'}`}>
          {notificacao.mensagem}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-3xl text-blue-600 shadow-blue-50/50"><Wallet size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Pillar Finance</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase mt-1 tracking-[0.2em]">Controle de Fluxo Operacional</p>
          </div>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input type="text" placeholder="Buscar registros..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" />
          </div>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-3 bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-xl active:scale-95"><Plus size={18} /> Novo Registro</button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="p-8">Vencimento</th>
                <th className="p-8">Descrição / Categoria</th>
                <th className="p-8 text-center">Tipo</th>
                <th className="p-8 text-center">Ações de Gestão</th>
                <th className="p-8 text-right">Valor Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itensDaPagina.length === 0 && !isLoading ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Nenhum lançamento registrado</td></tr>
              ) : itensDaPagina.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/40 transition-all ${item.tipo === 'ENTRADA' ? 'bg-emerald-50/10' : 'bg-rose-50/10'}`}>
                  <td className="p-8 text-sm font-bold text-slate-500">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                  <td className="p-8">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-slate-800 uppercase text-sm tracking-tight">{item.descricao}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md w-fit flex items-center gap-1"><Tag size={10}/> {item.categoria}</span>
                    </div>
                  </td>
                  <td className="p-8 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 justify-center w-fit mx-auto ${item.tipoConta === 'PJ' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                      {item.tipoConta === 'PJ' ? <Building2 size={12}/> : <User size={12}/>} {item.tipoConta}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center justify-center gap-3">
                      {item.status !== 'PAGO' ? (
                        <>
                          <button onClick={() => abrirEdicao(item)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm"><Edit3 size={18}/></button>
                          <button onClick={() => setModalExcluir({ aberto: true, id: item.id })} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm"><Trash2 size={18}/></button>
                          <button 
                            onClick={() => setModalPagamento({ aberto: true, item, data: new Date().toISOString().split('T')[0], banco: 'ITAU', forma: 'PIX', parcelas: '1' })} 
                            className="ml-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                          >Baixa</button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 animate-in fade-in">
                          <CheckCircle2 size={14}/> Liquidado
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`p-8 text-right font-black text-base tracking-tighter ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.tipo === 'ENTRADA' ? '+ ' : '- '}
                    {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SALVAR / EDITAR (Lógica de 1 Estágio) */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{modoEdicao ? 'Editar Registro' : 'Novo Agendamento'}</h3>
              <button onClick={fecharModal} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={24}/></button>
            </div>
            <form onSubmit={handleSalvar} className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Descrição</label>
                <input type="text" required placeholder="Ex: Pagamento Fornecedor" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all" value={novoItem.descricao} onChange={e => setNovoItem({...novoItem, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Valor (R$)</label>
                  <input type="number" step="0.01" required placeholder="0,00" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black outline-none focus:ring-4 focus:ring-blue-50" value={novoItem.valor} onChange={e => setNovoItem({...novoItem, valor: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Vencimento</label>
                  <input type="date" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-blue-50" value={novoItem.data} onChange={e => setNovoItem({...novoItem, data: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipo: 'ENTRADA'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'ENTRADA' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>RECEITA</button>
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipo: 'SAIDA'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipo === 'SAIDA' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>DESPESA</button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipoConta: 'PF'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipoConta === 'PF' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>PF</button>
                  <button type="button" onClick={() => setNovoItem({...novoItem, tipoConta: 'PJ'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${novoItem.tipoConta === 'PJ' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>PJ</button>
                </div>
              </div>
              <button type="submit" disabled={isSalvando} className="w-full bg-slate-900 text-white p-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                {isSalvando ? <Loader2 className="animate-spin mx-auto"/> : modoEdicao ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR */}
      {modalExcluir.aberto && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 text-center shadow-2xl border border-slate-100">
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce"><AlertTriangle size={48}/></div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Excluir Título?</h3>
            <p className="text-slate-400 text-[10px] font-black mb-8 uppercase tracking-widest">Essa ação é irreversível e removerá os dados do servidor.</p>
            <div className="flex gap-4">
              <button onClick={() => setModalExcluir({ aberto: false, id: null })} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600">Voltar</button>
              <button onClick={handleExcluir} className="flex-1 bg-rose-600 text-white py-4 rounded-[1.2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BAIXA (Liquidação 120x) */}
      {modalPagamento.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in zoom-in-95">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-8 bg-emerald-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><DollarSign size={24}/> Baixa Financeira</h3>
              <button onClick={() => setModalPagamento({ aberto: false })}><X size={24} /></button>
            </div>
            <form onSubmit={handleEfetivarBaixa} className="p-10 space-y-6">
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total para liquidação</p>
                  <p className="text-lg font-black text-slate-800 uppercase leading-tight">{modalPagamento.item?.descricao}</p>
                  <p className="text-2xl font-black text-emerald-600 mt-2 tracking-tighter">R$ {Number(modalPagamento.item?.valor).toLocaleString('pt-BR')}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Data Pagto</label>
                    <input type="date" required value={modalPagamento.data} onChange={e => setModalPagamento({...modalPagamento, data: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Parcelas</label>
                    <select value={modalPagamento.parcelas} onChange={e => setModalPagamento({...modalPagamento, parcelas: e.target.value})} className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl font-black text-blue-700 outline-none">
                      <option value="1">À VISTA</option>
                      {Array.from({ length: 119 }, (_, i) => i + 2).map(n => <option key={n} value={n}>{n}x</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Banco Origem</label>
                    <select value={modalPagamento.banco} onChange={e => setModalPagamento({...modalPagamento, banco: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">
                      {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest ml-1">Meio de Pagto</label>
                    <select value={modalPagamento.forma} onChange={e => setModalPagamento({...modalPagamento, forma: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">
                      {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
               </div>
               <button type="submit" disabled={processandoId} className="w-full bg-emerald-600 text-white p-6 rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50">
                  {processandoId ? <Loader2 className="animate-spin mx-auto"/> : "Confirmar Liquidação"}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}