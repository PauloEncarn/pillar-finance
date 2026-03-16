import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    // 1. AJUSTE NA VERIFICAÇÃO: 
    // Usamos findFirst com mode: 'insensitive' para evitar que 
    // criem o mesmo e-mail mudando apenas maiúsculas/minúsculas.
    const userExists = await prisma.user.findFirst({ 
      where: { 
        email: {
          equals: email.trim(),
          mode: 'insensitive'
        }
      } 
    });

    if (userExists) {
      return NextResponse.json({ error: 'E-mail já cadastrado.' }, { status: 400 });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. BOAS PRÁTICAS:
    // Mesmo que o login aceite qualquer forma, é bom salvar no banco 
    // sempre em minúsculas para manter a organização da Pillar IT.
    const user = await prisma.user.create({
      data: {
        name: name.toUpperCase(), // Mantendo seu padrão de nomes em MAIÚSCULO
        email: email.toLowerCase().trim(), // E-mail padronizado em minúsculo
        password: hashedPassword,
        role: 'USER' 
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 });
  }
}