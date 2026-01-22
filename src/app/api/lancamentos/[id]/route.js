import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETAR (DELETE)
export async function DELETE(request, { params }) {
  try {
    // CORREÇÃO: params agora é uma Promise e precisa ser resolvida com await
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    await prisma.lancamento.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error) {
    console.error("Erro ao excluir no Prisma:", error);
    // Verificamos se o erro é porque o registro não existe (evita erro 500 desnecessário)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao excluir o registro' }, { status: 500 });
  }
}

// ATUALIZAR STATUS (PATCH)
export async function PATCH(request, { params }) {
  try {
    // CORREÇÃO: Aguardamos a Promise 'params' resolver aqui também
    const { id } = await params;
    
    const body = await request.json(); // Espera { status: 'PAGO' }

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const atualizado = await prisma.lancamento.update({
      where: { id },
      data: { status: body.status }
    });

    return NextResponse.json({
      ...atualizado,
      valor: Number(atualizado.valor) // Converte Decimal para Number para o frontend
    });
  } catch (error) {
    console.error("Erro ao atualizar no Prisma:", error);
    return NextResponse.json({ error: 'Erro ao atualizar o registro' }, { status: 500 });
  }
}