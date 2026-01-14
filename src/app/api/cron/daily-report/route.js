import { NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/email';

export async function GET(request) {
  // Segurança: Verifica se é o Vercel Cron que está chamando
  // (O Vercel injeta esse header automaticamente)
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ---------------------------------------------------------
    // AQUI ENTRARIA A CONSULTA AO BANCO DE DADOS REAL
    // Como estamos sem banco, vou simular dados para o teste
    // ---------------------------------------------------------
    const dadosDoBanco = [
      { id: 1, descricao: 'Cliente A', valor: 5000, status: 'PAGO', tipo: 'ENTRADA' },
      { id: 2, descricao: 'Servidor', valor: 200, status: 'PENDENTE', tipo: 'SAIDA' },
      { id: 3, descricao: 'Internet', valor: 150, status: 'PENDENTE', tipo: 'SAIDA' },
    ];

    // Processamento dos dados
    const pagos = dadosDoBanco.filter(i => i.status === 'PAGO');
    const pendentes = dadosDoBanco.filter(i => i.status === 'PENDENTE');

    const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const dadosRelatorio = {
      totalPago: formatMoney(pagos.reduce((acc, i) => acc + i.valor, 0)),
      totalPendente: formatMoney(pendentes.reduce((acc, i) => acc + i.valor, 0)),
      itensPendentes: pendentes.map(i => ({
        data: new Date().toLocaleDateString('pt-BR'), // Simulando data
        descricao: i.descricao,
        valor: formatMoney(i.valor)
      }))
    };

    // Disparar E-mail
    // Coloque seu e-mail pessoal aqui para testar por enquanto
    await sendDailyReport('seu-email@exemplo.com', dadosRelatorio);

    return NextResponse.json({ success: true, message: 'Relatório enviado!' });
  } catch (error) {
    console.error('Erro no Cron:', error);
    return NextResponse.json({ error: 'Falha interna' }, { status: 500 });
  }
}