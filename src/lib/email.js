import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT);

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendDailyReport = async (to, data) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7fa; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      
      <div style="background-color: #0f172a; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: -1px; text-transform: uppercase;">
          Montranel <span style="color: #10b981;">Finance</span>
        </h1>
        <p style="color: #94a3b8; margin: 5px 0 0; font-size: 10px; font-weight: bold; tracking: 2px; text-transform: uppercase;">Relatório de Auditoria Diária</p>
      </div>

      <div style="padding: 25px; background-color: #ffffff;">
        <h2 style="color: #1e293b; font-size: 16px; margin-bottom: 20px;">Resumo Financeiro - ${new Date().toLocaleDateString('pt-BR')}</h2>

        <div style="margin-bottom: 30px;">
          <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 15px; border-radius: 12px; margin-bottom: 10px;">
            <span style="font-size: 10px; font-weight: bold; color: #16a34a; text-transform: uppercase;">Total Recebido (Mês)</span>
            <div style="font-size: 20px; font-weight: 900; color: #16a34a;">${data.totalRecebido}</div>
          </div>
          <div style="background: #fff1f2; border: 1px solid #ffe4e6; padding: 15px; border-radius: 12px;">
            <span style="font-size: 10px; font-weight: bold; color: #e11d48; text-transform: uppercase;">Total em Aberto (Saídas)</span>
            <div style="font-size: 20px; font-weight: 900; color: #e11d48;">${data.totalPendente}</div>
          </div>
        </div>

        <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">📥 Recebimentos Pendentes</h3>
        <div style="margin-bottom: 25px;">
          ${data.entradasPendentes.length > 0 ? data.entradasPendentes.map(item => `
            <div style="padding: 12px; border-bottom: 1px solid #f8fafc; display: flex; justify-content: space-between;">
              <div style="font-size: 13px; color: #1e293b;">
                <span style="color: #94a3b8; font-weight: bold; font-size: 11px;">${item.data}</span><br/>
                <strong>${item.descricao}</strong>
              </div>
              <div style="color: #16a34a; font-weight: bold; font-size: 14px; text-align: right;">${item.valor}</div>
            </div>
          `).join('') : '<p style="font-size: 12px; color: #cbd5e1; text-align: center;">Nenhum recebimento pendente.</p>'}
        </div>

        <h3 style="font-size: 12px; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">📤 Contas a Pagar</h3>
        <div>
          ${data.saidasPendentes.length > 0 ? data.saidasPendentes.map(item => `
            <div style="padding: 12px; border-bottom: 1px solid #f8fafc; display: flex; justify-content: space-between;">
              <div style="font-size: 13px; color: #1e293b;">
                <span style="color: #94a3b8; font-weight: bold; font-size: 11px;">${item.data}</span><br/>
                <strong>${item.descricao}</strong>
              </div>
              <div style="color: #e11d48; font-weight: bold; font-size: 14px; text-align: right;">${item.valor}</div>
            </div>
          `).join('') : '<p style="font-size: 12px; color: #cbd5e1; text-align: center;">Nenhuma conta pendente.</p>'}
        </div>

        <div style="margin-top: 35px; text-align: center;">
          <a href="https://pillar-finance-seven.vercel.app" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 11px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">Acessar Sistema</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8;">
        SISTEMA DE GESTÃO MONTRANEL FINANCE<br/>
        © 2026 PILLAR IT - PROCESSAMENTO AUTOMÁTICO
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"Montranel Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Auditoria Montranel - ${new Date().toLocaleDateString('pt-BR')}`,
    html: htmlContent,
  });
};