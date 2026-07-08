// SendGrid mail delivery. Requires SENDGRID_API_KEY; sender defaults to the
// deckranker.com domain and can be overridden with MAIL_FROM_EMAIL / MAIL_FROM_NAME.

const FROM_EMAIL = process.env.MAIL_FROM_EMAIL ?? "no-reply@deckranker.com";
const FROM_NAME = process.env.MAIL_FROM_NAME ?? "DeckRanker";

export function isMailerConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    // Dev fallback: surface the email in server logs so flows stay testable.
    console.warn(
      `[mailer] SENDGRID_API_KEY not set — email to ${opts.to} not sent.\nSubject: ${opts.subject}\n${opts.text ?? opts.html}`,
    );
    return;
  }
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: opts.subject,
      content: [
        ...(opts.text ? [{ type: "text/plain", value: opts.text }] : []),
        { type: "text/html", value: opts.html },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SendGrid ${res.status}: ${body.slice(0, 300)}`);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(title: string, body: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0b1120;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 24px;">
    <div style="font-size:18px;font-weight:600;color:#e2e8f0;margin-bottom:24px;">
      Deck<span style="color:#10b981;">Ranker</span>
    </div>
    <div style="background:#111827;border:1px solid #1e293b;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#e2e8f0;">${title}</h1>
      ${body}
    </div>
    <p style="color:#64748b;font-size:12px;margin-top:24px;">
      DeckRanker · Investor pattern intelligence · deckranker.com
    </p>
  </div>
</body></html>`;
}

export async function sendLoginCodeEmail(to: string, code: string) {
  await sendMail({
    to,
    subject: `${code} is your DeckRanker verification code`,
    text: `Your DeckRanker verification code is ${code}. It expires in 10 minutes. If you didn't try to sign in, you can ignore this email.`,
    html: emailShell(
      "Verify your sign-in",
      `<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 20px;">
         Use this code to finish signing in. It expires in <strong style="color:#e2e8f0;">10 minutes</strong>.
       </p>
       <div style="background:#0b1120;border:1px solid #1e293b;border-radius:12px;padding:20px;text-align:center;">
         <span style="font-size:32px;letter-spacing:10px;font-weight:700;color:#10b981;font-family:ui-monospace,Menlo,monospace;">${code}</span>
       </div>
       <p style="color:#64748b;font-size:12px;line-height:1.6;margin:20px 0 0;">
         If you didn't try to sign in to DeckRanker, ignore this email — your account stays locked without this code.
       </p>`,
    ),
  });
}

export async function sendOrgInviteEmail(opts: {
  to: string;
  orgName: string;
  inviterName: string;
  acceptUrl: string;
}) {
  const orgName = escapeHtml(opts.orgName);
  const inviterName = escapeHtml(opts.inviterName);
  await sendMail({
    to: opts.to,
    subject: `${opts.inviterName} invited you to ${opts.orgName} on DeckRanker`,
    text: `${opts.inviterName} invited you to join "${opts.orgName}" on DeckRanker. Accept the invite: ${opts.acceptUrl}`,
    html: emailShell(
      `Join ${orgName}`,
      `<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 24px;">
         <strong style="color:#e2e8f0;">${inviterName}</strong> invited you to the
         <strong style="color:#e2e8f0;">${orgName}</strong> organization on DeckRanker.
         You'll share one deal dashboard: everyone can add decks, record invest/pass decisions, and track outcomes together.
       </p>
       <a href="${opts.acceptUrl}" style="display:inline-block;background:#10b981;color:#0b1120;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
         Accept invitation
       </a>
       <p style="color:#64748b;font-size:12px;line-height:1.6;margin:24px 0 0;">
         This invite expires in 14 days. If you weren't expecting it, you can ignore this email.
       </p>`,
    ),
  });
}
