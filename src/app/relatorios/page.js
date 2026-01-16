'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Loader2, Calendar, Search, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

  const [filtros, setFiltros] = useState({
    dataInicio: '', 
    dataFim: '',
    tipo: 'TODOS',
    status: 'TODOS',
    categoria: 'TODAS',
    busca: ''
  });

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

  // --- LÓGICA DE FILTRO REFORÇADA (STRING PURA) ---
  const filtrados = useMemo(() => {
    return transacoes.filter(t => {
      // Extrai apenas a string YYYY-MM-DD (ex: "2026-01-16")
      const dataItemStr = t.data.split('T')[0];

      const matchesDataInicio = !filtros.dataInicio || dataItemStr >= filtros.dataInicio;
      const matchesDataFim = !filtros.dataFim || dataItemStr <= filtros.dataFim;
      const matchesTipo = filtros.tipo === 'TODOS' || t.tipo === filtros.tipo;
      const matchesStatus = filtros.status === 'TODOS' || t.status === filtros.status;
      const matchesCategoria = filtros.categoria === 'TODAS' || t.categoria === filtros.categoria;
      const matchesBusca = !filtros.busca || t.descricao.toLowerCase().includes(filtros.busca.toLowerCase());

      return matchesDataInicio && matchesDataFim && matchesTipo && matchesStatus && matchesCategoria && matchesBusca;
    });
  }, [transacoes, filtros]);

  // FORMATAÇÃO DE EXIBIÇÃO (DATA REAL DO BANCO SEM FUSO)
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
      Tipo: item.tipo,
      Status: item.status,
      Valor: Number(item.valor)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Financeiro");
    XLSX.writeFile(workbook, `Relatorio_Pillar_IT.xlsx`);
  };

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const totalEntrada = filtrados.filter(t => t.tipo === 'ENTRADA').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalSaida = filtrados.filter(t => t.tipo === 'SAIDA').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldoPeriodo = totalEntrada - totalSaida;

  if (isLoading) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-20 text-slate-400 gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={40} />
      <p className="font-black uppercase text-[10px] tracking-[0.2em]">Gerando Relatório Analítico...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Relatórios Analíticos</h1>
            <p className="text-slate-500 text-sm font-medium">Auditoria e conferência de dados.</p>
          </div>
        </div>
        
        <button 
          onClick={gerarExcel}
          className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-xl"
        >
          <Download size={16} /> Baixar Planilha
        </button>
      </div>

      {/* FILTROS AVANÇADOS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 relative">
             <Search className="absolute left-3 top-3 text-slate-400" size={18} />
             <input 
              type="text" 
              placeholder="Buscar por descrição..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
              value={filtros.busca}
              onChange={e => setFiltros({...filtros, busca: e.target.value})}
             />
          </div>
          <div className="md:col-span-2">
            <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none" value={filtros.dataInicio} onChange={e => setFiltros({...filtros, dataInicio: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <input type="date" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none" value={filtros.dataFim} onChange={e => setFiltros({...filtros, dataFim: e.target.value})} />
          </div>
          <div className="md:col-span-2">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-600 outline-none" value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})}>
              <option value="TODOS">TODOS OS FLUXOS</option>
              <option value="ENTRADA">RECEITAS</option>
              <option value="SAIDA">DESPESAS</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-600 outline-none" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
              <option value="TODOS">TODOS OS STATUS</option>
              <option value="PAGO">PAGO</option>
              <option value="PENDENTE">PENDENTE</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">Nenhum registro para os critérios selecionados.</td></tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="p-5 text-xs text-slate-500 font-black">
                      {formatarDataExibicao(item.data)}
                    </td>
                    <td className="p-5 font-bold text-slate-800 uppercase tracking-tight text-xs">{item.descricao}</td>
                    <td className="p-5">
                      <span className="bg-white border border-slate-200 text-slate-400 px-2 py-1 rounded-lg text-[9px] font-black uppercase">{item.categoria}</span>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${item.status === 'PAGO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{item.status}</span>
                    </td>
                    <td className={`p-5 text-right font-black text-sm ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {item.tipo === 'SAIDA' ? '- ' : '+ '}{formatMoney(Number(item.valor))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* SUMÁRIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Receitas</p>
          <p className="text-2xl font-black text-emerald-600">{formatMoney(totalEntrada)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Despesas</p>
          <p className="text-2xl font-black text-rose-600">{formatMoney(totalSaida)}</p>
        </div>
        <div className={`p-6 rounded-3xl shadow-2xl flex flex-col items-center text-white transition-all ${saldoPeriodo >= 0 ? 'bg-slate-900' : 'bg-rose-900'}`}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-400">Saldo Líquido</p>
          <p className="text-3xl font-black">{formatMoney(saldoPeriodo)}</p>
        </div>
      </div>
    </div>
  );
}