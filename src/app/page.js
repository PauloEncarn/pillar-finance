'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, 
  TrendingUp, AlertTriangle, Clock, BellRing, User, CheckCircle, 
  Landmark, UserCheck, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Home() {
  const [user, setUser] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);

  const CORES_DIVERSAS = ['#0f172a', '#0284c7', '#059669', '#d97706', '#7c3aed'];
  const CORES_TIPO = ['#6366f1', '#ec4899']; // Indigo para PJ, Rosa para PF

  useEffect(() => {
    const userSalvo = localStorage.getItem('pillar-user');
    if (userSalvo) {
      setUser(JSON.parse(userSalvo));
    } else {
      setUser({ name: 'Visitante', avatarUrl: null });
    }
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoadingDados(true);
      const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) setTransacoes(data);
    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setLoadingDados(false);
    }
  }

  const estatisticas = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return null;

    let geral = { entrada: 0, saida: 0, saldo: 0 };
    let previsao = { entrada: 0, saida: 0 };
    const saldosPorBanco = { CAIXA: 0, ITAU: 0, BRADESCO: 0, SANTANDER: 0 };
    const volumePorTipo = { PJ: 0, PF: 0 };
    const fluxoPorMes = {};
    const despesasPorCategoria = {};
    const contasAlertas = [];

    const agora = new Date();
    const hojeComparacao = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const dataLimiteAlerta = new Date(hojeComparacao);
    dataLimiteAlerta.setDate(hojeComparacao.getDate() + 15);

    transacoes.forEach(t => {
      const valor = Number(t.valor);
      
      // TRATAMENTO DE DATA SEGURO (YYYY-MM-DD) para evitar erro de fuso horário
      const apenasData = t.data.split('T')[0];
      const [ano, mes, dia] = apenasData.split('-').map(Number);
      const dataObjeto = new Date(ano, mes - 1, dia);

      if (isNaN(dataObjeto.getTime())) return;

      if (t.status === 'PAGO') {
        if (t.tipo === 'ENTRADA') {
          geral.entrada += valor;
          if (t.banco) saldosPorBanco[t.banco] = (saldosPorBanco[t.banco] || 0) + valor;
        } else {
          geral.saida += valor;
          if (t.banco) saldosPorBanco[t.banco] = (saldosPorBanco[t.banco] || 0) - valor;
        }

        if (t.tipoConta) volumePorTipo[t.tipoConta] += valor;

        const mesAno = dataObjeto.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        if (!fluxoPorMes[mesAno]) fluxoPorMes[mesAno] = { name: mesAno, Entradas: 0, Saídas: 0 };
        if (t.tipo === 'ENTRADA') fluxoPorMes[mesAno].Entradas += valor;
        else {
          fluxoPorMes[mesAno].Saídas += valor;
          despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + valor;
        }
      } else {
        // PREVISÕES (PENDENTE OU EM ABERTO)
        if (t.tipo === 'ENTRADA') previsao.entrada += valor;
        else previsao.saida += valor;

        // ALERTAS (Tudo que não está pago e vence em breve)
        if (dataObjeto <= dataLimiteAlerta) {
          const diff = dataObjeto.getTime() - hojeComparacao.getTime();
          const dias = Math.round(diff / (1000 * 60 * 60 * 24));
          contasAlertas.push({ 
            ...t, 
            diasRestantes: dias,
            dataExibicao: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`
          });
        }
      }
    });

    geral.saldo = geral.entrada - geral.saida;

    return {
      geral, previsao, saldosPorBanco,
      graficoTipo: Object.entries(volumePorTipo).map(([name, value]) => ({ name, value })),
      alertas: contasAlertas.sort((a,b) => a.diasRestantes - b.diasRestantes),
      graficoBarra: Object.values(fluxoPorMes).slice(-6),
      graficoPizzaDespesa: Object.entries(despesasPorCategoria).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,5)
    };
  }, [transacoes]);

  const handleMarcarComoPago = async (id) => {
    try {
      const res = await fetch(`/api/lancamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAGO' })
      });
      if (res.ok) carregarDados();
    } catch (error) { console.error(error); }
  };

  const formatMoney = (val) => val?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || "R$ 0,00";

  if (!user || loadingDados) return <DashboardSkeleton />;

  return (
    <div className="space-y-8 fade-in pb-10">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 p-0.5 shadow-sm overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="Perfil" fill className="rounded-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><User size={32} /></div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Olá, {user.name.split(' ')[0]}!</h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-widest text-[10px]">Gestão Pillar Finance Ativa</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 shadow-lg">
          <Calendar size={18} className="text-blue-400" /> 
          <span className="capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* 1. ALERTAS (PRIORIDADE MÁXIMA) */}
      {estatisticas?.alertas.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl shadow-lg border-l-8 border-rose-500 bg-white p-6">
          <h3 className="text-rose-600 font-black text-lg uppercase tracking-wider flex items-center gap-2 mb-4">
            <BellRing size={24} className="animate-pulse" /> Atenção: {estatisticas.alertas.length} Contas Pendentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estatisticas.alertas.map((conta) => (
              <div key={conta.id} className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex justify-between items-center transition-all hover:bg-rose-100">
                <div className="min-w-0 flex-1">
                  <p className="text-slate-800 font-bold text-sm truncate uppercase">{conta.descricao}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{conta.dataExibicao} • {formatMoney(Number(conta.valor))}</p>
                  <div className={`mt-1 inline-block text-[8px] font-black px-1.5 py-0.5 rounded ${conta.diasRestantes <= 0 ? 'bg-rose-600 text-white' : 'bg-orange-200 text-orange-800'}`}>
                    {conta.diasRestantes < 0 ? `ATRASADO ${Math.abs(conta.diasRestantes)}D` : conta.diasRestantes === 0 ? 'VENCE HOJE' : `FALTAM ${conta.diasRestantes} DIAS`}
                  </div>
                </div>
                <button onClick={() => handleMarcarComoPago(conta.id)} className="ml-3 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 p-2 rounded-lg transition-all shadow-sm active:scale-95">
                  <CheckCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. KPI CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Saldo em Caixa (Real)</p>
          <h3 className={`text-3xl font-black ${estatisticas?.geral.saldo >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>{formatMoney(estatisticas?.geral.saldo || 0)}</h3>
          <div className="absolute right-4 top-4 p-3 bg-slate-50 text-slate-400 rounded-full"><Wallet size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest mb-1">Receitas Confirmadas</p>
          <h3 className="text-3xl font-black text-emerald-600">{formatMoney(estatisticas?.geral.entrada || 0)}</h3>
          <div className="mt-2 text-[10px] text-emerald-600/70 font-bold">+ {formatMoney(estatisticas?.previsao.entrada)} previstos</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-rose-500/60 text-[10px] font-black uppercase tracking-widest mb-1">Despesas Confirmadas</p>
          <h3 className="text-3xl font-black text-rose-600">{formatMoney(estatisticas?.geral.saida || 0)}</h3>
          <div className="mt-2 text-[10px] text-rose-600/70 font-bold">- {formatMoney(estatisticas?.previsao.saida)} a pagar</div>
        </div>
      </div>

      {/* 3. SALDO POR BANCOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(estatisticas?.saldosPorBanco || {}).map(([banco, saldo]) => (
          <div key={banco} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Landmark size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{banco}</span>
            </div>
            <p className={`text-sm font-black ${saldo >= 0 ? 'text-slate-700' : 'text-rose-500'}`}>{formatMoney(saldo)}</p>
          </div>
        ))}
      </div>

      {/* 4. GRÁFICOS ANALÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-600" /> Fluxo de Caixa (6 Meses)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticas?.graficoBarra}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-8 flex items-center gap-2">
            <UserCheck size={18} className="text-indigo-600" /> Composição PJ / PF
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={estatisticas?.graficoTipo} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {estatisticas?.graficoTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES_TIPO[index % CORES_TIPO.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-6">
      <div className="h-24 bg-slate-100 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
        <div className="h-32 bg-slate-100 rounded-2xl"></div>
      </div>
      <div className="h-72 bg-slate-100 rounded-2xl w-full"></div>
    </div>
  );
}