import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "supabase", "email-templates");

const templates = [
  {
    file: "reset-password.html",
    title: "Set your password",
    gradient: ["#1e3a5f", "#1d4ed8", "#60a5fa"],
    accent: "#1d4ed8",
    accentEnd: "#60a5fa",
    icon: "🔑",
    content: `
      {{ if eq .Data.password_email_mode "add" }}
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">Add a password</h1>
        <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.75;">
          Your Google account is connected to <strong style="color:#1d4ed8;">Earth Flow</strong>.<br>
          Add a password to also sign in with<br>
          <strong style="color:#374151;">{{ .Email }}</strong> and a password.
        </p>
      {{ else }}
        <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">Change your password</h1>
        <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.75;">
          We received a password change request<br>
          for your <strong style="color:#1d4ed8;">Earth Flow</strong> account.<br>
          Use the button below to set a new password.
        </p>
      {{ end }}`,
    button: "Set new password",
    href: "{{ .ConfirmationURL }}",
    info: "⏱ This secure link is single-use and expires automatically.",
    footer:
      "If you did not request this, you can safely ignore this email.<br>Your password will remain unchanged.",
  },
  {
    file: "email-change.html",
    title: "Confirm your new email",
    gradient: ["#312e81", "#7c3aed", "#c4b5fd"],
    accent: "#7c3aed",
    accentEnd: "#a78bfa",
    icon: "✉️",
    content: `
      <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">Confirm your new email</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.75;">
        You asked to change the email address<br>
        for your <strong style="color:#7c3aed;">Earth Flow</strong> account to<br>
        <strong style="color:#374151;">{{ .NewEmail }}</strong>.
      </p>`,
    button: "Confirm email change",
    href: "{{ .ConfirmationURL }}",
    info: "✦ Supabase may request confirmation from both email addresses.",
    footer:
      "If you did not request this change, do not use the link.<br>Your email will remain unchanged.",
  },
  {
    file: "password-changed.html",
    title: "Password changed",
    gradient: ["#064e3b", "#059669", "#6ee7b7"],
    accent: "#059669",
    accentEnd: "#34d399",
    icon: "✓",
    content: `
      <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">Password changed</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.75;">
        The password for <strong style="color:#374151;">{{ .Email }}</strong><br>
        was successfully changed.<br>
        Your <strong style="color:#059669;">Earth Flow</strong> account is ready.
      </p>`,
    button: "Open Earth Flow",
    href: "{{ .SiteURL }}",
    info: "✓ No action is needed if you made this change.",
    footer:
      "If this was not you, reset your password immediately<br>and review access to your account.",
  },
  {
    file: "email-changed.html",
    title: "Email changed",
    gradient: ["#7c2d12", "#ea580c", "#fdba74"],
    accent: "#ea580c",
    accentEnd: "#fb923c",
    icon: "↻",
    content: `
      <h1 style="margin:0 0 14px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.03em;line-height:1.2;">Email changed</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#6b7280;line-height:1.75;">
        Your <strong style="color:#ea580c;">Earth Flow</strong> account email changed from<br>
        <strong style="color:#374151;">{{ .OldEmail }}</strong><br>
        to <strong style="color:#374151;">{{ .Email }}</strong>.
      </p>`,
    button: "Open Earth Flow",
    href: "{{ .SiteURL }}",
    info: "✓ This notification confirms the completed email change.",
    footer:
      "If this was not you, secure your account immediately<br>and contact support.",
  },
];

function render(template) {
  const [gradientStart, gradientMiddle, gradientEnd] = template.gradient;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${template.title} — Earth Flow</title>
</head>
<body style="margin:0;padding:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Gradient header -->
          <tr>
            <td style="background:${gradientMiddle};background:linear-gradient(135deg,${gradientStart} 0%,${gradientMiddle} 55%,${gradientEnd} 100%);border-radius:20px 20px 0 0;padding:40px 40px 44px;text-align:center;">

              <!-- Logo -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 28px;">
                <tr>
                  <td style="padding-right:7px;vertical-align:middle;">
                    <div style="width:9px;height:9px;border-radius:50%;background:#ffffff;"></div>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="font-size:17px;color:#ffffff;font-style:italic;font-weight:700;letter-spacing:-0.02em;">Earth</span>
                    <span style="font-size:14px;color:rgba(255,255,255,0.75);letter-spacing:0.1em;margin-left:4px;">Flow</span>
                  </td>
                </tr>
              </table>

              <!-- Icon circle -->
              <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.15);line-height:72px;font-size:34px;color:#ffffff;margin-bottom:4px;">
                ${template.icon}
              </div>

            </td>
          </tr>

          <!-- White card body -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 20px 20px;padding:44px 44px 52px;text-align:center;">

              ${template.content.trim()}

              <!-- CTA button -->
              <a href="${template.href}"
                 style="display:inline-block;background:${template.accent};background:linear-gradient(135deg,${template.accent},${template.accentEnd});color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:17px 46px;border-radius:100px;letter-spacing:0.01em;">
                ${template.button} →
              </a>

              <!-- Info row -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin:32px auto 0;max-width:360px;">
                <tr>
                  <td align="center" style="background:#f9fafb;border:1px solid #f3f4f6;border-radius:12px;padding:14px 20px;">
                    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                      ${template.info}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="border-top:1px solid #f3f4f6;margin:32px 0;"></div>

              <!-- Fallback -->
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;">
                If the button does not work, copy this link into your browser:<br>
                <a href="${template.href}" style="color:${template.accent};word-break:break-all;">
                  ${template.href}
                </a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 16px 0;">
              <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.7;">
                ${template.footer}<br>
                © 2026 Earth Flow
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  templates.map((template) =>
    writeFile(path.join(outputDirectory, template.file), render(template), "utf8"),
  ),
);

console.log(
  `Generated ${templates.length} Earth Flow auth email templates in the confirm.html style.`,
);
