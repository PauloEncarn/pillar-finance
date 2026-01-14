import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETAR (DELETE)
export async function DELETE(request, { params }) {
  try {
    // CORREÇÃO: Aguardamos a Promise 'params' resolver antes de pegar o ID
    const { id } = await params; 

    await prisma.lancamento.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar:", error);
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}

// ATUALIZAR STATUS (PATCH)
export async function PATCH(request, { params }) {
  try {
    // CORREÇÃO: Aguardamos a Promise 'params' resolver aqui também
    const { id } = await params;
    
    const body = await request.json(); // Espera { status: 'PAGO' }

    const atualizado = await prisma.lancamento.update({
      where: { id },
      data: { status: body.status }
    });

    return NextResponse.json({
      ...atualizado,
      valor: Number(atualizado.valor)
    });
  } catch (error) {
    console.error("Erro ao atualizar:", error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}