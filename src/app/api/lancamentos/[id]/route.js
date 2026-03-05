import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- MÉTODO UPDATE (PATCH) ---
export async function PATCH(request, { params }) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const itemOriginal = await prisma.lancamento.findUnique({ where: { id } });

    if (!itemOriginal) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }

    // 1. LÓGICA DE ALTERNÂNCIA DE STATUS RÁPIDA (Botão da Tabela)
    // Se vier apenas o status no body, atualizamos apenas ele.
    if (Object.keys(body).length === 1 && body.status) {
      const dataUpdate = { status: body.status };
      
      // Se estornar para PENDENTE, limpamos os dados bancários por segurança
      if (body.status === 'PENDENTE') {
        dataUpdate.banco = 'AGUARDANDO';
        dataUpdate.formaPagamento = 'A DEFINIR';
      }

      const atualizado = await prisma.lancamento.update({
        where: { id },
        data: dataUpdate
      });
      return NextResponse.json(atualizado);
    }

    // 2. LÓGICA DE LIQUIDAÇÃO / FINANCIAMENTO (Modal de Baixa)
    if (body.dataPagamento) {
      const numParcelas = parseInt(body.parcelas) || 1;
      const dataBase = new Date(body.dataPagamento);

      // Gerar parcelas se for um título único virando financiamento
      if (numParcelas > 1 && itemOriginal.totalParcelas <= 1) {
        const valorParcela = Number(itemOriginal.valor) / numParcelas;
        const novasParcelas = [];

        for (let i = 0; i < numParcelas; i++) {
          const vcto = new Date(dataBase);
          vcto.setMonth(dataBase.getMonth() + i);

          novasParcelas.push({
            descricao: `${itemOriginal.descricao} (${i + 1}/${numParcelas})`,
            valor: valorParcela,
            tipo: itemOriginal.tipo,
            categoria: itemOriginal.categoria,
            tipoConta: itemOriginal.tipoConta,
            status: i === 0 ? 'PAGO' : 'PENDENTE',
            data: vcto,
            banco: body.banco || 'ITAU',
            formaPagamento: body.formaPagamento || 'PIX',
            parcelaAtual: i + 1,
            totalParcelas: numParcelas
          });
        }

        await prisma.$transaction([
          prisma.lancamento.delete({ where: { id } }),
          prisma.lancamento.createMany({ data: novasParcelas })
        ]);

        return NextResponse.json({ message: 'Financiamento processado' });
      }

      // Baixa simples
      const liquidado = await prisma.lancamento.update({
        where: { id },
        data: {
          status: 'PAGO',
          banco: body.banco || itemOriginal.banco,
          formaPagamento: body.formaPagamento || itemOriginal.formaPagamento,
          data: dataBase
        }
      });
      return NextResponse.json(liquidado);
    }

    // 3. LÓGICA DE EDIÇÃO GERAL (Modal de Edição)
    const editado = await prisma.lancamento.update({
      where: { id },
      data: {
        descricao: body.descricao ?? itemOriginal.descricao,
        valor: body.valor ? parseFloat(body.valor) : itemOriginal.valor,
        categoria: body.categoria ?? itemOriginal.categoria,
        tipoConta: body.tipoConta ?? itemOriginal.tipoConta,
        tipo: body.tipo ?? itemOriginal.tipo,
        data: body.data ? new Date(body.data) : itemOriginal.data
      }
    });

    return NextResponse.json(editado);

  } catch (error) {
    console.error(">>> [PATCH] ERRO:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- MÉTODO DELETE ---
export async function DELETE(request, { params }) {
  const { id } = await params;
  console.log(`>>> [DELETE] Solicitando exclusão do ID: ${id}`);

  try {
    // Verificamos se existe antes de deletar para evitar erro 500 do Prisma
    const existe = await prisma.lancamento.findUnique({ where: { id } });
    
    if (!existe) {
      return NextResponse.json({ error: 'Registro já não existe' }, { status: 404 });
    }

    await prisma.lancamento.delete({ where: { id } });
    return NextResponse.json({ message: 'Excluído com sucesso' });
  } catch (error) {
    console.error(">>> [DELETE] ERRO:", error.message);
    return NextResponse.json({ error: 'Erro ao excluir no banco de dados' }, { status: 500 });
  }
}