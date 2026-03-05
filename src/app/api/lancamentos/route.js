export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  console.log(">>> [GET] Buscando registros no banco...");
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: { data: 'desc' },
    });

    const formatados = (lancamentos || []).map(item => ({
      ...item,
      valor: Number(item.valor) || 0
    }));

    return NextResponse.json(formatados);
  } catch (error) {
    console.error(">>> [GET] Erro:", error.message);
    return NextResponse.json({ error: 'Erro no banco' }, { status: 500 });
  }
}

export async function POST(request) {
  console.log(">>> [POST] Iniciando novo lançamento...");
  try {
    const body = await request.json();
    
    // Pegamos todos os campos que adicionamos no modal do page.js
    const { 
      descricao, valor, tipo, categoria, data, 
      banco, tipoConta, formaPagamento, parcelas 
    } = body;

    if (!descricao || !valor || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const numParcelas = parseInt(parcelas) || 1;
    const valorTotal = parseFloat(valor);
    const valorParcela = valorTotal / numParcelas;
    const dataInicial = new Date(data);

    // --- LÓGICA DE PARCELAMENTO ---
    // Se for 1 parcela, usamos create. Se for mais, usamos createMany.
    if (numParcelas === 1) {
      const novo = await prisma.lancamento.create({
        data: {
          descricao,
          valor: valorTotal,
          tipo: tipo || 'SAIDA',
          categoria: categoria || 'OUTROS',
          status: 'PENDENTE',
          data: dataInicial,
          banco: banco || 'ITAU',
          tipoConta: tipoConta || 'PJ',
          formaPagamento: formaPagamento || 'PIX',
          parcelaAtual: 1,
          totalParcelas: 1
        },
      });
      return NextResponse.json(novo);
    }

    // Gerando o array de parcelas para o loop
    const listaParcelas = [];
    for (let i = 0; i < numParcelas; i++) {
      const dataVencimento = new Date(dataInicial);
      // Adiciona i meses à data inicial
      dataVencimento.setMonth(dataInicial.getMonth() + i);

      listaParcelas.push({
        descricao: `${descricao} (${i + 1}/${numParcelas})`,
        valor: valorParcela,
        tipo: tipo || 'SAIDA',
        categoria: categoria || 'OUTROS',
        status: 'PENDENTE',
        data: dataVencimento,
        banco: banco || 'ITAU',
        tipoConta: tipoConta || 'PJ',
        formaPagamento: formaPagamento || 'PIX',
        parcelaAtual: i + 1,
        totalParcelas: numParcelas
      });
    }

    // Criando todas de uma vez no banco
    const criados = await prisma.lancamento.createMany({
      data: listaParcelas
    });

    console.log(`>>> [POST] ${numParcelas} parcelas criadas com sucesso.`);
    return NextResponse.json(criados);

  } catch (error) {
    console.error(">>> [POST] Erro ao salvar:", error.message);
    return NextResponse.json({ error: 'Erro ao processar lançamento' }, { status: 500 });
  }
}