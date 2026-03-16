import { NextResponse } from 'next/server';
import { sendDailyReport } from '@/lib/email';
import prisma from '@/lib/prisma';

export async function GET(request) {
  // Comentei a trava de segurança para você testar no navegador sem erro de Unauthorized
  /*
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  */

  try {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);

    // Busca real no banco para o teste ser fiel
    const lancamentos = await prisma.lancamento.findMany({
      where: { data: { gte: inicioMes, lte: fimMes } }
    });

    const formatMoney = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const pagos = lancamentos.filter(i => i.status === 'PAGO');
    const pendentes = lancamentos.filter(i => i.status !== 'PAGO');

    const dadosRelatorio = {
      totalPago: formatMoney(pagos.reduce((acc, i) => acc + Number(i.valor), 0)),
      totalPendente: formatMoney(pendentes.reduce((acc, i) => acc + Number(i.valor), 0)),
      itensPendentes: pendentes.map(i => ({
        descricao: i.descricao.toUpperCase(),
        valor: formatMoney(Number(i.valor))
      }))
    };

    const destinatario = process.env.EMAIL_DESTINO_RELATORIO;

    // Tenta enviar e captura o log detalhado
    const info = await sendDailyReport(destinatario, dadosRelatorio);

    return NextResponse.json({ 
      success: true, 
      message: "E-mail enviado!", 
      info: info.response // Resposta do servidor de e-mail (Ex: 250 OK)
    });

  } catch (error) {
    // Se der erro, ele vai aparecer no corpo da página para você ler
    return NextResponse.json({ 
      success: false, 
      error_code: error.code, // Ex: EAUTH, ETIMEDOUT
      error_command: error.command, 
      error_message: error.message 
    }, { status: 500 });
  }
}