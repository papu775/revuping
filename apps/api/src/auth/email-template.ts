const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
export function emailTemplate(verify: boolean, link: string) {
  const title = verify ? 'Verify your email' : 'Reset your password';
  const action = verify ? 'Verify email' : 'Reset password';
  const expiry = verify ? '24 hours' : '30 minutes';
  const copy = verify
    ? 'Welcome to RevuPing. Confirm your email to start setting up your business.'
    : 'We received a request to reset your RevuPing password. Choose a new password using the secure link below.';
  const text = `RevuPing\n\n${title}\n${copy}\n\n${action}: ${link}\n\nThis link expires in ${expiry} and can be used once. If you did not request this, ignore this email. Never share this link.\n\nRevuPing · Your business, your reputation.`;
  // Table markup, system fonts and inline styles keep this readable without images.
  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>${title}</title></head><body style="margin:0;background:#f5f3fa;color:#24213b;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #e6e1ef;border-radius:16px"><tr><td style="padding:32px"><p style="margin:0 0 32px;font-size:25px;font-weight:bold;letter-spacing:-1px"><span style="color:#7856ff">▥</span> revu<span style="color:#7856ff">ping.</span></p><h1 style="font-size:26px;line-height:1.25;margin:0 0 16px">${title}</h1><p style="font-size:16px;line-height:1.6;color:#625c78;margin:0 0 28px">${copy}</p><table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#7856ff" style="border-radius:8px"><a href="${escape(link)}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:15px 24px">${action}</a></td></tr></table><p style="font-size:14px;line-height:1.6;color:#625c78;margin:28px 0 16px">This link expires in ${expiry} and can be used once. If you did not request this, ignore this email. Never share this link.</p><p style="font-size:12px;line-height:1.6;color:#625c78">Button not working? Copy this link into your browser:<br><a href="${escape(link)}" style="color:#6841d9;word-break:break-all">${escape(link)}</a></p></td></tr><tr><td style="padding:20px 32px;border-top:1px solid #e6e1ef;font-size:12px;line-height:1.6;color:#625c78">RevuPing · Your business, your reputation.<br>This is an account security message.</td></tr></table></td></tr></table></body></html>`;
  return { text, html };
}
