import nodemailer from 'nodemailer';

// ─── Transporter ───────────────────────────────────────────────────────────────
// Uses env vars if set (SendGrid, custom SMTP), falls back to Ethereal for dev
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Production SMTP (e.g. SendGrid, Mailgun, custom)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    // Development: Ethereal (catches emails, viewable at ethereal.email)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log('📧 Ethereal email account:', testAccount.user);
    console.log('📧 Preview emails at: https://ethereal.email');
  }

  return transporter;
}

// ─── Email Template ────────────────────────────────────────────────────────────
function buildInviteEmail(opts: {
  inviterName: string;
  projectName: string;
  projectColor: string;
  role: string;
  acceptUrl: string;
  recipientEmail: string;
}) {
  const roleColors: Record<string, string> = {
    admin: '#f59e0b',
    member: '#6366f1',
    viewer: '#64748b',
  };
  const roleColor = roleColors[opts.role] || '#6366f1';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're invited to ${opts.projectName}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo row -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#6366f1;border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:20px;line-height:40px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">SprintForge</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a24;border:1px solid #2a2a3a;border-radius:20px;overflow:hidden;">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899);"></td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px;">
                <tr>
                  <td>
                    <!-- Project avatar -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:${opts.projectColor};border-radius:14px;width:54px;height:54px;text-align:center;vertical-align:middle;">
                          <span style="color:#fff;font-size:22px;font-weight:800;">${opts.projectName.charAt(0).toUpperCase()}</span>
                        </td>
                      </tr>
                    </table>

                    <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0 0 12px;line-height:1.3;">
                      You're invited to collaborate! 🚀
                    </h1>

                    <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      <strong style="color:#e2e8f0;">${opts.inviterName}</strong> has invited you to join
                      <strong style="color:#e2e8f0;">${opts.projectName}</strong> on SprintForge — the modern
                      Agile platform for high-performing teams.
                    </p>

                    <!-- Role badge -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:${roleColor}18;border:1px solid ${roleColor}40;border-radius:8px;padding:10px 16px;">
                          <span style="color:${roleColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">
                            Your role: ${opts.role.charAt(0).toUpperCase() + opts.role.slice(1)}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
                          <a href="${opts.acceptUrl}"
                             style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="height:1px;background:#2a2a3a;"></td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0 0 8px;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin:0;">
                      <a href="${opts.acceptUrl}" style="color:#6366f1;font-size:12px;word-break:break-all;">
                        ${opts.acceptUrl}
                      </a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 40px;border-top:1px solid #2a2a3a;">
                <tr>
                  <td>
                    <p style="color:#475569;font-size:11px;margin:0;line-height:1.5;">
                      This invitation was sent to <strong>${opts.recipientEmail}</strong>.
                      If you weren't expecting this, you can safely ignore this email.
                      Sent by <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="color:#6366f1;text-decoration:none;">SprintForge</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
You've been invited to join ${opts.projectName} on SprintForge!

${opts.inviterName} has invited you to collaborate as a ${opts.role}.

Accept your invitation: ${opts.acceptUrl}

If you weren't expecting this, you can safely ignore this email.
`.trim();

  return { html, text };
}

// ─── Send Invite Email ─────────────────────────────────────────────────────────
export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  projectName: string;
  projectColor: string;
  role: string;
  acceptUrl: string;
}) {
  try {
    const t = await getTransporter();
    const { html, text } = buildInviteEmail({
      ...opts,
      recipientEmail: opts.to,
    });

    const info = await t.sendMail({
      from: `"SprintForge" <${process.env.SMTP_FROM || 'noreply@sprintforge.io'}>`,
      to: opts.to,
      subject: `You're invited to join ${opts.projectName} on SprintForge 🚀`,
      html,
      text,
    });

    // In dev, print Ethereal preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Email preview: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('❌ Email send failed:', err);
    return { success: false };
  }
}
