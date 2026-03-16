export const sendDailyReport = async (to, data) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Função interna para gerar as linhas da tabela com lógica de urgência
  const renderRows = (itens, corValor) => {
    if (!itens || itens.length === 0) {
      return `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; font-style: italic;">Nenhum registro para este período.</td></tr>`;
    }

    return itens.map(item => {
      // Lógica de Urgência: Converte string "DD/MM/AAAA" para objeto Date para comparar
      const [dia, mes, ano] = item.data.split('/');
      const dataVencimento = new Date(ano, mes - 1, dia);
      const isUrgente = dataVencimento <= hoje;

      return `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px 10px;">
            <span style="background-color: ${isUrgente ? '#fee2e2' : '#f1f5f9'}; 
                         color: ${isUrgente ? '#ef4444' : '#64748b'}; 
                         padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; border: 1px solid ${isUrgente ? '#fecaca' : '#e2e8f0'};">
              ${item.data}
            </span>
          </td>
          <td style="padding: 12px 10px; font-size: 13px; color: #1e293b; font-weight: 600; text-transform: uppercase;">
            ${item.descricao}
          </td>
          <td style="padding: 12px 10px; font-size: 14px; color: ${corValor}; font-weight: 800; text-align: right; white-space: nowrap;">
            ${item.valor}
          </td>
        </tr>
      `;
    }).join('');
  };

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 35px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; italic">
          Montranel <span style="color: #10b981;">Finance</span>
        </h1>
        <div style="display: inline-block; margin-top: 10px; padding: 5px 15px; background: rgba(16, 185, 129, 0.1); border-radius: 50px; border: 1px solid rgba(16, 185, 129, 0.2);">
          <span style="color: #10b981; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Auditoria de Fluxo Real</span>
        </div>
      </div>

      <div style="padding: 30px;">
        
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
          <tr>
            <td width="50%" style="padding-right: 10px;">
              <div style="background: #f0fdf4; border: 1px solid #dcfce7; padding: 15px; border-radius: 14px; text-align: center;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; color: #16a34a; text-transform: uppercase;">Recebido (Mês)</p>
                <p style="margin: 5px 0 0; font-size: 18px; font-weight: 900; color: #065f46;">${data.totalRecebido}</p>
              </div>
            </td>
            <td width="50%" style="padding-left: 10px;">
              <div style="background: #fff1f2; border: 1px solid #ffe4e6; padding: 15px; border-radius: 14px; text-align: center;">
                <p style="margin: 0; font-size: 10px; font-weight: 800; color: #e11d48; text-transform: uppercase;">Pendente (Saídas)</p>
                <p style="margin: 5px 0 0; font-size: 18px; font-weight: 900; color: #9f1239;">${data.totalPendente}</p>
              </div>
            </td>
          </tr>
        </table>

        <h3 style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center;">
          📥 Recebimentos Pendentes
        </h3>
        <table width="100%" cellspacing="0" style="border-collapse: collapse; margin-bottom: 35px;">
          <thead style="background-color: #f8fafc;">
            <tr>
              <th style="text-align: left; padding: 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Data</th>
              <th style="text-align: left; padding: 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Descrição</th>
              <th style="text-align: right; padding: 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${renderRows(data.entradasPendentes, '#16a34a')}
          </tbody>
        </table>

        <h3 style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
          📤 Contas a Pagar
        </h3>
        <table width="100%" cellspacing="0" style="border-collapse: collapse; margin-bottom: 30px;">
          <thead style="background-color: #f8fafc;">
            <tr>
              <th style="text-align: left; padding: 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Data</th>
              <th style="text-align: left; padding: 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Descrição</th>
              <th style="text-align: right; padding: 10px; font-size: 10px; color: #94a3b8; text-transform: uppercase;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${renderRows(data.saidasPendentes, '#e11d48')}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 40px;">
          <a href="https://pillar-finance-seven.vercel.app" 
             style="background-color: #0f172a; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
            Abrir Painel Montranel
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: bold; line-height: 1.5;">
          ESTE RELATÓRIO FOI GERADO AUTOMATICAMENTE PELA INFRAESTRUTURA PILLAR IT.<br/>
          CONFIDENCIAL • MONTRANEL FINANCE © 2026
        </p>
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"Montranel Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `📊Montranel Finance - ${new Date().toLocaleDateString('pt-BR')}`,
    html: htmlContent,
  });
};