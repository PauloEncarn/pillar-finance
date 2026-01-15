'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, 
  TrendingUp, Activity, AlertTriangle, Clock, BellRing, User, CheckCircle 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function Home() {
  // Começa como null para forçar o Skeleton e não mostrar "Visitante" errado
  const [user, setUser] = useState(null);
  const [transacoes, setTransacoes] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);

  // Cores
  const CORES_DESPESA = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8'];
  const CORES_RECEITA = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  // 1. CARREGAR USUÁRIO E DADOS
  useEffect(() => {
    // Carrega User do LocalStorage
    const userSalvo = localStorage.getItem('pillar-user');
    if (userSalvo) {
      setUser(JSON.parse(userSalvo));
    } else {
      setUser({ name: 'Visitante', avatarUrl: null });
    }

    // Carrega Dados do Banco
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoadingDados(true);
      const res = await fetch(`/api/lancamentos?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransacoes(data);
      }
    } catch (error) {
      console.error("Erro dashboard:", error);
    } finally {
      setLoadingDados(false);
    }
  }

  // 2. PROCESSAMENTO OTIMIZADO (USEMEMO)
  // O React só vai recalcular isso se 'transacoes' mudar. O resto do tempo, ele puxa da memória.
const estatisticas = useMemo(() => {
    if (!transacoes || transacoes.length === 0) return null;

    // Inicializadores
    let geral = { entrada: 0, saida: 0, saldo: 0 };
    let hoje = { entrada: 0, saida: 0 };
    let semana = { entrada: 0, saida: 0 };
    const fluxoPorMes = {};
    const despesasPorCategoria = {};
    const receitasPorCategoria = {};
    const contasAlertas = [];

    // Referências de Tempo
    const agora = new Date();
    const hojeStr = agora.toISOString().split('T')[0];
    const dataLimiteAlerta = new Date();
    dataLimiteAlerta.setDate(agora.getDate() + 10);

    transacoes.forEach(t => {
      // --- CURA DA DATA ---
      // Tentamos converter o que vem do banco (string ou objeto) para Date real
      const dataObjeto = new Date(t.data);
      
      // Se a data for inválida, pulamos esse registro para não travar o sistema
      if (isNaN(dataObjeto.getTime())) return;

      const valor = Number(t.valor);
      const dataItemStr = dataObjeto.toISOString().split('T')[0];

      // KPIs e Gráficos (Apenas PAGO)
      if (t.status === 'PAGO') {
        if (t.tipo === 'ENTRADA') geral.entrada += valor;
        else geral.saida += valor;

        // Comparação de "Hoje"
        if (dataItemStr === hojeStr) {
          if (t.tipo === 'ENTRADA') hoje.entrada += valor;
          else hoje.saida += valor;
        }

        // Agrupamento para Gráfico de Barras
        const mesAno = dataObjeto.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        if (!fluxoPorMes[mesAno]) fluxoPorMes[mesAno] = { name: mesAno, Entradas: 0, Saídas: 0 };
        if (t.tipo === 'ENTRADA') fluxoPorMes[mesAno].Entradas += valor;
        else fluxoPorMes[mesAno].Saídas += valor;

        // Categorias
        if (t.tipo === 'SAIDA') despesasPorCategoria[t.categoria] = (despesasPorCategoria[t.categoria] || 0) + valor;
        if (t.tipo === 'ENTRADA') receitasPorCategoria[t.categoria] = (receitasPorCategoria[t.categoria] || 0) + valor;
      }

      // Alertas (SAIDA + PENDENTE)
      if (t.tipo === 'SAIDA' && t.status === 'PENDENTE') {
        if (dataObjeto >= new Date().setHours(0,0,0,0) && dataObjeto <= dataLimiteAlerta) {
          const diff = dataObjeto - new Date().setHours(0,0,0,0);
          const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
          contasAlertas.push({ ...t, diasRestantes: dias });
        }
      }
    });

    geral.saldo = geral.entrada - geral.saida;

    return {
      kpis: { geral, hoje, semana },
      alertas: contasAlertas,
      graficoBarra: Object.values(fluxoPorMes).slice(-6),
      graficoPizzaDespesa: Object.entries(despesasPorCategoria).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,5),
      graficoPizzaReceita: Object.entries(receitasPorCategoria).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0,5)
    };
  }, [transacoes]);

  // Ação de Pagar
  const handleMarcarComoPago = async (id) => {
    try {
      await fetch(`/api/lancamentos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAGO' })
      });
      carregarDados(); // Recarrega para atualizar gráficos
    } catch (error) {
      alert("Erro ao atualizar status.");
    }
  };

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 3. ESTADO DE CARREGAMENTO (SKELETON)
  // Evita o "Flash" de Visitante e layout quebrado
  if (!user || loadingDados) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 fade-in pb-10">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 p-0.5 shadow-sm overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt="Perfil" fill className="rounded-full object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <User size={32} />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              {getSaudacao()}, {user.name.split(' ')[0]}! 
            </h1>
            <p className="text-slate-500 text-sm">Resumo financeiro atualizado.</p>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 shadow-lg">
          <Calendar size={18} className="text-blue-400" /> 
          <span className="capitalize">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* ALERTAS */}
      {estatisticas.alertas.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl shadow-lg border-l-8 border-rose-500 bg-white p-6 animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-4 opacity-5"><AlertTriangle size={120} className="text-rose-600" /></div>
          <div className="relative z-10">
            <h3 className="text-rose-600 font-black text-lg uppercase tracking-wider flex items-center gap-2 mb-4">
              <BellRing className="animate-pulse" size={24} /> Atenção: {estatisticas.alertas.length} Contas Vencendo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {estatisticas.alertas.map((conta) => (
                <div key={conta.id} className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 flex justify-between items-center group hover:bg-rose-100 transition-colors shadow-sm">
                  <div>
                    <p className="text-slate-800 font-bold text-sm truncate max-w-[150px]" title={conta.descricao}>{conta.descricao}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                      <Clock size={12} /> Vence: {new Date(conta.data).toLocaleDateString('pt-BR').slice(0,5)}
                    </p>
                    <p className="text-rose-700 font-black text-lg mt-1">{formatMoney(Number(conta.valor))}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${conta.diasRestantes === 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-orange-200 text-orange-800'}`}>
                      {conta.diasRestantes === 0 ? 'HOJE' : `${conta.diasRestantes} dias`}
                    </span>
                    <button onClick={() => handleMarcarComoPago(conta.id)} className="flex items-center gap-1 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95" title="Marcar como Pago">
                      <CheckCircle size={14} /> Já Paguei
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Receita Acumulada</p>
          <h3 className="text-3xl font-bold text-slate-800">{formatMoney(estatisticas.kpis.geral.entrada)}</h3>
          <div className="absolute right-4 top-4 p-3 bg-emerald-50 text-emerald-600 rounded-full"><ArrowUpCircle size={24} /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Despesa Acumulada</p>
          <h3 className="text-3xl font-bold text-slate-800">{formatMoney(estatisticas.kpis.geral.saida)}</h3>
          <div className="absolute right-4 top-4 p-3 bg-rose-50 text-rose-600 rounded-full"><ArrowDownCircle size={24} /></div>
        </div>
        <div className={`p-6 rounded-2xl border shadow-md relative overflow-hidden text-white ${estatisticas.kpis.geral.saldo >= 0 ? 'bg-slate-900 border-slate-800' : 'bg-rose-900 border-rose-800'}`}>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Saldo em Caixa</p>
          <h3 className="text-4xl font-bold mt-1">{formatMoney(estatisticas.kpis.geral.saldo)}</h3>
          <div className="absolute right-4 top-4 p-3 bg-white/10 rounded-full"><Wallet size={24} /></div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6 flex items-center gap-2"><TrendingUp size={18} /> Balanço Mensal</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticas.graficoBarra}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `R$ ${value/1000}k`} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-6 flex items-center gap-2"><ArrowUpCircle size={18} /> Maiores Entradas</h3>
          <div className="h-64 w-full relative">
            {estatisticas.graficoPizzaReceita.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estatisticas.graficoPizzaReceita} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {estatisticas.graficoPizzaReceita.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES_RECEITA[index % CORES_RECEITA.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-slate-400 text-xs">Sem dados.</div>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wide mb-6 flex items-center gap-2"><ArrowDownCircle size={18} /> Maiores Despesas</h3>
          <div className="h-64 w-full relative">
            {estatisticas.graficoPizzaDespesa.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estatisticas.graficoPizzaDespesa} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {estatisticas.graficoPizzaDespesa.map((entry, index) => <Cell key={`cell-${index}`} fill={CORES_DESPESA[index % CORES_DESPESA.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{fontSize: '11px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="flex h-full items-center justify-center text-slate-400 text-xs">Sem dados.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. COMPONENTE VISUAL DE CARREGAMENTO (SKELETON)
function DashboardSkeleton() {
  return (
    <div className="space-y-8 fade-in h-screen pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded"></div>
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
          </div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
      </div>
      <div className="h-72 bg-slate-200 rounded-2xl animate-pulse"></div>
    </div>
  );
}