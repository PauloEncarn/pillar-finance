'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Loader2, Calendar, Search, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

  // Adicionado novos estados de filtro
  const [filtros, setFiltros] = useState({
    dataInicio: '', 
    dataFim: '',
    tipo: 'TODOS',
    status: 'TODOS',
    categoria: 'TODAS',
    banco: 'TODOS',
    tipoConta: 'TODOS',
    formaPagamento: 'TODOS',
    busca: ''
  });

  const bancos = ["CAIXA", "ITAU", "BRADESCO", "SANTANDER"];
  const formasPagamento = ["PIX", "BOLETO", "TED", "CARTAO", "CREDITO"];

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
        // Erro silencioso
      } finally {
        setIsLoading(false);
      }
    }
    carregarDados();
  }, []);

  // LÓGICA DE FILTRO REFORÇADA COM NOVOS CAMPOS
  const filtrados = useMemo(() => {
    return transacoes.filter(t => {
      const dataItemStr = t.data.split('T')[0];

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
    });
  }, [transacoes, filtros]);

  const formatarDataExibicao = (dataString) => {
    if (!dataString) return "";
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const gerarExcel = () => {
    const dadosParaExcel = filtrados.map(item => ({
      Data: formatarDataExibicao(item.data),
      Descrição: item.descricao,
      Categoria: item.categoria,
      Banco: item.banco || 'N/A',
      Conta: item.tipoConta || 'N/A',
      Pagamento: item.formaPagamento || 'N/A',
      Tipo: item.tipo,
      Status: item.status,
      Valor: Number(item.valor)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    XLSX.writeFile(workbook, `Relatorio_Pillar_Finance.xlsx`);
  };

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const totalEntrada = filtrados.filter(t => t.tipo === 'ENTRADA').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalSaida = filtrados.filter(t => t.tipo === 'SAIDA').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldoPeriodo = totalEntrada - totalSaida;

  if (isLoading) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-10 md:p-20 text-slate-400 gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={40} />
      <p className="font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] text-center">Gerando Relatório Analítico...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 px-2 md:px-0">
      
      {/* HEADER RESPONSIVO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
           <FileSpreadsheet className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter uppercase">Relatórios</h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium">Auditoria e conferência.</p>
          </div>
        </div>
        
        <button 
          onClick={gerarExcel}
          className="w-full sm:w-auto bg-slate-900 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 transition-all shadow-xl"
        >
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      {/* FILTROS AVANÇADOS RESPONSIVOS */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={16} className="text-emerald-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros de Busca Avançados</span>
        </div>
        
        {/* Primeira linha de filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 md:gap-4">
          <div className="md:col-span-4 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Buscar descrição..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={filtros.busca}
              onChange={e => setFiltros({...filtros, busca: e.target.value})}
             />
          </div>
          <div className="md:col-span-2">
            <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-600 outline-none" value={filtros.dataInicio} onChange={e => setFiltros({...filtros, dataInicio: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-600 outline-none" value={filtros.dataFim} onChange={e => setFiltros({...filtros, dataFim: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none cursor-pointer" value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})}>
              <option value="TODOS">TODOS FLUXOS</option>
              <option value="ENTRADA">RECEITAS</option>
              <option value="SAIDA">DESPESAS</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none cursor-pointer" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
              <option value="TODOS">STATUS</option>
              <option value="PAGO">PAGO</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="EM ABERTO">EM ABERTO</option>
            </select>
          </div>
        </div>

        {/* Segunda linha de filtros (Novos atributos) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-12 gap-3 md:gap-4">
          <div className="md:col-span-4">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none cursor-pointer" value={filtros.categoria} onChange={e => setFiltros({...filtros, categoria: e.target.value})}>
              <option value="TODAS">TODAS CATEGORIAS</option>
              {categoriasDisponiveis.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none cursor-pointer" value={filtros.banco} onChange={e => setFiltros({...filtros, banco: e.target.value})}>
              <option value="TODOS">TODOS OS BANCOS</option>
              {bancos.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none cursor-pointer" value={filtros.tipoConta} onChange={e => setFiltros({...filtros, tipoConta: e.target.value})}>
              <option value="TODOS">PJ/PF</option>
              <option value="PJ">PESSOA JURÍDICA</option>
              <option value="PF">PESSOA FÍSICA</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 outline-none cursor-pointer" value={filtros.formaPagamento} onChange={e => setFiltros({...filtros, formaPagamento: e.target.value})}>
              <option value="TODOS">FORMA PAGAMENTO</option>
              {formasPagamento.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* TABELA / CARDS */}
      <div className="bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {/* VISÃO DESKTOP */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Banco/Conta</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhum registro encontrado.</td></tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-5 text-xs text-slate-500 font-black">{formatarDataExibicao(item.data)}</td>
                    <td className="p-5 font-bold text-slate-800 uppercase tracking-tight text-xs">
                      {item.descricao}
                      <div className="text-[9px] text-slate-400 font-medium">{item.categoria}</div>
                    </td>
                    <td className="p-5">
                      <div className="text-[10px] font-black text-slate-600 uppercase">{item.banco || '---'}</div>
                      <div className="text-[9px] text-slate-400 font-bold">{item.tipoConta || '---'} | {item.formaPagamento || '---'}</div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${
                        item.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600' : 
                        item.status === 'EM ABERTO' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                      }`}>{item.status}</span>
                    </td>
                    <td className={`p-5 text-right font-black text-sm ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {item.tipo === 'SAIDA' ? '- ' : '+ '}{formatMoney(Number(item.valor))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* VISÃO MOBILE (CARDS) */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
            {filtrados.length === 0 ? (
              <div className="p-10 text-center text-slate-300 text-xs font-bold uppercase">Nada encontrado.</div>
            ) : (
              filtrados.map((item) => (
                <div key={item.id} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400">{formatarDataExibicao(item.data)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                       item.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' : 
                       item.status === 'EM ABERTO' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>{item.status}</span>
                  </div>
                  <p className="font-black text-slate-800 text-xs uppercase truncate">{item.descricao}</p>
                  <div className="text-[9px] font-bold text-slate-400 uppercase italic">
                    {item.banco} | {item.formaPagamento}
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{item.categoria}</span>
                    <span className={`font-black text-sm ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.tipo === 'SAIDA' ? '- ' : '+ '}{formatMoney(Number(item.valor))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* SUMÁRIO RESPONSIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Receitas</p>
          <p className="text-xl md:text-2xl font-black text-emerald-600">{formatMoney(totalEntrada)}</p>
        </div>
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Despesas</p>
          <p className="text-xl md:text-2xl font-black text-rose-600">{formatMoney(totalSaida)}</p>
        </div>
        <div className={`p-5 md:p-6 rounded-2xl shadow-xl flex flex-col items-center text-white transition-all ${saldoPeriodo >= 0 ? 'bg-slate-900' : 'bg-rose-900'} sm:col-span-1`}>
          <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Saldo Líquido</p>
          <p className="text-2xl md:text-3xl font-black">{formatMoney(saldoPeriodo)}</p>
        </div>
      </div>
    </div>
  );
}