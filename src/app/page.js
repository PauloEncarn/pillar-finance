'use client';

import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, Calendar } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState({ name: 'Visitante' });
  const [resumo, setResumo] = useState({
    entrada: 0,
    saida: 0,
    saldo: 0,
    pendente: 0
  });

  useEffect(() => {
    // 1. Pegar nome do usuário logado
    const userSalvo = localStorage.getItem('pillar-user');
    if (userSalvo) {
      setUser(JSON.parse(userSalvo));
    }

    // 2. Buscar lançamentos do Banco para calcular totais
    async function carregarDados() {
      try {
        const res = await fetch('/api/lancamentos');
        const lancamentos = await res.json();

        if (Array.isArray(lancamentos)) {
          // Calculando totais
          const entradas = lancamentos
            .filter(i => i.tipo === 'ENTRADA' && i.status === 'PAGO')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

          const saidas = lancamentos
            .filter(i => i.tipo === 'SAIDA' && i.status === 'PAGO')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

          const pendentes = lancamentos
            .filter(i => i.status === 'PENDENTE')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

          setResumo({
            entrada: entradas,
            saida: saidas,
            saldo: entradas - saidas,
            pendente: pendentes
          });
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      }
    }

    carregarDados();
  }, []);

  // Função auxiliar para formatar dinheiro
  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8 fade-in">
      {/* Cabeçalho */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Olá, {user.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Aqui está o resumo financeiro da M. Montranel.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data de Hoje</p>
          <p className="text-slate-800 font-bold flex items-center gap-2 justify-end">
            <Calendar size={16} className="text-blue-600" />
            {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Entradas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowUpCircle size={28} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">+ Receitas</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Entradas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(resumo.entrada)}</h3>
          </div>
        </div>

        {/* Card Saídas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ArrowDownCircle size={28} />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">- Despesas</span>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Saídas</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(resumo.saida)}</h3>
          </div>
        </div>

        {/* Card Saldo */}
        <div className={`p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between transition-all ${
          resumo.saldo >= 0 ? 'bg-slate-900' : 'bg-rose-600'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <Wallet size={28} />
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg">Caixa Atual</span>
          </div>
          <div>
            <p className="text-slate-300 text-sm font-medium">Saldo Líquido</p>
            <h3 className="text-3xl font-bold mt-1">{formatMoney(resumo.saldo)}</h3>
            {resumo.pendente > 0 && (
               <p className="text-xs text-orange-300 mt-2 font-bold">⚠️ {formatMoney(resumo.pendente)} pendente</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}