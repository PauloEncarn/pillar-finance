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