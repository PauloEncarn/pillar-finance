import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * MÉTODO PATCH: Responsável por EDITAR ou LIQUIDAR (Baixa/Parcelamento)
 */
export async function PATCH(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });

    if (!itemOriginal) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // LÓGICA DE BAIXA / FINANCIAMENTO
    if (body.parcelas) {
      const numParcelas = parseInt(body.parcelas) || 1;
      const dataLiquidacao = new Date(body.dataPagamento); // Data vinda do modal de baixa
      const valorParcela = Number(itemOriginal.valor) / numParcelas;

      if (numParcelas > 1) {
        const novasParcelas = [];
        for (let i = 0; i < numParcelas; i++) {
          const vcto = new Date(dataLiquidacao);
          vcto.setMonth(dataLiquidacao.getMonth() + i);

          novasParcelas.push({
            descricao: `${itemOriginal.descricao} (${i + 1}/${numParcelas})`,
            valor: valorParcela,
            tipo: itemOriginal.tipo,
            categoria: itemOriginal.categoria,
            tipoConta: itemOriginal.tipoConta,
            status: i === 0 ? 'PAGO' : 'PENDENTE',
            data: vcto, // Data calculada a partir da baixa
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

        return NextResponse.json({ message: 'Financiamento gerado' });
      }

      // Baixa à Vista
      const atualizado = await prisma.lancamento.update({
        where: { id },
        data: {
          status: 'PAGO',
          banco: body.banco,
          formaPagamento: body.formaPagamento,
          data: dataLiquidacao // Define a data no momento da baixa
        }
      });
      return NextResponse.json(atualizado);
    }

    // Edição simples (sem parcelas)
    const editado = await prisma.lancamento.update({
      where: { id },
      data: {
        descricao: body.descricao,
        valor: parseFloat(body.valor),
        categoria: body.categoria,
        tipoConta: body.tipoConta,
        tipo: body.tipo
      }
    });
    return NextResponse.json(editado);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * MÉTODO DELETE: Responsável por excluir o registro
 */
export async function DELETE(request, { params }) {
  const { id } = await params;
  console.log(`>>> [DELETE /api/lancamentos/${id}] Excluindo registro...`);

  try {
    // 1. Primeiro verificamos se ele ainda existe
    const existe = await prisma.lancamento.findUnique({ where: { id } });

    if (!existe) {
      console.log(">>> [DELETE] Registro já não existia mais, ignorando...");
      return NextResponse.json({ message: 'Registro já removido anteriormente' });
    }

    // 2. Só tenta apagar se ele existir
    await prisma.lancamento.delete({ where: { id } });
    
    console.log(">>> [DELETE] Sucesso!");
    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error) {
    console.error(">>> [DELETE] ERRO INESPERADO:", error.message);
    return NextResponse.json({ error: 'Erro ao processar exclusão' }, { status: 500 });
  }
}