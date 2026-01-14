import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true para porta 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendDailyReport = async (to, data) => {
  // Template HTML do E-mail (Estilo Pillar Finance)
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">Pillar<span style="color: #818cf8;">Finance</span></h1>
        <p style="color: #94a3b8; margin-top: 5px; font-size: 12px;">RESUMO DIÁRIO</p>
      </div>
      
      <div style="padding: 24px; background-color: #fff;">
        <h2 style="color: #1e293b; margin-top: 0;">Olá, Gestor!</h2>
        <p style="color: #475569;">Aqui está o resumo das movimentações do mês atual.</p>
        
        <div style="display: flex; gap: 10px; margin: 20px 0;">
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; flex: 1;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">TOTAL PAGO</p>
            <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #10b981;">${data.totalPago}</p>
          </div>
          <div style="background: #fff7ed; padding: 15px; border-radius: 8px; flex: 1;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">PENDENTE</p>
            <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #f97316;">${data.totalPendente}</p>
          </div>
        </div>

        <h3 style="color: #334155; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Pendências Urgentes</h3>
        <ul style="padding-left: 20px; color: #475569;">
          ${data.itensPendentes.map(item => `<li><strong>${item.data}</strong> - ${item.descricao}: ${item.valor}</li>`).join('') || '<li>Nenhuma pendência!</li>'}
        </ul>
      </div>

      <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
        © 2026 Pillar Finance. Enviado automaticamente.
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Pillar Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
    html: htmlContent,
  });
};