import { Resend } from 'resend'
import { EMAIL_FROM } from './config'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@writermarket.ng'

export async function sendFlaggedMessageAlert(messageContent: string, matchedPattern: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    subject: 'Flagged message requires review',
    html: `<p>A message has been flagged for contact sharing.</p>
           <p><strong>Pattern:</strong> ${matchedPattern}</p>
           <p><strong>Content:</strong> ${messageContent.substring(0, 200)}...</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/flags">Review flagged messages</a></p>`,
  })
}

export async function sendDisputeOpenedAlert(projectTitle: string, disputeReason: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: ADMIN_EMAIL,
    subject: `Dispute opened: ${projectTitle}`,
    html: `<p>A dispute has been opened for project <strong>${projectTitle}</strong>.</p>
           <p><strong>Reason:</strong> ${disputeReason}</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/disputes">Review disputes</a></p>`,
  })
}
