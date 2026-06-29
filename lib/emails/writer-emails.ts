import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'WriterMarket <noreply@writermarket.ng>'

export async function sendJobMatchNotification(writerEmail: string, jobTitle: string, jobId: string) {
  await resend.emails.send({
    from: FROM,
    to: writerEmail,
    subject: `New job matching your categories: ${jobTitle}`,
    html: `<p>A new job has been posted that matches your categories: <strong>${jobTitle}</strong>.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/writer/jobs/${jobId}">View and respond</a></p>`,
  })
}

export async function sendResponseConfirmation(writerEmail: string, jobTitle: string) {
  await resend.emails.send({
    from: FROM,
    to: writerEmail,
    subject: `Response submitted: ${jobTitle}`,
    html: `<p>Your response to <strong>${jobTitle}</strong> has been submitted. You'll be notified if the client selects you.</p>`,
  })
}

export async function sendAssignmentNotification(writerEmail: string, projectTitle: string, projectId: string) {
  await resend.emails.send({
    from: FROM,
    to: writerEmail,
    subject: `You've been selected: ${projectTitle}`,
    html: `<p>A client has selected you for the project <strong>${projectTitle}</strong>.</p>
           <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/writer/projects/${projectId}">View project</a></p>`,
  })
}

export async function sendPayoutNotification(writerEmail: string, amount: number) {
  await resend.emails.send({
    from: FROM,
    to: writerEmail,
    subject: `Payout sent: ₦${amount.toLocaleString()}`,
    html: `<p>A payout of <strong>₦${amount.toLocaleString()}</strong> has been sent to your bank account.</p>`,
  })
}
