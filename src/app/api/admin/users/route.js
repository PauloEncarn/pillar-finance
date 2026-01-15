import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  // Busca usuários e inclui o campo approved
  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true,
      approved: true // <--- TRAZER ESSE DADO
    },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(users);
}

export async function PATCH(request) {
  try {
    const { id, role, approved } = await request.json(); // Recebe approved também
    
    // Monta o objeto de update dinâmico (pode ser só role, só approved ou ambos)
    const dataToUpdate = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (approved !== undefined) dataToUpdate.approved = approved;

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

// DELETE continua igual...
export async function DELETE(request) {
  /* ... mantenha o código anterior ... */
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}