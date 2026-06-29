import { Resend } from 'resend'
import { EMAIL_FROM } from './config'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendClientVerificationEmail(email: string, tokenHash: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=signup`

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: 'Verify your WriteSpace account',
    html: `<h2>Welcome to WriteSpace</h2>
           <p>Thanks for signing up. Please confirm your email address to activate your account.</p>
           <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Confirm Email</a></p>
           <p style="margin-top:16px;font-size:13px;color:#666;">If the button doesn't work, copy and paste this link into your browser:</p>
           <p style="font-size:13px;color:#666;word-break:break-all;">${verifyUrl}</p>
           <p style="margin-top:24px;font-size:12px;color:#999;">This link expires per Supabase's default verification window. If it has expired, please sign up again.</p>`,
  })
}

export async function sendJobPostedConfirmation(clientEmail: string, jobTitle: string, jobId: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: clientEmail,
    subject: `Job posted: ${jobTitle}`,
    html: `<p>Your job <strong>${jobTitle}</strong> has been posted. Writers will be notified.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/projects">View your jobs</a></p>`,
  })
}

export async function sendResponseReceivedNotification(clientEmail: string, jobTitle: string, writerUsername: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: clientEmail,
    subject: `New response to: ${jobTitle}`,
    html: `<p><strong>${writerUsername}</strong> has responded to your job <strong>${jobTitle}</strong>.</p>`,
  })
}

export async function sendProjectCompletedNotification(clientEmail: string, projectTitle: string, projectId: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: clientEmail,
    subject: `Work submitted: ${projectTitle}`,
    html: `<p>The writer has marked <strong>${projectTitle}</strong> as complete. Please review and approve.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${projectId}">Review</a></p>`,
  })
}

export async function sendPaymentConfirmation(clientEmail: string, amount: number, projectTitle: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: clientEmail,
    subject: `Payment confirmed: ₦${amount.toLocaleString()}`,
    html: `<p>Your payment of <strong>₦${amount.toLocaleString()}</strong> for <strong>${projectTitle}</strong> has been received and is held in escrow.</p>`,
  })
}
