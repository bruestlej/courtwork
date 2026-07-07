import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
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
  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "CourtWork <onboarding@resend.dev>",
    to,
    subject: `New homework: ${assignmentTitle}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #ea580c; font-size: 24px; margin-bottom: 8px;">🏀 New Homework Assigned</h1>
        <p>Hi ${clientName},</p>
        <p><strong>${trainerName}</strong> assigned you a new workout playlist:</p>
        <div style="background: #fff7ed; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <h2 style="margin: 0 0 8px; font-size: 18px;">${assignmentTitle}</h2>
          ${dueDate ? `<p style="margin: 0; color: #666;">Due: ${dueDate}</p>` : ""}
        </div>
        <a href="${homeworkUrl}" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Start Homework →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">Sent via CourtWork</p>
      </div>
    `,
  });

  if (error) throw error;
}
