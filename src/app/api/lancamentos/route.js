import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// LISTAR (GET)
export async function GET() {
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    const dadosFormatados = lancamentos.map(item => ({
      ...item,
      valor: Number(item.valor) 
    }));

    return NextResponse.json(dadosFormatados);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

// CRIAR (POST)
export async function POST(request) {
  try {
    const body = await request.json();
    const { descricao, valor, tipo, categoria, status, data } = body;

    const primeiroUsuario = await prisma.user.findFirst();
    
    if (!primeiroUsuario) {
      return NextResponse.json({ error: 'Nenhum usuário cadastrado.' }, { status: 400 });
    }

    const novoLancamento = await prisma.lancamento.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        categoria,
        status,
        data,
        userId: primeiroUsuario.id
      }
    });

    return NextResponse.json({
      ...novoLancamento,
      valor: Number(novoLancamento.valor)
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao salvar:", error);
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}