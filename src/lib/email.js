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
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Função para renderizar as linhas da tabela com lógica de urgência
  const renderRows = (itens, corValor) => {
    if (!itens || itens.length === 0) {
      return `<tr><td colspan="3" style="padding: 25px; text-align: center; color: #94a3b8; font-size: 11px; font-style: italic; background: #fafafa;">Nenhum registro pendente para este período.</td></tr>`;
    }

    return itens.map(item => {
      let isUrgente = false;
      try {
        if (item.data && item.data.includes('/')) {
          const [dia, mes, ano] = item.data.split('/');
          const dataVencimento = new Date(ano, mes - 1, dia);
          isUrgente = dataVencimento <= hoje;
        }
      } catch (e) {
        isUrgente = false;
      }

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 14px 10px;">
            <span style="background-color: ${isUrgente ? '#fee2e2' : '#f1f5f9'}; 
                         color: ${isUrgente ? '#ef4444' : '#64748b'}; 
                         padding: 5px 10px; border-radius: 6px; font-size: 10px; font-weight: 800; border: 1px solid ${isUrgente ? '#fecaca' : '#e2e8f0'}; white-space: nowrap;">
              ${item.data || 'S/ DATA'}
            </span>
          </td>
          <td style="padding: 14px 10px; font-size: 12px; color: #1e293b; font-weight: 600; text-transform: uppercase;">
            ${item.descricao || 'SEM DESCRIÇÃO'}
          </td>
          <td style="padding: 14px 10px; font-size: 14px; color: ${corValor}; font-weight: 800; text-align: right; white-space: nowrap;">
            ${item.valor}
          </td>
        </tr>
      `;
    }).join('');
  };

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">
          Montranel <span style="color: #10b981;">Finance</span>
        </h1>
        <div style="display: inline-block; margin-top: 12px; padding: 6px 18px; background: rgba(16, 185, 129, 0.1); border-radius: 50px; border: 1px solid rgba(16, 185, 129, 0.2);">
          <span style="color: #10b981; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Auditoria Diária de Fluxo</span>
        </div>
      </div>

      <div style="padding: 30px;">
        
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 35px;">
          <tr>
            <td width="50%" style="padding-right: 10px;">
              <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 18px; border-radius: 16px; text-align: center;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; color: #16a34a; text-transform: uppercase;">Recebido (Mês)</p>
                <p style="margin: 5px 0 0; font-size: 18px; font-weight: 900; color: #065f46;">${data.totalRecebido}</p>
              </div>
            </td>
            <td width="50%" style="padding-left: 10px;">
              <div style="background: #fff1f2; border: 1px solid #ffe4e6; padding: 18px; border-radius: 16px; text-align: center;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; color: #e11d48; text-transform: uppercase;">A Pagar (Saídas)</p>
                <p style="margin: 5px 0 0; font-size: 18px; font-weight: 900; color: #9f1239;">${data.totalPendente}</p>
              </div>
            </td>
          </tr>
        </table>

        <h3 style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; font-weight: 800;">📥 Recebimentos Pendentes</h3>
        <table width="100%" cellspacing="0" style="border-collapse: collapse; margin-bottom: 40px; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
          <thead style="background-color: #f8fafc;">
            <tr>
              <th style="text-align: left; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase;">Vencimento</th>
              <th style="text-align: left; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase;">Descrição</th>
              <th style="text-align: right; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase;">Valor</th>
            </tr>
          </thead>
          <tbody>${renderRows(data.entradasPendentes, '#16a34a')}</tbody>
        </table>

        <h3 style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 15px; font-weight: 800;">📤 Contas a Pagar (Saídas)</h3>
        <table width="100%" cellspacing="0" style="border-collapse: collapse; margin-bottom: 10px; border: 1px solid #f1f5f9; border-radius: 12px; overflow: hidden;">
          <thead style="background-color: #f8fafc;">
            <tr>
              <th style="text-align: left; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase;">Vencimento</th>
              <th style="text-align: left; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase;">Descrição</th>
              <th style="text-align: right; padding: 12px; font-size: 10px; color: #64748b; text-transform: uppercase;">Valor</th>
            </tr>
          </thead>
          <tbody>${renderRows(data.saidasPendentes, '#e11d48')}</tbody>
        </table>

        <div style="text-align: center; margin-top: 45px;">
          <a href="https://pillar-finance-seven.vercel.app" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">Abrir Painel Montranel</a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 9px; color: #94a3b8; font-weight: bold; line-height: 1.6; text-transform: uppercase;">
          Este relatório é gerado automaticamente para Raul e Pillar IT.<br/>
          Confidencial • Montranel Finance © 2026
        </p>
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"Montranel Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊Montranel - ${new Date().toLocaleDateString('pt-BR')}`,
    html: htmlContent,
  });
};