import nodemailer from 'nodemailer';

// ─── Environment Helpers ──────────────────────────────────────────────────────
function cleanEnvValue(val?: string): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

function cleanAppPassword(val?: string): string {
  if (!val) return '';
  // Strip outer quotes and any internal whitespace (e.g. "xxxx xxxx xxxx xxxx" -> "xxxxxxxxxxxxxxxx")
  return val.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, '');
}

export interface SmtpCredentials {
  user: string;
  pass: string;
  host: string;
  port: number;
  secure: boolean;
  fromEmail: string;
  fromName: string;
  isConfigured: boolean;
}

export function resolveSmtpConfig(): SmtpCredentials {
  const user = cleanEnvValue(process.env.GMAIL_USER || process.env.SMTP_USER);
  const pass = cleanAppPassword(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS);
  const host = cleanEnvValue(process.env.SMTP_HOST) || 'smtp.gmail.com';
  const customPort = parseInt(cleanEnvValue(process.env.SMTP_PORT), 10);

  // Preferred production config for Gmail on Railway / Cloud:
  // Port 465 with direct SSL/TLS (secure: true) avoids port 587 STARTTLS round-trip issues and IPv6 hangs
  const isGmail = host === 'smtp.gmail.com' || cleanEnvValue(process.env.SMTP_SERVICE) === 'gmail' || user.endsWith('@gmail.com');
  const port = isGmail ? (customPort || 465) : (customPort || 587);
  const secure = isGmail
    ? (process.env.SMTP_SECURE === 'false' ? false : (port === 465))
    : (process.env.SMTP_SECURE === 'true' || port === 465);

  const fromEmail = cleanEnvValue(process.env.SMTP_FROM) || user || 'noreply@sprintforge.io';
  const fromName = cleanEnvValue(process.env.SMTP_FROM_NAME) || 'SprintForge';

  return {
    user,
    pass,
    host,
    port,
    secure,
    fromEmail,
    fromName,
    isConfigured: Boolean(user && pass),
  };
}

// ─── Error Diagnostics (Sanitized - Never Logs Secrets) ───────────────────────
export function sanitizeEmailError(err: any): { category: string; message: string; safeDiagnostic: string } {
  const rawMessage = (err?.message || '').toLowerCase();
  const code = (err?.code || '').toUpperCase();
  const responseCode = err?.responseCode;

  if (
    code === 'EAUTH' ||
    responseCode === 535 ||
    rawMessage.includes('invalid login') ||
    rawMessage.includes('badcredentials') ||
    rawMessage.includes('username and password not accepted') ||
    rawMessage.includes('application-specific password required')
  ) {
    return {
      category: 'SMTP_AUTH_FAILED',
      message: 'SMTP authentication failed. Please verify the Gmail App Password.',
      safeDiagnostic: 'Email authentication failed',
    };
  }

  if (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKETTIMEDOUT' ||
    rawMessage.includes('timed out') ||
    rawMessage.includes('timeout')
  ) {
    return {
      category: 'SMTP_CONNECTION_TIMEOUT',
      message: 'SMTP connection timed out.',
      safeDiagnostic: 'SMTP connection timed out',
    };
  }

  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'EHOSTUNREACH' ||
    code === 'ENETUNREACH'
  ) {
    return {
      category: 'SMTP_CONNECTION_FAILED',
      message: 'Unable to connect to SMTP server.',
      safeDiagnostic: 'Email transport connection failed',
    };
  }

  if (
    code === 'ESOCKET' ||
    rawMessage.includes('tls') ||
    rawMessage.includes('ssl') ||
    rawMessage.includes('certificate') ||
    rawMessage.includes('handshake')
  ) {
    return {
      category: 'SMTP_TLS_FAILED',
      message: 'SMTP TLS handshake failed.',
      safeDiagnostic: 'TLS connection failure',
    };
  }

  if (responseCode === 550 || responseCode === 553 || rawMessage.includes('recipient')) {
    return {
      category: 'SMTP_RECIPIENT_REJECTED',
      message: 'Recipient email was rejected.',
      safeDiagnostic: 'Recipient address rejected',
    };
  }

  if (responseCode === 554 || rawMessage.includes('sender')) {
    return {
      category: 'SMTP_SENDER_REJECTED',
      message: 'Sender email was rejected.',
      safeDiagnostic: 'Gmail rejected sender',
    };
  }

  return {
    category: 'SMTP_GENERAL_FAILURE',
    message: 'Email delivery failed.',
    safeDiagnostic: 'Email delivery failed',
  };
}

// ─── Transporter Singleton ───────────────────────────────────────────────────
let transporter: nodemailer.Transporter | null = null;

export async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const config = resolveSmtpConfig();

  if (config.isConfigured) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
    });
    console.log(`📧 Email service configured: using Gmail SMTP (${config.user})`);
  } else {
    // Development fallback: Ethereal (fake SMTP when no real credentials in .env)
    console.warn('⚠️ GMAIL_USER / GMAIL_APP_PASSWORD not set in environment. Falling back to temporary Ethereal test inbox.');
    try {
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Ethereal createTestAccount timeout')), 4000)
        ),
      ]);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
      console.log('📧 Ethereal test email account:', testAccount.user);
      console.log('📧 Preview emails at: https://ethereal.email');
    } catch (e: any) {
      console.warn('⚠️ Failed to initialize Ethereal test inbox:', e.message);
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return transporter;
}

// ─── Startup Verification ────────────────────────────────────────────────────
export async function verifyEmailTransporter(): Promise<{ success: boolean; message: string }> {
  try {
    const config = resolveSmtpConfig();
    if (!config.isConfigured) {
      console.warn('⚠️ Email service not configured: missing GMAIL_USER or GMAIL_APP_PASSWORD');
      return { success: false, message: 'Missing environment variables' };
    }

    const t = await getTransporter();
    await t.verify();
    console.log('✅ Email service configured: SMTP connection verified');
    return { success: true, message: 'SMTP connection verified' };
  } catch (err: any) {
    const diagnostic = sanitizeEmailError(err);
    console.error(`❌ SMTP verification failed: ${diagnostic.safeDiagnostic}`);
    return { success: false, message: diagnostic.safeDiagnostic };
  }
}

// ─── Safe Health Check Status ─────────────────────────────────────────────────
export async function getEmailHealthStatus(): Promise<{
  configured: boolean;
  provider: string;
  status: 'healthy' | 'degraded' | 'unconfigured';
}> {
  const config = resolveSmtpConfig();
  if (!config.isConfigured) {
    return {
      configured: false,
      provider: 'gmail',
      status: 'unconfigured',
    };
  }

  try {
    const t = await getTransporter();
    await t.verify();
    return {
      configured: true,
      provider: 'gmail',
      status: 'healthy',
    };
  } catch {
    return {
      configured: true,
      provider: 'gmail',
      status: 'degraded',
    };
  }
}

// ─── Safe Send Helper with Sensible Production Timeout ─────────────────────────
async function safeSendMail(
  t: nodemailer.Transporter,
  mailOptions: nodemailer.SendMailOptions,
  timeoutMs = 30000
): Promise<any> {
  return Promise.race([
    t.sendMail(mailOptions),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`SMTP sendMail timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// ─── Invite Email Template ────────────────────────────────────────────────────
function buildInviteEmail(opts: {
  inviterName: string;
  projectName: string;
  projectColor: string;
  role: string;
  acceptUrl: string;
  joinCode: string;
  joinPageUrl: string;
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
  <title>You're invited to ${opts.projectName} on SprintForge</title>
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
                      <strong style="color:#e2e8f0;">${opts.inviterName}</strong> has invited you to join the project
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

                    <!-- ══ JOIN CODE BOX ══ -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#0f0f13;border:2px dashed #6366f1;border-radius:16px;padding:20px;text-align:center;">
                          <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">
                            Your Join Code
                          </p>
                          <p style="color:#6366f1;font-size:36px;font-weight:900;font-family:monospace;letter-spacing:8px;margin:0 0 12px;">
                            ${opts.joinCode}
                          </p>
                          <p style="color:#64748b;font-size:12px;margin:0;line-height:1.5;">
                            Enter this code at<br/>
                            <a href="${opts.joinPageUrl}" style="color:#8b5cf6;text-decoration:none;font-weight:600;">${opts.joinPageUrl}</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider with OR -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="height:1px;background:#2a2a3a;width:45%;vertical-align:middle;"></td>
                        <td style="text-align:center;padding:0 12px;color:#475569;font-size:12px;white-space:nowrap;">OR</td>
                        <td style="height:1px;background:#2a2a3a;width:45%;vertical-align:middle;"></td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
                          <a href="${opts.acceptUrl}"
                             style="display:inline-block;padding:14px 32px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.2px;">
                            Accept Invitation &amp; Join Project →
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
                      If you weren't expecting this, you can safely ignore this email.<br/>
                      This invite expires in 7 days. Sent by <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="color:#6366f1;text-decoration:none;">SprintForge</a>.
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
You've been invited to join ${opts.projectName} on SprintForge! 🚀

${opts.inviterName} has invited you to collaborate as a ${opts.role}.

━━ YOUR JOIN CODE ━━
${opts.joinCode}
Enter this at: ${opts.joinPageUrl}
━━━━━━━━━━━━━━━━━━━

Or click your invite link: ${opts.acceptUrl}

This invite expires in 7 days. If you weren't expecting this, you can safely ignore this email.
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
  joinCode: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const t = await getTransporter();
    const config = resolveSmtpConfig();
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const joinPageUrl = `${clientUrl}/join`;

    const { html, text } = buildInviteEmail({
      ...opts,
      joinPageUrl,
      recipientEmail: opts.to,
    });

    const info = await safeSendMail(t, {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: opts.to,
      subject: `You're invited to join ${opts.projectName} on SprintForge 🚀`,
      html,
      text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Invite Email preview: ${previewUrl}`);
    } else {
      console.log(`📧 Invite sent to ${opts.to} (messageId: ${info?.messageId || 'sent'})`);
    }

    return { success: true, messageId: info?.messageId };
  } catch (err: any) {
    const diagnostic = sanitizeEmailError(err);
    console.error(`❌ Invite email send failed: ${diagnostic.safeDiagnostic}`);
    return { success: false, error: diagnostic.safeDiagnostic };
  }
}

// ─── OTP Email Template ────────────────────────────────────────────────────────
function buildOtpEmail(opts: {
  name: string;
  otp: string;
  recipientEmail: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your SprintForge account</title>
</head>
<body style="margin:0;padding:0;background:#090d1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#090d1e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#6366f1);border-radius:12px;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:20px;line-height:40px;">⚡</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">SprintForge</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#0f142e;border:1px solid rgba(255,255,255,0.1);border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">

              <!-- Gradient Top Accent Bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#7c3aed,#6366f1,#38bdf8);"></td>
                </tr>
              </table>

              <!-- Body Padding -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 28px;">
                <tr>
                  <td>
                    <!-- Verification Badge -->
                    <div style="display:inline-block;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.35);border-radius:9999px;padding:4px 14px;margin-bottom:18px;">
                      <span style="color:#818cf8;font-size:12px;font-weight:700;letter-spacing:0.5px;">🔐 Account Verification</span>
                    </div>

                    <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 10px;letter-spacing:-0.5px;">
                      Your verification code
                    </h1>

                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Hi <strong style="color:#e2e8f0;">${opts.name || 'there'}</strong>,<br/>
                      Use the 6-digit verification code below to complete your authentication with SprintForge.
                    </p>

                    <!-- ══ OTP Code Display Box ══ -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:rgba(99,102,241,0.08);border:2px dashed rgba(99,102,241,0.4);border-radius:16px;padding:24px 20px;text-align:center;">
                          <div style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;">
                            One-Time Security Passcode
                          </div>
                          <div style="color:#ffffff;font-size:40px;font-weight:900;letter-spacing:10px;font-family:'Courier New',Courier,monospace;text-shadow:0 0 20px rgba(99,102,241,0.6);">
                            ${opts.otp}
                          </div>
                          <div style="color:#818cf8;font-size:12px;font-weight:600;margin-top:10px;">
                            ⏱️ Valid for 10 minutes
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Alert Note -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                      <tr>
                        <td style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px 16px;">
                          <p style="color:#fca5a5;font-size:12px;line-height:1.5;margin:0;">
                            🛡️ <strong>Security Tip:</strong> Never share this code with anyone. SprintForge will never ask for your code over chat or call.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0;">
                      If you did not request this verification, you can safely ignore this email. No changes will be made to your account.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:18px 36px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.2);">
                <tr>
                  <td>
                    <p style="color:#475569;font-size:11px;margin:0;line-height:1.5;">
                      Sent to <strong>${opts.recipientEmail}</strong> for account verification.<br/>
                      SprintForge © 2026 • Modern Agile Platform
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
Verify your SprintForge account 🔐

Hello ${opts.name || 'there'},

Your 6-digit one-time verification code is:

${opts.otp}

This code expires in 10 minutes.

If you did not request this verification, you can safely ignore this email.
`.trim();

  return { html, text };
}

// ─── Send OTP Email ───────────────────────────────────────────────────────────
export async function sendOtpEmail(opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const t = await getTransporter();
    const config = resolveSmtpConfig();

    const { html, text } = buildOtpEmail({
      name: opts.name,
      otp: opts.otp,
      recipientEmail: opts.to,
    });

    const info = await safeSendMail(t, {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: opts.to,
      subject: `Verify your SprintForge account: ${opts.otp} 🔐`,
      html,
      text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 OTP Email preview: ${previewUrl}`);
    } else {
      console.log(`📧 OTP sent to ${opts.to} (messageId: ${info?.messageId || 'sent'})`);
    }

    return { success: true, messageId: info?.messageId };
  } catch (err: any) {
    const diagnostic = sanitizeEmailError(err);
    console.error(`❌ OTP email send failed: ${diagnostic.safeDiagnostic}`);
    return { success: false, error: diagnostic.safeDiagnostic };
  }
}

/**
 * Standard alias for sendOtpEmail
 */
export async function sendVerificationOtp(opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendOtpEmail(opts);
}

/**
 * Backward compatibility alias for sendOtpEmail
 */
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendOtpEmail(opts);
}

// ─── Password Reset Email Template ────────────────────────────────────────────
function buildPasswordResetEmail(opts: {
  name: string;
  resetUrl: string;
  recipientEmail: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your SprintForge password</title>
</head>
<body style="margin:0;padding:0;background:#060812;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060812;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg, #7c3aed, #4f46e5);border-radius:14px;width:44px;height:44px;text-align:center;vertical-align:middle;box-shadow:0 0 20px rgba(124,58,237,0.4);">
                    <span style="color:#fff;font-size:22px;line-height:44px;">⚡</span>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">SprintForge</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background:#0d1226;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);">
              <div style="height:4px;background:linear-gradient(90deg, #7c3aed, #6366f1, #38bdf8);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 28px;">
                <tr>
                  <td>
                    <div style="display:inline-block;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:9999px;padding:4px 14px;margin-bottom:16px;">
                      <span style="color:#a78bfa;font-size:12px;font-weight:700;letter-spacing:0.5px;">🔒 Password Reset Request</span>
                    </div>

                    <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 12px;letter-spacing:-0.5px;">
                      Reset your password
                    </h1>

                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Hello <strong style="color:#e2e8f0;">${opts.name || 'there'}</strong>,<br/>
                      We received a request to reset the password for your SprintForge account associated with <strong style="color:#a78bfa;">${opts.recipientEmail}</strong>.
                    </p>

                    <!-- Reset CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center" style="padding:12px 0;">
                          <a href="${opts.resetUrl}" style="display:inline-block;background:linear-gradient(135deg, #7c3aed, #4f46e5);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:14px;box-shadow:0 0 25px rgba(124,58,237,0.5);">
                            Reset My Password →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Direct link backup -->
                    <p style="color:#64748b;font-size:11px;line-height:1.5;margin:0 0 20px;word-break:break-all;">
                      Or copy and paste this link into your browser:<br/>
                      <a href="${opts.resetUrl}" style="color:#818cf8;text-decoration:underline;">${opts.resetUrl}</a>
                    </p>

                    <!-- Security Alert Callout -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                      <tr>
                        <td style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:12px;padding:14px 16px;">
                          <p style="color:#fde68a;font-size:12px;line-height:1.5;margin:0;">
                            ⏱️ <strong>This reset link is valid for 15 minutes</strong> and can only be used once. If you did not request a password reset, please ignore this email or contact support if you have concerns.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);background:#0a0e22;">
                <tr>
                  <td>
                    <p style="color:#475569;font-size:11px;margin:0;line-height:1.5;">
                      Sent to <strong>${opts.recipientEmail}</strong> for password recovery.<br/>
                      SprintForge © 2026 • Modern Agile Platform
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
Reset your SprintForge password 🔒

Hello ${opts.name || 'there'},

We received a request to reset the password for your SprintForge account (${opts.recipientEmail}).

To reset your password, visit the following link (valid for 15 minutes):
${opts.resetUrl}

If you did not request this, you can safely ignore this email.
`.trim();

  return { html, text };
}

// ─── Send Password Reset Email ────────────────────────────────────────────────
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const t = await getTransporter();
    const config = resolveSmtpConfig();

    const { html, text } = buildPasswordResetEmail({
      name: opts.name,
      resetUrl: opts.resetUrl,
      recipientEmail: opts.to,
    });

    const info = await safeSendMail(t, {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: opts.to,
      subject: `Reset your SprintForge password 🔒`,
      html,
      text,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📧 Password Reset Email preview: ${previewUrl}`);
    } else {
      console.log(`📧 Password reset email sent to ${opts.to} (messageId: ${info?.messageId || 'sent'})`);
    }

    return { success: true, messageId: info?.messageId };
  } catch (err: any) {
    const diagnostic = sanitizeEmailError(err);
    console.error(`❌ Password reset email send failed: ${diagnostic.safeDiagnostic}`);
    return { success: false, error: diagnostic.safeDiagnostic };
  }
}

// ─── Send Security Notification Email ─────────────────────────────────────────
export async function sendSecurityEmail(opts: {
  to: string;
  name: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const t = await getTransporter();
    const config = resolveSmtpConfig();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${opts.subject}</title></head>
<body style="margin:0;padding:20px;background:#0f0f13;color:#e2e8f0;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#1a1a24;border-radius:16px;padding:32px;border:1px solid #2a2a3a;">
    <tr><td>
      <h2 style="color:#ffffff;margin:0 0 16px;">Security Notice</h2>
      <p style="color:#94a3b8;font-size:14px;line-height:1.6;">Hi ${opts.name || 'there'},</p>
      <p style="color:#e2e8f0;font-size:14px;line-height:1.6;">${opts.message}</p>
      <p style="color:#64748b;font-size:12px;margin-top:24px;">SprintForge Security Team</p>
    </td></tr>
  </table>
</body>
</html>`;

    const info = await safeSendMail(t, {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html,
      text: opts.message,
    });

    return { success: true, messageId: info?.messageId };
  } catch (err: any) {
    const diagnostic = sanitizeEmailError(err);
    console.error(`❌ Security email send failed: ${diagnostic.safeDiagnostic}`);
    return { success: false, error: diagnostic.safeDiagnostic };
  }
}
