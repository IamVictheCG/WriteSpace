import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'WriterMarket <noreply@writermarket.ng>'

export async function sendJobPostedConfirmation(clientEmail: string, jobTitle: string, jobId: string) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Job posted: ${jobTitle}`,
    html: `<p>Your job <strong>${jobTitle}</strong> has been posted. Writers will be notified.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/projects">View your jobs</a></p>`,
  })
}

export async function sendResponseReceivedNotification(clientEmail: string, jobTitle: string, writerUsername: string) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `New response to: ${jobTitle}`,
    html: `<p><strong>${writerUsername}</strong> has responded to your job <strong>${jobTitle}</strong>.</p>`,
  })
}

export async function sendProjectCompletedNotification(clientEmail: string, projectTitle: string, projectId: string) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Work submitted: ${projectTitle}`,
    html: `<p>The writer has marked <strong>${projectTitle}</strong> as complete. Please review and approve.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${projectId}">Review</a></p>`,
  })
}

export async function sendPaymentConfirmation(clientEmail: string, amount: number, projectTitle: string) {
  await resend.emails.send({
    from: FROM,
    to: clientEmail,
    subject: `Payment confirmed: ₦${amount.toLocaleString()}`,
    html: `<p>Your payment of <strong>₦${amount.toLocaleString()}</strong> for <strong>${projectTitle}</strong> has been received and is held in escrow.</p>`,
  })
}
