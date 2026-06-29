import { Resend } from 'resend'
import { EMAIL_FROM } from './config'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWriterVerificationEmail(email: string, tokenHash: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=signup`

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your WriteSpace writer account',
    html: `<h2>Welcome to WriteSpace</h2>
           <p>Thanks for signing up as a writer. Please confirm your email address to activate your account.</p>
           <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Confirm Email</a></p>
           <p style="margin-top:16px;font-size:13px;color:#666;">If the button doesn't work, copy and paste this link into your browser:</p>
           <p style="font-size:13px;color:#666;word-break:break-all;">${verifyUrl}</p>
           <p style="margin-top:24px;font-size:12px;color:#999;">This link expires per Supabase's default verification window. If it has expired, please sign up again.</p>`,
  })
}

export async function sendJobMatchNotification(writerEmail: string, jobTitle: string, jobId: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: writerEmail,
    subject: `New job matching your categories: ${jobTitle}`,
    html: `<p>A new job has been posted that matches your categories: <strong>${jobTitle}</strong>.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/writer/jobs/${jobId}">View and respond</a></p>`,
  })
}

export async function sendResponseConfirmation(writerEmail: string, jobTitle: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: writerEmail,
    subject: `Response submitted: ${jobTitle}`,
    html: `<p>Your response to <strong>${jobTitle}</strong> has been submitted. You'll be notified if the client selects you.</p>`,
  })
}

export async function sendAssignmentNotification(writerEmail: string, projectTitle: string, projectId: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: writerEmail,
    subject: `You've been selected: ${projectTitle}`,
    html: `<p>A client has selected you for the project <strong>${projectTitle}</strong>.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/writer/projects/${projectId}">View project</a></p>`,
  })
}

export async function sendPayoutNotification(writerEmail: string, amount: number) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: writerEmail,
    subject: `Payout sent: ₦${amount.toLocaleString()}`,
    html: `<p>A payout of <strong>₦${amount.toLocaleString()}</strong> has been sent to your bank account.</p>`,
  })
}
