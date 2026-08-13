import { resend } from "@/lib/resend"

export type SendEmailResult = {
  id: string
}

/**
 * Send Email node executor — sends a single transactional email through Resend.
 *
 * Unlike the other action nodes it does NOT require (or touch) a Stagehand browser
 * session; it is a pure server-side API call using the shared Resend client in
 * `lib/resend.ts`. It sends from the hardcoded sandbox address `onboarding@resend.dev`.
 *
 * Per the Resend skill, `resend.emails.send(...)` returns `{ data, error }` and does
 * NOT throw on an API error. We surface `error` by throwing here so the workflow run
 * marks this step as failed — i.e. the node is NOT silently treated as successful when
 * the email never actually sent. On success we return the email's ID so downstream
 * nodes can reference `{{ <nodeId>.id }}`.
 */
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}): Promise<SendEmailResult> {
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: [to],
    subject,
    text: body,
  })

  if (error) {
    throw new Error(`Resend failed to send email: ${error.message}`)
  }

  return { id: data?.id ?? "" }
}