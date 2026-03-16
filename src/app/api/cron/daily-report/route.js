import { NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/email';
import prisma from '@/lib/prisma';

export async function GET(request) {
  // Trava de segurança recomendada para produção
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    const lancamentos = await prisma.lancamento.findMany({
      where: { data: { gte: inicioMes, lte: fimMes } }
    });

    const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Separação de Lógica
    const entradasPendentes = lancamentos.filter(i => i.tipo === 'ENTRADA' && i.status !== 'PAGO');
    const saidasPendentes = lancamentos.filter(i => i.tipo === 'SAIDA' && i.status !== 'PAGO');
    const totalRecebido = lancamentos.filter(i => i.tipo === 'ENTRADA' && i.status === 'PAGO');

    const dadosRelatorio = {
      totalRecebido: formatMoney(totalRecebido.reduce((acc, i) => acc + Number(i.valor), 0)),
      totalPendente: formatMoney(saidasPendentes.reduce((acc, i) => acc + Number(i.valor), 0)),
      entradasPendentes: entradasPendentes.map(i => ({
        data: new Date(i.data).toLocaleDateString('pt-BR'),
        descricao: i.descricao.toUpperCase(),
        valor: formatMoney(Number(i.valor))
      })),
      saidasPendentes: saidasPendentes.map(i => ({
        data: new Date(i.data).toLocaleDateString('pt-BR'),
        descricao: i.descricao.toUpperCase(),
        valor: formatMoney(Number(i.valor))
      }))
    };

    const destinatario = process.env.EMAIL_DESTINO_RELATORIO;
    await sendDailyReport(destinatario, dadosRelatorio);

    return NextResponse.json({ success: true, message: "Relatório Montranel enviado!" });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}