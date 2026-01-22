import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETAR (DELETE) - Agora com suporte a exclusão de grupos parcelados
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    // 1. Buscamos os detalhes do item para saber se é parcelado
    const itemAlvo = await prisma.lancamento.findUnique({
      where: { id: id },
    });

    if (!itemAlvo) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    const baseName = itemAlvo.descricao.split(' (')[0];

    // 2. Se for parcelado, deletamos o grupo todo baseado em critérios de segurança
    // (Nome base + Valor da Parcela + Banco)
    if (itemAlvo.totalParcelas > 1) {
      await prisma.lancamento.deleteMany({
        where: {
          descricao: { startsWith: baseName },
          valor: itemAlvo.valor,
          banco: itemAlvo.banco,
        },
      });
      return NextResponse.json({ message: 'Grupo de parcelas excluído com sucesso' });
    } 
    
    // 3. Se for lançamento único, deleta apenas o ID específico
    await prisma.lancamento.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Excluído com sucesso' });

  } catch (error) {
    console.error("Erro ao excluir no Prisma:", error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao excluir o registro' }, { status: 500 });
  }
}

// ATUALIZAR STATUS (PATCH)
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const atualizado = await prisma.lancamento.update({
      where: { id },
      data: { status: body.status }
    });

    return NextResponse.json({
      ...atualizado,
      valor: Number(atualizado.valor)
    });
  } catch (error) {
    console.error("Erro ao atualizar no Prisma:", error);
    return NextResponse.json({ error: 'Erro ao atualizar o registro' }, { status: 500 });
  }
}