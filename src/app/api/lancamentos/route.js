export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  console.log(">>> [GET] Buscando registros no banco...");
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: { data: 'desc' },
    });

    // Se lancamentos for null ou undefined, garante um array vazio
    const dados = lancamentos || [];
    console.log(`>>> [GET] Sucesso: ${dados.length} itens.`);

    const formatados = dados.map(item => ({
      ...item,
      valor: Number(item.valor) || 0
    }));

    return NextResponse.json(formatados);
  } catch (error) {
    console.error(">>> [GET] Erro ao acessar Prisma:", error.message);
    return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
  }
}

export async function POST(request) {
  console.log(">>> [POST] Tentando criar novo registro...");
  try {
    const body = await request.json();
    const { descricao, valor, tipo, categoria, data } = body;

    // Validação de segurança
    if (!descricao || !valor || !data) {
      console.warn(">>> [POST] Tentativa de envio com campos vazios.");
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    }

    const novo = await prisma.lancamento.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo: tipo || 'SAIDA',
        categoria: categoria || 'OUTROS',
        status: 'PENDENTE',
        data: new Date(data),
        // Campos padrão para o seu novo fluxo
        banco: 'AGUARDANDO',
        formaPagamento: 'A DEFINIR',
        tipoConta: 'PJ',
        parcelaAtual: 1,
        totalParcelas: 1
      },
    });

    console.log(">>> [POST] Registro criado com ID:", novo.id);
    return NextResponse.json(novo);
  } catch (error) {
    console.error(">>> [POST] Erro ao salvar:", error.message);
    return NextResponse.json({ error: 'Erro ao salvar registro' }, { status: 500 });
  }
}