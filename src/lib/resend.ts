import { Resend } from "resend";

let resendClient: Resend | null = null;

const DEV_FROM = "CourtWork <onboarding@resend.dev>";

function getResend() {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

/** Prefer configured from-address; fall back if it still looks like a placeholder. */
function getFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (!configured) return DEV_FROM;

  const lower = configured.toLowerCase();
  if (
    lower.includes("@yourdomain.com") ||
    lower.includes("example.com") ||
    lower.includes("localhost")
  ) {
    console.warn(
      `[resend] RESEND_FROM_EMAIL "${configured}" looks unverified; using ${DEV_FROM}`
    );
    return DEV_FROM;
  }

  return configured;
}

export async function sendHomeworkEmail({
  to,
  clientName,
  trainerName,
  assignmentTitle,
  dueDate,
  homeworkUrl,
}: {
  to: string;
  clientName: string;
  trainerName: string;
  assignmentTitle: string;
  dueDate?: string;
  homeworkUrl: string;
}) {
  const { data, error } = await getResend().emails.send({
    from: getFromAddress(),
    to,
    subject: `New homework: ${assignmentTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #ea580c; font-size: 24px; margin-bottom: 8px;">🏀 New Homework Assigned</h1>
        <p>Hi ${escapeHtml(clientName)},</p>
        <p><strong>${escapeHtml(trainerName)}</strong> assigned you a new workout playlist:</p>
        <div style="background: #fff7ed; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <h2 style="margin: 0 0 8px; font-size: 18px;">${escapeHtml(assignmentTitle)}</h2>
          ${dueDate ? `<p style="margin: 0; color: #666;">Due: ${escapeHtml(dueDate)}</p>` : ""}
        </div>
        <a href="${homeworkUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Start Homework →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Sent via CourtWork</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Failed to send homework email");
  }

  return data;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
