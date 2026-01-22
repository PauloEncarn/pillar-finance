export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: {
        data: 'desc',
      },
      take: 2000 // Aumentado um pouco para suportar o volume de parcelados
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
    const valorParcela = parseFloat(valor) / numParcelas;
    const dataBase = new Date(data);

    // Se for apenas 1 parcela, cria normalmente
    if (numParcelas === 1) {
      const novoLancamento = await prisma.lancamento.create({
        data: {
          descricao,
          valor: parseFloat(valor),
          tipo,
          categoria,
          status,
          data: dataBase,
          banco,
          tipoConta,
          formaPagamento,
          parcelaAtual: 1,
          totalParcelas: 1
        },
      });
      return NextResponse.json(novoLancamento);
    }

    // LÓGICA DE PARCELAMENTO: Cria múltiplos registros
    const lancamentosParaCriar = [];

    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(dataBase);
      // Adiciona meses subsequentes (0 para o primeiro mês, 1 para o segundo, etc)
      dataVencimento.setMonth(dataBase.getMonth() + i);

      lancamentosParaCriar.push({
        descricao: `${descricao} (${i + 1}/${numParcelas})`,
        valor: valorParcela,
        tipo,
        categoria,
        // O primeiro registro mantém o status do form, os outros entram como 'EM ABERTO'
        status: i === 0 ? status : 'EM ABERTO', 
        data: dataVencimento,
        banco,
        tipoConta,
        formaPagamento,
        parcelaAtual: i + 1,
        totalParcelas: numParcelas
      });
    }

    // createMany é mais eficiente para inserir vários registros de uma vez
    const resultado = await prisma.lancamento.createMany({
      data: lancamentosParaCriar
    });

    return NextResponse.json({ message: `${resultado.count} parcelas criadas com sucesso.` });

  } catch (error) {
    console.error("Erro ao processar lançamento:", error);
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}