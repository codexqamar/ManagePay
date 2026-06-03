import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing")
  }

  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, invoiceId, paymentUrl, sendCopy, companyEmail } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create email content
    let emailContent = message

    if (paymentUrl) {
      emailContent += `\n\n🔗 Pay Invoice Online: ${paymentUrl}\n\nClick the link above to pay securely with your credit card.`
    }

    emailContent += `\n\n---\nThis email was sent from your Payment Terminal system.`

    const emailData = {
      from: companyEmail || "noreply@paymentterminal.com",
      to: [to],
      subject,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Invoice Payment Request</h2>
          <div style="white-space: pre-line; line-height: 1.6; margin: 20px 0;">
            ${message.replace(/\n/g, "<br>")}
          </div>
          ${
            paymentUrl
              ? `
          <div style="margin: 30px 0; padding: 20px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
            <h3 style="color: #059669; margin-bottom: 15px;">Pay Your Invoice Online</h3>
            <a href="${paymentUrl}" 
               style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Pay Now
            </a>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
              Secure payment powered by Stripe
            </p>
          </div>
          `
              : ""
          }
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            This email was sent from your Payment Terminal system.
          </p>
        </div>
      `,
    }

    // Add copy recipient if requested
    if (sendCopy && companyEmail) {
      emailData.to.push(companyEmail)
    }

    // Send email using Resend
    const resend = getResendClient()
    const { data, error } = await resend.emails.send(emailData)

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: data?.id })
  } catch (error) {
    console.error("Error sending invoice email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
