'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, Loader2, Calendar, Search, 
  Filter, ArrowUpCircle, ArrowDownCircle, RotateCcw,
  Banknote, CreditCard, Landmark, Tag, User
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

  const initialState = {
    dataInicio: '', 
    dataFim: '',
    tipo: 'TODOS',
    status: 'TODOS',
    categoria: 'TODAS',
    banco: 'TODOS',
    tipoConta: 'TODOS',
    formaPagamento: 'TODOS',
    busca: ''
  };

  const [filtros, setFiltros] = useState(initialState);

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER", "NUBANK", "INTER"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO DEBITO", "CREDITO", "DINHEIRO", "TRANSFERENCIA"];

  useEffect(() => {
    async function carregarDados() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransacoes(data);
          const cats = [...new Set(data.map(item => item.categoria))].sort();
          setCategoriasDisponiveis(cats);
        }
      } catch (error) {
        console.error("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    }
    carregarDados();
  }, []);

  const filtrados = useMemo(() => {
    return transacoes.filter(t => {
      const dataOriginal = new Date(t.data);
      const dataLocal = new Date(dataOriginal.getTime() + dataOriginal.getTimezoneOffset() * 60000);
      const dataItemStr = dataLocal.toISOString().split('T')[0];

      const matchesDataInicio = !filtros.dataInicio || dataItemStr >= filtros.dataInicio;
      const matchesDataFim = !filtros.dataFim || dataItemStr <= filtros.dataFim;
      const matchesTipo = filtros.tipo === 'TODOS' || t.tipo === filtros.tipo;
      const matchesStatus = filtros.status === 'TODOS' || t.status === filtros.status;
      const matchesCategoria = filtros.categoria === 'TODAS' || t.categoria === filtros.categoria;
      const matchesBanco = filtros.banco === 'TODOS' || t.banco === filtros.banco;
      const matchesTipoConta = filtros.tipoConta === 'TODOS' || t.tipoConta === filtros.tipoConta;
      const matchesFormaPagamento = filtros.formaPagamento === 'TODOS' || t.formaPagamento === filtros.formaPagamento;
      const matchesBusca = !filtros.busca || t.descricao.toLowerCase().includes(filtros.busca.toLowerCase());

      return matchesDataInicio && matchesDataFim && matchesTipo && matchesStatus && 
             matchesCategoria && matchesBanco && matchesTipoConta && 
             matchesFormaPagamento && matchesBusca;
    }).sort((a, b) => new Date(a.data) - new Date(b.data));
  }, [transacoes, filtros]);

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return "";
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const gerarExcel = () => {
    const dadosParaExcel = filtrados.map(item => ({
      Data: formatarDataExibicao(item.data),
      Descrição: item.descricao.toUpperCase(),
      Categoria: item.categoria,
      Banco: item.banco || '---',
      Conta: item.tipoConta || '---',
      Pagamento: item.formaPagamento || '---',
      Tipo: item.tipo === 'ENTRADA' ? 'RECEITA' : 'DESPESA',
      Status: item.status,
      Valor: Number(item.valor)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    const dataRef = filtros.dataInicio ? `${filtros.dataInicio}_a_${filtros.dataFim || 'hoje'}` : 'Geral';
    XLSX.writeFile(workbook, `Relatorio_Pillar_${dataRef}.xlsx`);
  };

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  // --- LÓGICA DE CÁLCULOS ANALÍTICOS ---
  const totalReceitasRealizado = filtrados.filter(t => t.tipo === 'ENTRADA' && t.status === 'PAGO').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalDespesasRealizado = filtrados.filter(t => t.tipo === 'SAIDA' && t.status === 'PAGO').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalReceitasFuturo = filtrados.filter(t => t.tipo === 'ENTRADA' && t.status !== 'PAGO').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalDespesasFuturo = filtrados.filter(t => t.tipo === 'SAIDA' && t.status !== 'PAGO').reduce((acc, curr) => acc + Number(curr.valor), 0);
  
  const saldoRealizado = totalReceitasRealizado - totalDespesasRealizado;
  const saldoProjetado = totalReceitasFuturo - totalDespesasFuturo;

  if (isLoading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-10 bg-slate-50 gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={48} />
      <p className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-400">Gerando Relatório...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-100/50">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Relatórios Analíticos</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 tracking-widest">Auditoria de fluxo de caixa - Montranel</p>
          </div>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <button onClick={() => setFiltros(initialState)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
            <RotateCcw size={16} /> Limpar
          </button>
          <button onClick={gerarExcel} className="flex-1 lg:flex-none bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 transition-all shadow-xl">
            <Download size={16} /> Exportar XLSX
          </button>
        </div>
      </div>

      {/* PAINEL DE FILTROS */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
          <Filter size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Parametrização de Busca</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="BUSCAR POR DESCRIÇÃO..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all uppercase" value={filtros.busca} onChange={e => setFiltros({...filtros, busca: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 block">Início</label>
            <input type="date" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none" value={filtros.dataInicio} onChange={e => setFiltros({...filtros, dataInicio: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 block">Fim</label>
            <input type="date" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none" value={filtros.dataFim} onChange={e => setFiltros({...filtros, dataFim: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 block">Fluxo</label>
            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none" value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})}>
              <option value="TODOS">TODOS</option>
              <option value="ENTRADA">RECEITAS</option>
              <option value="SAIDA">DESPESAS</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 block">Status</label>
            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
              <option value="TODOS">TODOS</option>
              <option value="PAGO">PAGO</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="EM ABERTO">EM ABERTO</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col"><label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 flex items-center gap-1"><Tag size={10}/> Categoria</label>
            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none" value={filtros.categoria} onChange={e => setFiltros({...filtros, categoria: e.target.value})}>
              <option value="TODAS">TODAS AS CATEGORIAS</option>
              {categoriasDisponiveis.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex flex-col"><label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 flex items-center gap-1"><Landmark size={10}/> Banco</label>
            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none" value={filtros.banco} onChange={e => setFiltros({...filtros, banco: e.target.value})}>
              <option value="TODOS">TODOS OS BANCOS</option>
              {bancos.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="flex flex-col"><label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 flex items-center gap-1"><User size={10}/> Tipo de Conta</label>
            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none" value={filtros.tipoConta} onChange={e => setFiltros({...filtros, tipoConta: e.target.value})}>
              <option value="TODOS">PJ & PF</option>
              <option value="PJ">PESSOA JURÍDICA</option>
              <option value="PF">PESSOA FÍSICA</option>
            </select>
          </div>
          <div className="flex flex-col"><label className="text-[8px] font-black text-slate-400 uppercase mb-1 ml-1 flex items-center gap-1"><CreditCard size={10}/> Meio de Pagamento</label>
            <select className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none" value={filtros.formaPagamento} onChange={e => setFiltros({...filtros, formaPagamento: e.target.value})}>
              <option value="TODOS">TODOS OS MEIOS</option>
              {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE RESULTADOS */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                <th className="p-6 text-center">Data</th>
                <th className="p-6">Descrição Detalhada</th>
                <th className="p-6">Banco / Composição</th>
                <th className="p-6 text-center">Status</th>
                <th className="p-8 text-right">Valor Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan="5" className="p-24 text-center text-slate-300 font-black uppercase text-[11px] tracking-[0.3em]">Nenhum registro encontrado.</td></tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="p-6 text-center text-[11px] text-slate-600 font-black">{formatarDataExibicao(item.data)}</td>
                    <td className="p-6">
                      <div className="font-black text-slate-800 uppercase tracking-tight text-xs group-hover:text-emerald-600 transition-colors">{item.descricao}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{item.categoria}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-[10px] font-black text-slate-700 uppercase">{item.banco || '---'}</div>
                      <div className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{item.tipoConta} • {item.formaPagamento}</div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${
                        item.status === 'PAGO' ? 'bg-emerald-600 text-white border-emerald-500' : 
                        item.status === 'EM ABERTO' ? 'bg-blue-600 text-white border-blue-500' : 'bg-amber-500 text-white border-amber-400'
                      }`}>{item.status}</span>
                    </td>
                    <td className={`p-8 text-right font-black text-base ${item.tipo === 'ENTRADA' ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {item.tipo === 'SAIDA' ? '- ' : '+ '}{formatMoney(Number(item.valor))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* SUMÁRIO ANALÍTICO E PROJETADO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD RECEITAS (REALIZADO + FUTURO) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
            Receitas <span className="text-emerald-500 italic">Realizado</span>
          </p>
          <div className="space-y-1">
            <p className="text-xl font-black text-emerald-600 leading-none">{formatMoney(totalReceitasRealizado)}</p>
            <p className="text-[10px] font-bold text-slate-400 italic">A entrar (futuras): {formatMoney(totalReceitasFuturo)}</p>
          </div>
        </div>

        {/* CARD DESPESAS (REALIZADO + FUTURO) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
            Despesas <span className="text-rose-500 italic">Realizado</span>
          </p>
          <div className="space-y-1">
            <p className="text-xl font-black text-rose-600 leading-none">{formatMoney(totalDespesasRealizado)}</p>
            <p className="text-[10px] font-bold text-slate-400 italic">A pagar (futuras): {formatMoney(totalDespesasFuturo)}</p>
          </div>
        </div>

        {/* CARD BALANÇO ATUAL (CAIXA REAL) */}
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Saldo em Caixa (Realizado)</p>
          <p className={`text-2xl font-black ${saldoRealizado >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatMoney(saldoRealizado)}
          </p>
          <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full ${saldoRealizado >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-[8px] font-black uppercase text-slate-400">Total Liquidado</span>
          </div>
        </div>

        {/* CARD BALANÇO DAS FUTURAS (PROJETADO) */}
        <div className={`p-6 rounded-[2rem] shadow-2xl text-white transition-all ${saldoProjetado >= 0 ? 'bg-blue-900' : 'bg-orange-900'}`}>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3 italic">Balanço das Futuras</p>
          <p className="text-2xl font-black">{formatMoney(saldoProjetado)}</p>
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Expectativa de fluxo pendente</span>
          </div>
        </div>

      </div>
    </div>
  );
}