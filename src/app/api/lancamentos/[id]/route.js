import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });

    if (!itemOriginal) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    // --- 1. LÓGICA DE ESTORNO RÁPIDO (Apenas status PENDENTE) ---
    if (body.status === 'PENDENTE' && !body.parcelas) {
      const estorno = await prisma.lancamento.update({
        where: { id },
        data: {
          status: 'PENDENTE',
          banco: 'AGUARDANDO',
          formaPagamento: 'A DEFINIR'
        }
      });
      return NextResponse.json(estorno);
    }

    // --- 2. LÓGICA DE LIQUIDAÇÃO / BAIXA (Com ou sem Financiamento) ---
    if (body.dataPagamento && (body.banco || body.formaPagamento)) {
      const numParcelas = parseInt(body.parcelas) || 1;
      const dataBase = new Date(body.dataPagamento);

      // Se tiver parcelas > 1 e for um título pai (não parcelado ainda)
      if (numParcelas > 1 && itemOriginal.totalParcelas <= 1) {
        const valorTotal = Number(itemOriginal.valor);
        const valorParcela = valorTotal / numParcelas;
        const novasParcelas = [];

        for (let i = 0; i < numParcelas; i++) {
          const vcto = new Date(dataBase);
          vcto.setMonth(dataBase.getMonth() + i);

          novasParcelas.push({
            descricao: `${itemOriginal.descricao} (${i + 1}/${numParcelas})`,
            valor: valorParcela,
            tipo: itemOriginal.tipo,
            categoria: itemOriginal.categoria,
            tipoConta: itemOriginal.tipoConta,
            status: i === 0 ? 'PAGO' : 'PENDENTE',
            data: vcto,
            banco: body.banco,
            formaPagamento: body.formaPagamento,
            parcelaAtual: i + 1,
            totalParcelas: numParcelas
          });
        }

        await prisma.$transaction([
          prisma.lancamento.delete({ where: { id } }),
          prisma.lancamento.createMany({ data: novasParcelas })
        ]);

        return NextResponse.json({ message: 'Financiamento processado' });
      }

      // Liquidação simples (baixa de parcela única ou parcela de grupo)
      const liquidado = await prisma.lancamento.update({
        where: { id },
        data: {
          status: 'PAGO',
          banco: body.banco,
          formaPagamento: body.formaPagamento,
          data: dataBase
        }
      });
      return NextResponse.json(liquidado);
    }

    // --- 3. LÓGICA DE EDIÇÃO GERAL (Somente se campos de edição forem enviados) ---
    if (body.descricao || body.valor) {
      const editado = await prisma.lancamento.update({
        where: { id },
        data: {
          descricao: body.descricao ?? itemOriginal.descricao,
          valor: body.valor ? parseFloat(body.valor) : itemOriginal.valor,
          categoria: body.categoria ?? itemOriginal.categoria,
          tipoConta: body.tipoConta ?? itemOriginal.tipoConta,
          tipo: body.tipo ?? itemOriginal.tipo
        }
      });
      return NextResponse.json(editado);
    }

    return NextResponse.json({ error: 'Nenhuma ação identificada' }, { status: 400 });

  } catch (error) {
    console.error(">>> [PATCH] ERRO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Mantenha o seu método DELETE abaixo se já estiver funcionando...