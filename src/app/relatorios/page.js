'use client';

import { useState, useEffect, useMemo } from 'react';
import { Download, Filter, FileSpreadsheet } from 'lucide-react';

export default function Relatorios() {
  const [transacoes, setTransacoes] = useState([]);
  const [isClient, setIsClient] = useState(false);
  
  // Filtros
  const [filtroMes, setFiltroMes] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');

  // Carregar dados
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsClient(true);
    const dadosSalvos = localStorage.getItem('pillar-finance-data');
    if (dadosSalvos) {
      setTransacoes(JSON.parse(dadosSalvos));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Extrair meses únicos existentes nos dados para montar o Select
  const mesesDisponiveis = useMemo(() => {
    const meses = transacoes.map(t => t.data.substring(0, 7)); // Pega "2026-01"
    return [...new Set(meses)].sort().reverse(); // Remove duplicados e ordena
  }, [transacoes]);

  // 2. Aplicar Filtros na Lista
  const dadosFiltrados = transacoes.filter(item => {
    const mesItem = item.data.substring(0, 7);
    const matchMes = filtroMes === 'TODOS' || mesItem === filtroMes;
    const matchTipo = filtroTipo === 'TODOS' || item.tipo === filtroTipo;
    return matchMes && matchTipo;
  });

  // 3. Função de Exportar CSV
  const handleExportarExcel = () => {
    if (dadosFiltrados.length === 0) {
      alert("Não há dados para exportar com os filtros atuais.");
      return;
    }

    // Cabeçalho do CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID;Data;Descrição;Categoria;Tipo;Valor;Status\n"; // Cabeçalho

    // Linhas
    dadosFiltrados.forEach(item => {
      const valorFormatado = item.valor.toString().replace('.', ',');
      const linha = `${item.id};${item.data};${item.descricao};${item.categoria};${item.tipo};${valorFormatado};${item.status}`;
      csvContent += linha + "\n";
    });

    // Criar link de download invisível
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const nomeArquivo = `Relatorio_${filtroMes}_${filtroTipo}.csv`;
    link.setAttribute("download", nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cálculos do preview
  const totalEntradas = dadosFiltrados.filter(t => t.tipo === 'ENTRADA').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = dadosFiltrados.filter(t => t.tipo === 'SAIDA').reduce((acc, t) => acc + t.valor, 0);
  const resultado = totalEntradas - totalSaidas;

  if (!isClient) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-slate-500">Exporte seus dados para análise</p>
        </div>
      </div>

      {/* Área de Filtros */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold">
          <Filter size={20} /> Filtros de Exportação
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Período (Mês)</label>
            <select 
              className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            >
              <option value="TODOS">Todo o Período</option>
              {mesesDisponiveis.map(mes => (
                <option key={mes} value={mes}>{mes}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Movimentação</label>
            <select 
              className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="TODOS">Entradas e Saídas</option>
              <option value="ENTRADA">Somente Entradas</option>
              <option value="SAIDA">Somente Saídas</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleExportarExcel}
              className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 flex justify-center items-center gap-2 h-[42px]"
            >
              <FileSpreadsheet size={20} /> Baixar Excel (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Preview dos Dados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Registros Encontrados</p>
          <p className="text-2xl font-bold text-slate-800">{dadosFiltrados.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Saldo neste Relatório</p>
          <p className={`text-2xl font-bold ${resultado >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {resultado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Lista Prévia */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-medium text-slate-600">
          Pré-visualização dos dados ({dadosFiltrados.length})
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {dadosFiltrados.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-600">{item.data}</td>
                  <td className="p-3 font-medium text-slate-800">{item.descricao}</td>
                  <td className="p-3 text-slate-500">{item.tipo}</td>
                  <td className="p-3 text-right font-bold">
                    {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}