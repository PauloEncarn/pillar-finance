export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: {
        data: 'desc',
      },
      take: 5000 // Aumentado para suportar o histórico de financiamentos longos
    });

    return NextResponse.json(lancamentos);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      descricao, 
      valor, 
      tipo, 
      categoria, 
      status, 
      data, 
      banco, 
      tipoConta, 
      formaPagamento, 
      parcelas 
    } = body;

    const numParcelas = parseInt(parcelas) || 1;
    // Lógica mantida: O valor inserido no form é o valor de CADA parcela
    // Se você preferir que o valor total seja dividido, use: parseFloat(valor) / numParcelas
    const valorDaParcela = parseFloat(valor); 
    const dataBase = new Date(data);

    // LÓGICA DE CRIAÇÃO (Sempre gera registros como PENDENTE no novo fluxo)
    const lancamentosParaCriar = [];

    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(dataBase);
      // Ajusta o mês para parcelas subsequentes
      dataVencimento.setMonth(dataBase.getMonth() + i);

      lancamentosParaCriar.push({
        descricao: numParcelas > 1 ? `${descricao} (${i + 1}/${numParcelas})` : descricao,
        valor: valorDaParcela,
        tipo,
        categoria,
        // No novo fluxo de "Baixa", o item sempre nasce PENDENTE para ser pago depois
        status: 'PENDENTE', 
        data: dataVencimento,
        // No momento do agendamento, guardamos o banco/forma sugeridos, 
        // mas eles podem ser alterados no modal de "Lançar Pagamento"
        banco: banco || 'ITAU',
        tipoConta: tipoConta || 'PJ',
        formaPagamento: formaPagamento || 'BOLETO',
        parcelaAtual: i + 1,
        totalParcelas: numParcelas
      });
    }

    // Usamos o createMany para alta performance em financiamentos longos
    const resultado = await prisma.lancamento.createMany({
      data: lancamentosParaCriar
    });

    return NextResponse.json({ 
      message: `${resultado.count} registro(s) criado(s) com sucesso.`,
      count: resultado.count 
    });

  } catch (error) {
    console.error("Erro crítico ao processar lançamento:", error);
    return NextResponse.json({ error: 'Erro ao criar lançamento no banco de dados' }, { status: 500 });
  }
}