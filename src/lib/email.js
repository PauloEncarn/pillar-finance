import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT);

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465, // True para 465, false para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // ATIVAÇÃO DE DEBUG PARA ANALISTA DE SISTEMAS
  debug: true, 
  logger: true 
});

export const sendDailyReport = async (to, data) => {
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">Pillar <span style="color: #10b981;">Finance</span></h1>
      </div>
      <div style="padding: 20px;">
        <h2>Resumo de Pendências</h2>
        <p>Total Pago: <strong>${data.totalPago}</strong></p>
        <p>Total Pendente: <strong style="color: #f97316;">${data.totalPendente}</strong></p>
        <hr style="border: 1px solid #f1f5f9;" />
        <ul>
          ${data.itensPendentes.map(i => `<li>${i.descricao}: ${i.valor}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;

  // Retornamos a promessa para capturar o erro na rota
  return await transporter.sendMail({
    from: `"Pillar IT Support" <${process.env.SMTP_USER}>`,
    to,
    subject: `DEBUG - Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
    html: htmlContent,
  });
};