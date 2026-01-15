import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request) {
  try {
    const { id, name, avatarUrl } = await request.json();

    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        avatarUrl
      }
    });

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erro update:", error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}