import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ATUALIZAR / EFETIVAR BAIXA (PATCH)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Extraímos os dados que vêm do modal de "Lançar Pagamento"
    const { banco, formaPagamento, parcelas, dataPagamento, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    // 1. Buscamos o registro original que está como PENDENTE
    const itemOriginal = await prisma.lancamento.findUnique({
      where: { id: id },
    });

    if (!itemOriginal) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    // Se no corpo do request NÃO vier "parcelas", significa que é uma atualização simples de status
    if (!parcelas) {
        const atualizado = await prisma.lancamento.update({
            where: { id },
            data: { status: status || 'PAGO' }
        });
        return NextResponse.json(atualizado);
    }

    // 2. LÓGICA DE BAIXA COM PARCELAMENTO / FINANCIAMENTO
    const numParcelas = parseInt(parcelas) || 1;
    const dataBase = new Date(dataPagamento || itemOriginal.data);
    const valorTotal = Number(itemOriginal.valor);
    const valorParcela = valorTotal / numParcelas;

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
          status: i === 0 ? 'PAGO' : 'PENDENTE', // Primeira paga, demais pendentes
          data: vcto,
          banco: banco,
          formaPagamento: formaPagamento,
          parcelaAtual: i + 1,
          totalParcelas: numParcelas
        });
      }

      // IMPORTANTE: Deletamos o registro "rascunho" e criamos os registros reais parcelados
      await prisma.lancamento.delete({ where: { id: id } });
      await prisma.lancamento.createMany({ data: novasParcelas });

      return NextResponse.json({ message: 'Financiamento gerado e item original baixado.' });
    }

    // 3. PAGAMENTO À VISTA (1 parcela)
    const atualizado = await prisma.lancamento.update({
      where: { id },
      data: {
        status: 'PAGO',
        banco: banco,
        formaPagamento: formaPagamento,
        data: dataBase
      }
    });

    return NextResponse.json(atualizado);

  } catch (error) {
    console.error("Erro no PATCH [id]:", error);
    return NextResponse.json({ error: 'Erro ao processar a baixa' }, { status: 500 });
  }
}

// DELETAR (DELETE) - Mantendo sua lógica de apagar o grupo todo
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const itemAlvo = await prisma.lancamento.findUnique({
      where: { id: id },
    });

    if (!itemAlvo) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    // Se for parte de um parcelamento, deleta o grupo pelo nome base
    if (itemAlvo.totalParcelas > 1) {
      const baseName = itemAlvo.descricao.split(' (')[0];
      await prisma.lancamento.deleteMany({
        where: {
          descricao: { startsWith: baseName },
          tipo: itemAlvo.tipo,
          valor: itemAlvo.valor // Segurança extra: mesmo valor de parcela
        },
      });
      return NextResponse.json({ message: 'Grupo excluído' });
    } 
    
    // Lançamento único
    await prisma.lancamento.delete({ where: { id: id } });

    return NextResponse.json({ message: 'Excluído com sucesso' });

  } catch (error) {
    console.error("Erro no DELETE [id]:", error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}