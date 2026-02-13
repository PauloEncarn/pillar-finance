import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Dados que vêm do Modal de Pagamento
    const { banco, formaPagamento, parcelas, dataPagamento } = body;

    const numParcelas = parseInt(parcelas) || 1;
    const dataBase = new Date(dataPagamento);

    // 1. Busca o compromisso original (Passo 1)
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });
    if (!itemOriginal) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    const valorTotal = Number(itemOriginal.valor);
    const valorDaParcela = valorTotal / numParcelas;

    // 2. Se for PARCELADO ou FINANCIAMENTO (> 1)
    if (numParcelas > 1) {
      const novasParcelas = [];

      for (let i = 0; i < numParcelas; i++) {
        const vcto = new Date(dataBase);
        vcto.setMonth(dataBase.getMonth() + i);

        novasParcelas.push({
          descricao: `${itemOriginal.descricao} (${i + 1}/${numParcelas})`,
          valor: valorDaParcela,
          tipo: itemOriginal.tipo,
          categoria: itemOriginal.categoria,
          tipoConta: itemOriginal.tipoConta,
          status: i === 0 ? 'PAGO' : 'PENDENTE', // A 1ª parcela já nasce paga
          data: vcto,
          banco,
          formaPagamento,
          parcelaAtual: i + 1,
          totalParcelas: numParcelas
        });
      }

      // MATAMOS O REGISTRO ÚNICO E CRIAMOS O FLUXO PARCELADO
      await prisma.transaction([
        prisma.lancamento.delete({ where: { id } }),
        prisma.lancamento.createMany({ data: novasParcelas })
      ]);

      return NextResponse.json({ message: 'Financiamento gerado!' });
    }

    // 3. SE FOR À VISTA (1x)
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
    console.error("Erro na liquidação:", error);
    return NextResponse.json({ error: 'Erro ao processar baixa' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.lancamento.delete({ where: { id } });
    return NextResponse.json({ message: 'Excluído' });
  } catch (error) { return NextResponse.json({ error: 'Erro' }, { status: 500 }); }
}