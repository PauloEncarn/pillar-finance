export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * LISTAR LANÇAMENTOS
 * Retorna todos os registros para popular a tabela e o dashboard.
 */
export async function GET(request) {
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: {
        data: 'desc',
      },
      take: 5000 // Limite alto para suportar o histórico de financiamentos
    });

    // Converte valores decimais para Number para evitar erros no frontend
    const formatados = lancamentos.map(item => ({
      ...item,
      valor: Number(item.valor)
    }));

    return NextResponse.json(formatados);
  } catch (error) {
    console.error("Erro ao buscar lançamentos:", error);
    return NextResponse.json({ error: 'Erro ao buscar dados no banco' }, { status: 500 });
  }
}

/**
 * REGISTRAR COMPROMISSO (PASSO 1)
 * Cria a dívida ou o crédito como 'PENDENTE'.
 * O parcelamento e os dados bancários serão definidos apenas na liquidação (PATCH).
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      descricao, 
      valor, 
      tipo, 
      categoria, 
      data, 
      tipoConta 
    } = body;

    // Validação básica
    if (!descricao || !valor || !data) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const novoLancamento = await prisma.lancamento.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        tipo, // ENTRADA ou SAIDA
        categoria, // Ex: MANUTENCAO, FINANCIAMENTO, etc.
        tipoConta: tipoConta || 'PJ',
        status: 'PENDENTE', // Nasce sempre como pendente no novo fluxo
        data: new Date(data),
        parcelaAtual: 1,
        totalParcelas: 1,
        // Inicializamos campos de liquidação com valores neutros
        banco: 'AGUARDANDO',
        formaPagamento: 'A DEFINIR'
      },
    });

    return NextResponse.json(novoLancamento);

  } catch (error) {
    console.error("Erro crítico no POST /api/lancamentos:", error);
    return NextResponse.json({ error: 'Erro ao registrar compromisso financeiro' }, { status: 500 });
  }
}