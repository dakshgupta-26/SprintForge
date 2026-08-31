import { Resend } from 'resend';

// ─── Resend HTTPS Email Configuration ──────────────────────────────────────────
// Communicates over standard outbound HTTPS (Port 443) to https://api.resend.com.
// This completely resolves Render's outbound SMTP port blocking (ports 25, 465, 587).

function getResendClient(): { client: Resend | null; from: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const fromEmail = process.env.EMAIL_FROM?.trim() || 'SprintForge <onboarding@resend.dev>';

  if (!apiKey || !apiKey.startsWith('re_')) {
    return { client: null, from: fromEmail };
  }

  return { client: new Resend(apiKey), from: fromEmail };
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
                  <td style="height:4px;background:linear-gradient(90deg,#7c3aed,#6366f1,#3b82f6);"></td>
                </tr>
              </table>

              <!-- Body Content -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 36px;">
                <tr>
                  <td>
                    <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0 0 12px;line-height:1.3;letter-spacing:-0.3px;">
                      Verify your email address 🔐
                    </h1>

                    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Hello <strong style="color:#f1f5f9;">${opts.name || 'there'}</strong>,<br/>
                      Please use the following 6-digit verification code to complete your registration and activate your SprintForge workspace account.
                    </p>

                    <!-- OTP Display Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:#070a18;border:2px dashed #7c3aed;border-radius:16px;padding:24px 16px;text-align:center;">
                          <p style="color:#a78bfa;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;">
                            Your One-Time Verification Code
                          </p>
                          <p style="color:#ffffff;font-size:40px;font-weight:900;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;letter-spacing:10px;margin:0 0 8px;text-shadow:0 0 20px rgba(124,58,237,0.5);">
                            ${opts.otp}
                          </p>
                          <p style="color:#64748b;font-size:12px;margin:0;">
                            ⏱️ Valid for <strong>10 minutes</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Alert Callout -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:14px 16px;">
                          <p style="color:#cbd5e1;font-size:12px;line-height:1.5;margin:0;">
                            🔒 <strong>Security tip:</strong> SprintForge will never ask for your password or verification code in an unsolicited email or message. Never share this code with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#64748b;font-size:12px;line-height:1.6;margin:0;">
                      If you didn't create an account on SprintForge, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);background:#0a0e22;">
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

Your 6-digit verification code is:

${opts.otp}

This code expires in 10 minutes.

If you did not request this verification, you can safely ignore this email.
`.trim();

  return { html, text };
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

// ─── Helper: Send Email via Resend HTTPS API ──────────────────────────────────
async function sendViaResend(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { client, from } = getResendClient();

  if (!client) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[Resend DEV SIMULATION] ──────────────────────────────────`);
      console.log(`To: ${msg.to}`);
      console.log(`From: ${from}`);
      console.log(`Subject: ${msg.subject}`);
      console.log(`Note: Valid RESEND_API_KEY starting with "re_" not configured in .env.`);
      console.log(`──────────────────────────────────────────────────────────\n`);
      return { success: true, messageId: 'simulated_dev_id' };
    }
    const errMsg = 'RESEND_API_KEY is not configured on the server. Please configure RESEND_API_KEY in Render environment variables.';
    console.error(`❌ Resend Error: ${errMsg}`);
    return { success: false, error: errMsg };
  }

  try {
    console.log(`📧 [Resend HTTPS] Dispatching email to ${msg.to} (Subject: "${msg.subject}")...`);
    const { data, error } = await client.emails.send({
      from,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });

    if (error) {
      console.error(`❌ [Resend HTTPS Error]: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ [Resend] Email successfully accepted (messageId: ${data?.id})`);
    return { success: true, messageId: data?.id };
  } catch (err: any) {
    console.error(`❌ [Resend API Request failed]: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// ─── Exported Email Service Methods ───────────────────────────────────────────

/**
 * Sends a 6-digit OTP verification email via Resend HTTPS REST API.
 */
export async function sendOtpEmail(opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { html, text } = buildOtpEmail({
    name: opts.name,
    otp: opts.otp,
    recipientEmail: opts.to,
  });

  return sendViaResend({
    to: opts.to,
    subject: `Verify your SprintForge account: ${opts.otp} 🔐`,
    html,
    text,
  });
}

/**
 * Alias for sendOtpEmail to provide standard verification naming.
 */
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  otp: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendOtpEmail(opts);
}

/**
 * Sends a password reset link email via Resend HTTPS REST API.
 */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { html, text } = buildPasswordResetEmail({
    name: opts.name,
    resetUrl: opts.resetUrl,
    recipientEmail: opts.to,
  });

  return sendViaResend({
    to: opts.to,
    subject: `Reset your SprintForge password 🔒`,
    html,
    text,
  });
}

/**
 * Sends a project invite email with join code and accept URL via Resend HTTPS REST API.
 */
export async function sendInviteEmail(opts: {
  to: string;
  inviterName: string;
  projectName: string;
  projectColor: string;
  role: string;
  acceptUrl: string;
  joinCode: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const joinPageUrl = `${clientUrl}/join`;

  const { html, text } = buildInviteEmail({
    ...opts,
    joinPageUrl,
    recipientEmail: opts.to,
  });

  return sendViaResend({
    to: opts.to,
    subject: `You're invited to join ${opts.projectName} on SprintForge 🚀`,
    html,
    text,
  });
}
