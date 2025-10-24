export const wrap = (title, inner) => `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif;max-width:560px;margin:24px auto;padding:24px;border:1px solid #eee;border-radius:12px">
    <h2 style="margin:0 0 12px">${title}</h2>
    <div style="color:#333;font-size:15px;line-height:1.5">${inner}</div>
    <p style="color:#999;font-size:12px;margin-top:24px">© ${new Date().getFullYear()} Happenly</p>
  </div>
`;

export const eventApplied = ({ userName, eventTitle, dateStr, location }) =>
  wrap('Application Received', `
    <p>Hi ${userName || 'there'},</p>
    <p>Thanks for applying to <b>${eventTitle}</b>.</p>
    <p><b>Date:</b> ${dateStr}<br/>
       <b>Location:</b> ${location || 'TBA'}</p>
  `);

export const eventCreated = ({ eventTitle, dateStr, location }) =>
  wrap('Event Created', `
    <p>Your event <b>${eventTitle}</b> has been created.</p>
    <p><b>Date:</b> ${dateStr}<br/>
       <b>Location:</b> ${location || 'TBA'}</p>
  `);
