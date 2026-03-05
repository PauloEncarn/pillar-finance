export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  console.log(">>> [GET] Buscando registros no banco...");
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: { data: 'desc' },
    });

    const formatados = (lancamentos || []).map(item => ({
      ...item,
      valor: Number(item.valor) || 0
    }));

    return NextResponse.json(formatados);
  } catch (error) {
    console.error(">>> [GET] Erro:", error.message);
    return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { descricao, valor, tipo, categoria, data, banco, tipoConta, formaPagamento, parcelas } = body;

    const numParcelas = parseInt(parcelas) || 1;
    const valorParcela = parseFloat(valor) / numParcelas;
    const dataInicial = new Date(data);

    if (numParcelas === 1) {
      const novo = await prisma.lancamento.create({
        data: {
          descricao,
          valor: parseFloat(valor),
          tipo, categoria, data: dataInicial, banco, tipoConta, formaPagamento,
          parcelaAtual: 1, totalParcelas: 1
        }
      });
      return NextResponse.json(novo);
    }

    // Criando o grupo de parcelas
    const listaParcelas = [];
    for (let i = 0; i < numParcelas; i++) {
      const vcto = new Date(dataInicial);
      vcto.setMonth(dataInicial.getMonth() + i);

      listaParcelas.push({
        descricao: `${descricao} (${i + 1}/${numParcelas})`, // Padronização do nome
        valor: valorParcela,
        tipo, categoria, banco, tipoConta, formaPagamento,
        status: 'PENDENTE',
        data: vcto,
        parcelaAtual: i + 1,
        totalParcelas: numParcelas
      });
    }

    await prisma.lancamento.createMany({ data: listaParcelas });
    return NextResponse.json({ message: "Parcelas criadas" });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}