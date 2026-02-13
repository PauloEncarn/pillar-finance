import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { banco, formaPagamento, parcelas, dataPagamento } = body;

    const numParcelas = parseInt(parcelas) || 1;
    const dataBase = new Date(dataPagamento);

    // 1. Buscamos o registro original que está sendo "baixado"
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });
    if (!itemOriginal) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });

    const valorTotal = Number(itemOriginal.valor);
    const valorParcela = valorTotal / numParcelas;

    // 2. LÓGICA DE CONVERSÃO: Se o usuário escolheu > 1 parcela na hora de pagar
    if (numParcelas > 1) {
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
          status: i === 0 ? 'PAGO' : 'PENDENTE', // A primeira parcela já sai como paga
          data: vcto,
          banco,
          formaPagamento,
          parcelaAtual: i + 1,
          totalParcelas: numParcelas
        });
      }

      // EXCLUSÃO DO "RASCUNHO" E CRIAÇÃO DAS PARCELAS REAIS
      await prisma.lancamento.delete({ where: { id } });
      await prisma.lancamento.createMany({ data: novasParcelas });

      return NextResponse.json({ message: 'Financiamento gerado com sucesso' });
    }

    // 3. PAGAMENTO À VISTA: Apenas atualiza o registro existente
    const atualizado = await prisma.lancamento.update({
      where: { id },
      data: {
        status: 'PAGO',
        banco,
        formaPagamento,
        data: dataBase
      }
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro na baixa:", error);
    return NextResponse.json({ error: 'Erro ao processar pagamento' }, { status: 500 });
  }
}

// DELETE MANTIDO PARA SEGURANÇA
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.lancamento.delete({ where: { id } });
    return NextResponse.json({ message: 'Removido' });
  } catch (error) { return NextResponse.json({ error: 'Erro' }, { status: 500 }); }
}