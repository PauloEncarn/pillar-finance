import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // 1. Verifica se as variáveis SMTP existem
    const smtpConfigurado = !!(
      process.env.SMTP_HOST && 
      process.env.SMTP_USER && 
      process.env.SMTP_PASS
    );

    let smtpOnline = false;

    // 2. Tenta conexão real com o servidor de e-mail
    if (smtpConfigurado) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      try {
        await transporter.verify();
        smtpOnline = true;
      } catch (err) {
        smtpOnline = false;
      }
    }

    // 3. Busca os últimos 10 logs do banco
    const logs = await prisma.logs_sistema.findMany({
      take: 10,
      orderBy: { data: 'desc' }
    });

    return NextResponse.json({
      smtp: {
        configurado: smtpConfigurado,
        online: smtpOnline,
        host: process.env.SMTP_HOST || 'Não configurado'
      },
      logs
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}