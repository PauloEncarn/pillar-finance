export const dynamic = 'force-dynamic'; // <--- ADICIONE ISSO AQUI
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: {
        data: 'desc', // Mais recentes primeiro
      },
      take: 1000 // <--- LIMITADOR DE SEGURANÇA/PERFORMANCE
    });

    return NextResponse.json(lancamentos);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { descricao, valor, tipo, categoria, status, data } = body;

    const novoLancamento = await prisma.lancamento.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo,
        categoria,
        status,
        data: new Date(data),
      },
    });

    return NextResponse.json(novoLancamento);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}