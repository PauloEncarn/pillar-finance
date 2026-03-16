import { NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/email';
import prisma from '@/lib/prisma'; // Importando seu Prisma

export async function GET(request) {
  // 1. Segurança: Trava para rodar apenas via Vercel Cron ou com Secret
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    // 2. BUSCA REAL NO BANCO: Pega todos os lançamentos do mês atual
    const lancamentos = await prisma.lancamento.findMany({
      where: {
        data: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
    });

    // 3. PROCESSAMENTO DOS DADOS
    const totalPago = lancamentos
      .filter(i => i.status === 'PAGO' && i.tipo === 'ENTRADA')
      .reduce((acc, i) => acc + Number(i.valor), 0);

    const pendentes = lancamentos.filter(i => i.status !== 'PAGO');
    
    const totalPendente = pendentes.reduce((acc, i) => acc + Number(i.valor), 0);

    const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 4. PREPARAÇÃO DO RELATÓRIO
    const dadosRelatorio = {
      totalPago: formatMoney(totalPago),
      totalPendente: formatMoney(totalPendente),
      itensPendentes: pendentes.map(i => ({
        data: new Date(i.data).toLocaleDateString('pt-BR'),
        descricao: i.descricao.toUpperCase(),
        valor: formatMoney(Number(i.valor))
      }))
    };

    // 5. DISPARAR E-MAIL
    // Puxa o e-mail de destino do .env para não ficar "hardcoded"
    const emailDestino = process.env.EMAIL_DESTINO_RELATORIO || 'seu-email@exemplo.com';
    
    await sendDailyReport(emailDestino, dadosRelatorio);

    return NextResponse.json({ 
      success: true, 
      date: agora.toISOString(),
      itemsFound: lancamentos.length 
    });

  } catch (error) {
    console.error('Erro no motor de Auditoria:', error);
    return NextResponse.json({ error: 'Falha no processamento de dados' }, { status: 500 });
  }
}