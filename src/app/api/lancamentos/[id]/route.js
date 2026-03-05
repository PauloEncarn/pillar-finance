import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- MÉTODO UPDATE (PATCH) ---
export async function PATCH(request, { params }) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });

    if (!itemOriginal) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // --- LÓGICA 1: REGERAÇÃO DE FLUXO (EDIÇÃO MASTER) ---
    // Se mudar parcelas ou valor bruto em um item que faz parte de um grupo
    if (body.regerarFluxo) {
      const baseName = itemOriginal.descricao.split(' (')[0];
      const numParcelas = parseInt(body.parcelas) || 1;
      const valorParcela = parseFloat(body.valor) / numParcelas;
      const dataInicial = new Date(body.data);

      const novasParcelas = [];
      for (let i = 0; i < numParcelas; i++) {
        const vcto = new Date(dataInicial);
        vcto.setMonth(dataInicial.getMonth() + i);

        novasParcelas.push({
          descricao: numParcelas > 1 ? `${body.descricao} (${i + 1}/${numParcelas})` : body.descricao,
          valor: valorParcela,
          tipo: body.tipo,
          categoria: body.categoria,
          banco: body.banco,
          tipoConta: body.tipoConta,
          formaPagamento: body.formaPagamento,
          status: 'PENDENTE',
          data: vcto,
          parcelaAtual: i + 1,
          totalParcelas: numParcelas
        });
      }

      // Transação: Apaga todo o grupo antigo e cria o novo fluxo corrigido
      await prisma.$transaction([
        prisma.lancamento.deleteMany({
          where: { descricao: { startsWith: baseName }, tipoConta: itemOriginal.tipoConta }
        }),
        prisma.lancamento.createMany({ data: novasParcelas })
      ]);

      return NextResponse.json({ message: 'Fluxo regerado com sucesso' });
    }

    // --- LÓGICA 2: AJUSTE FINO (APENAS UM ITEM) ---
    const atualizado = await prisma.lancamento.update({
      where: { id },
      data: {
        descricao: body.descricao ?? itemOriginal.descricao,
        valor: body.valor ? parseFloat(body.valor) : itemOriginal.valor,
        status: body.status ?? itemOriginal.status,
        data: body.data ? new Date(body.data) : itemOriginal.data,
        banco: body.banco ?? itemOriginal.banco,
        formaPagamento: body.formaPagamento ?? itemOriginal.formaPagamento,
        categoria: body.categoria ?? itemOriginal.categoria
      }
    });

    return NextResponse.json(atualizado);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- MÉTODO DELETE ---
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    const item = await prisma.lancamento.findUnique({ where: { id } });

    if (!item) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

    // LÓGICA DE EXCLUSÃO EM CASCATA
    // Se o nome tem o padrão "(1/42)", pegamos apenas o nome base para deletar o grupo
    const baseName = item.descricao.split(' (')[0];

    if (item.totalParcelas > 1) {
      console.log(`>>> [DELETE] Removendo grupo: ${baseName}`);
      await prisma.lancamento.deleteMany({
        where: {
          descricao: { startsWith: baseName },
          tipoConta: item.tipoConta, // Segurança extra para não apagar homônimos
          totalParcelas: item.totalParcelas
        }
      });
    } else {
      // Exclusão simples
      await prisma.lancamento.delete({ where: { id } });
    }

    return NextResponse.json({ message: 'Removido com sucesso' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// O método PATCH (Update) pode continuar como está, 
// pois o Frontend agora envia os campos certinhos.