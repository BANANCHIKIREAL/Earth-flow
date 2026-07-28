import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRef = process.env.SUPABASE_PROJECT_REF ?? "carmobwantbhvquzjuhw";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error(
    "SUPABASE_ACCESS_TOKEN is required. Create one at https://supabase.com/dashboard/account/tokens and keep it out of git.",
  );
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatesDirectory = path.join(root, "supabase", "email-templates");

const readTemplate = (name) =>
  readFile(path.join(templatesDirectory, name), "utf8");

const [
  recovery,
  emailChange,
  passwordChanged,
  emailChanged,
] = await Promise.all([
  readTemplate("reset-password.html"),
  readTemplate("email-change.html"),
  readTemplate("password-changed.html"),
  readTemplate("email-changed.html"),
]);

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mailer_subjects_recovery: "Set your Earth Flow password",
      mailer_templates_recovery_content: recovery,
      mailer_subjects_email_change: "Confirm your new Earth Flow email",
      mailer_templates_email_change_content: emailChange,
      mailer_notifications_password_changed_enabled: true,
      mailer_subjects_password_changed_notification:
        "Your Earth Flow password was changed",
      mailer_templates_password_changed_notification_content: passwordChanged,
      mailer_notifications_email_changed_enabled: true,
      mailer_subjects_email_changed_notification:
        "Your Earth Flow email was changed",
      mailer_templates_email_changed_notification_content: emailChanged,
    }),
  },
);

if (!response.ok) {
  const message = await response.text();
  throw new Error(
    `Supabase rejected the email template update (${response.status}): ${message}`,
  );
}

console.log(
  `Deployed 4 Earth Flow email templates to Supabase project ${projectRef}.`,
);
