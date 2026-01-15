'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);

  const [filtros, setFiltros] = useState({
    // Removi a data automática do mês para garantir que você veja os dados que já existem
    dataInicio: '', 
    dataFim: '',
    tipo: 'TODOS',
    status: 'TODOS',
    categoria: 'TODAS'
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        // O t=Date.now() impede o navegador de te mostrar dados velhos em cache
        const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTransacoes(data);
          setFiltrados(data);
          const cats = [...new Set(data.map(item => item.categoria))].sort();
          setCategoriasDisponiveis(cats);
        }
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setIsLoading(false);
      }
    }
    carregarDados();
  }, []);

  useEffect(() => {
    let dados = [...transacoes];

    // LÓGICA DE FILTRO REFORÇADA: Converte para string YYYY-MM-DD antes de comparar
    if (filtros.dataInicio) {
      dados = dados.filter(t => {
        const dataFormatada = new Date(t.data).toISOString().split('T')[0];
        return dataFormatada >= filtros.dataInicio;
      });
    }
    if (filtros.dataFim) {
      dados = dados.filter(t => {
        const dataFormatada = new Date(t.data).toISOString().split('T')[0];
        return dataFormatada <= filtros.dataFim;
      });
    }
    
    if (filtros.tipo !== 'TODOS') dados = dados.filter(t => t.tipo === filtros.tipo);
    if (filtros.status !== 'TODOS') dados = dados.filter(t => t.status === filtros.status);
    if (filtros.categoria !== 'TODAS') dados = dados.filter(t => t.categoria === filtros.categoria);

    setFiltrados(dados);
  }, [filtros, transacoes]);

  const gerarExcel = () => {
    const dadosParaExcel = filtrados.map(item => ({
      Data: new Date(item.data).toLocaleDateString('pt-BR'),
      Descrição: item.descricao,
      Categoria: item.categoria,
      Tipo: item.tipo,
      Status: item.status,
      Valor: Number(item.valor)
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosParaExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Financeiro");
    XLSX.writeFile(workbook, `Relatorio_Montranel.xlsx`);
  };

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const totalEntrada = filtrados.filter(t => t.tipo === 'ENTRADA').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalSaida = filtrados.filter(t => t.tipo === 'SAIDA').reduce((acc, curr) => acc + Number(curr.valor), 0);
  const saldoPeriodo = totalEntrada - totalSaida;

  return (
    <div className="space-y-6 fade-in h-full flex flex-col pb-10">
      
      {/* --- CABEÇALHO PADRONIZADO --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileSpreadsheet size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Relatórios Analíticos
            </h1>
            <p className="text-slate-500 text-sm">
              Filtre dados históricos e exporte para Excel.
            </p>
          </div>
        </div>
        
        <button 
          onClick={gerarExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
        >
          <Download size={20} /> Baixar Planilha
        </button>
      </div>

      {/* --- BARRA DE FILTROS --- */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">De:</label>
            <input type="date" className="w-full p-2 bg-slate-50 border rounded-lg text-sm" value={filtros.dataInicio} onChange={e => setFiltros({...filtros, dataInicio: e.target.value})} />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Até:</label>
            <input type="date" className="w-full p-2 bg-slate-50 border rounded-lg text-sm" value={filtros.dataFim} onChange={e => setFiltros({...filtros, dataFim: e.target.value})} />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
            <select className="w-full p-2 bg-slate-50 border rounded-lg text-sm" value={filtros.tipo} onChange={e => setFiltros({...filtros, tipo: e.target.value})}>
              <option value="TODOS">Todos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
            <select className="w-full p-2 bg-slate-50 border rounded-lg text-sm" value={filtros.categoria} onChange={e => setFiltros({...filtros, categoria: e.target.value})}>
              <option value="TODAS">Todas</option>
              {categoriasDisponiveis.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
           <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
            <select className="w-full p-2 bg-slate-50 border rounded-lg text-sm" value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
              <option value="TODOS">Todos</option>
              <option value="PAGO">Pago</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- TABELA DE DADOS --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" />
            <span>Sincronizando com o banco...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-bold sticky top-0">
                <tr>
                  <th className="p-4 border-b">Data</th>
                  <th className="p-4 border-b">Descrição</th>
                  <th className="p-4 border-b">Categoria</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtrados.length === 0 ? (
                  <tr><td colSpan="5" className="p-20 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td></tr>
                ) : (
                  filtrados.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 font-mono">
                        {new Date(item.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{item.descricao}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={`p-3 text-right font-bold font-mono ${item.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.tipo === 'SAIDA' ? '-' : '+'} {formatMoney(Number(item.valor))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtrados.length > 0 && (
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-700">
                  <tr>
                    <td colSpan="4" className="p-4 text-right uppercase text-xs tracking-wider">Total Selecionado:</td>
                    <td className={`p-4 text-right text-base ${saldoPeriodo >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                      {formatMoney(saldoPeriodo)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
      
      {/* RESUMO RÁPIDO NO RODAPÉ */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-700">Entradas: {formatMoney(totalEntrada)}</div>
        <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-rose-700">Saídas: {formatMoney(totalSaida)}</div>
        <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 text-slate-700">Registros: {filtrados.length}</div>
      </div>
    </div>
  );
}