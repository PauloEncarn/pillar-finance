import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * MÉTODO PATCH: Responsável por EDITAR ou LIQUIDAR (Baixa/Parcelamento)
 */
export async function PATCH(request, { params }) {
  const { id } = await params;
  console.log(`>>> [PATCH /api/lancamentos/${id}] Iniciando processamento...`);
  
  try {
    const body = await request.json();
    
    // 1. Verificar se o registro existe
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });
    if (!itemOriginal) {
      console.warn(">>> [PATCH] Registro não encontrado.");
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    // --- LÓGICA A: LIQUIDAÇÃO / FINANCIAMENTO ---
    // Se o body contiver 'parcelas', entendemos que é uma BAIXA
    if (body.parcelas) {
      const numParcelas = parseInt(body.parcelas) || 1;
      const dataBase = new Date(body.dataPagamento);
      const valorTotal = Number(itemOriginal.valor);
      const valorParcela = valorTotal / numParcelas;

      if (numParcelas > 1) {
        console.log(`>>> [PATCH] Gerando financiamento de ${numParcelas}x`);
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

        // Transação: Deleta o original e cria a árvore de parcelas
        await prisma.$transaction([
          prisma.lancamento.delete({ where: { id } }),
          prisma.lancamento.createMany({ data: novasParcelas })
        ]);

        return NextResponse.json({ message: 'Financiamento gerado com sucesso' });
      }

      // Baixa à vista (1x)
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

    // --- LÓGICA B: EDIÇÃO SIMPLES ---
    // Se não houver 'parcelas', é uma edição dos campos do agendamento
    console.log(">>> [PATCH] Realizando edição de campos.");
    const editado = await prisma.lancamento.update({
      where: { id },
      data: {
        descricao: body.descricao,
        valor: parseFloat(body.valor),
        tipo: body.tipo,
        categoria: body.categoria,
        tipoConta: body.tipoConta,
        data: new Date(body.data)
      }
    });

    return NextResponse.json(editado);

  } catch (error) {
    console.error(">>> [PATCH] ERRO TÉCNICO:", error.message);
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