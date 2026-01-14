import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  console.log("PRISMA OBJECT:", prisma); 
  console.log("TABELA USER:", prisma.user);
  try {
    const { name, email, password } = await request.json();

    // 1. Validar se preencheu tudo
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Preencha todos os campos.' }, { status: 400 });
    }

    // 2. Verificar se usuário já existe
    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
    }

    // 3. Criptografar a senha (Hash)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Criar o usuário no Banco
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN' // O primeiro usuário será Admin
      }
    });

    // 5. Criar um Log de Auditoria (Opcional, mas chique)
    await prisma.logSistema.create({
      data: {
        acao: 'REGISTER',
        detalhe: `Novo usuário cadastrado: ${email}`,
        modulo: 'Autenticação',
        userId: newUser.id,
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário criado com sucesso!' 
    }, { status: 201 });

  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}