import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // AJUSTE AQUI: Mudamos de findUnique para findFirst para usar 'insensitive'
    // Isso permite que EXEMPLO@ e exemplo@ sejam o mesmo usuário no banco.
    const user = await prisma.user.findFirst({ 
      where: { 
        email: {
          equals: email,
          mode: 'insensitive'
        }
      } 
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // --- TRAVA DE SEGURANÇA ---
    if (!user.approved) {
      return NextResponse.json({ 
        error: 'AGUARDE A APROVAÇÃO DE UM ADMINISTRADOR' 
      }, { status: 403 }); 
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });

  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}