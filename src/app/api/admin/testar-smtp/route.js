import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { host, port, user, pass } = await request.json();

    let transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465, // true para 465, false para outras
      auth: { user, pass },
    });

    // O comando verify() testa se a conexão e autenticação estão OK
    await transporter.verify();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}