import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // 1. Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // 2. Verificar se a senha bate (Descriptografar)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // 3. Sucesso! Retornar dados do usuário (sem a senha, claro)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}