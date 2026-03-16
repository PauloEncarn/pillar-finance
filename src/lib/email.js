import nodemailer from 'nodemailer';

// Ajuste automático de segurança baseado na porta
const smtpPort = Number(process.env.SMTP_PORT);
const isSecure = smtpPort === 465;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: isSecure, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Dica de infra: Adiciona timeout para não travar a API se o SMTP demorar
  connectionTimeout: 10000, 
});

export const sendDailyReport = async (to, data) => {
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #f8fafc;">
      <div style="background-color: #0f172a; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -1px; text-transform: uppercase;">Pillar<span style="color: #10b981;">Finance</span></h1>
        <p style="color: #94a3b8; margin-top: 5px; font-size: 10px; font-weight: bold; tracking: 2px;">AUDITORIA DIÁRIA DE FLUXO</p>
      </div>
      
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 18px;">Olá, Raul!</h2>
        <p style="color: #475569; font-size: 14px;">Seguem as movimentações consolidadas para conferência na <strong>Montranel</strong>.</p>
        
        <table width="100%" cellspacing="0" cellpadding="0" style="margin: 25px 0;">
          <tr>
            <td style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7;">
              <p style="margin: 0; font-size: 10px; font-weight: bold; color: #166534; text-transform: uppercase;">Total Pago</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: 900; color: #10b981;">${data.totalPago}</p>
            </td>
            <td width="15"></td>
            <td style="background: #fff7ed; padding: 20px; border-radius: 12px; border: 1px solid #ffedd5;">
              <p style="margin: 0; font-size: 10px; font-weight: bold; color: #9a3412; text-transform: uppercase;">Pendente</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: 900; color: #f97316;">${data.totalPendente}</p>
            </td>
          </tr>
        </table>

        <h3 style="color: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">Atenção às Pendências</h3>
        <div style="color: #475569; font-size: 13px; line-height: 1.6;">
          ${data.itensPendentes.length > 0 
            ? data.itensPendentes.map(item => `
                <div style="padding: 10px; border-bottom: 1px solid #f8fafc;">
                  <span style="color: #94a3b8; font-weight: bold;">${item.data}</span> — 
                  <span style="color: #1e293b; font-weight: bold;">${item.descricao}</span>: 
                  <span style="color: #ef4444;">${item.valor}</span>
                </div>
              `).join('') 
            : '<p style="text-align: center; color: #cbd5e1;">Nenhuma pendência crítica hoje.</p>'}
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
           <a href="https://finance.pillarit.com.br" style="background-color: #0f172a; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; display: inline-block;">ACESSAR PAINEL DE GESTÃO</a>
        </div>
      </div>

      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 10px; color: #94a3b8; font-weight: bold;">
        ESTE É UM E-MAIL AUTOMÁTICO DE SEGURANÇA DA PILLAR IT.<br>
        © 2026 MONTRANEL SYSTEMS.
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"Pillar Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊 Relatório Diário - ${new Date().toLocaleDateString('pt-BR')}`,
    html: htmlContent,
  });
};