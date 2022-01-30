import { config } from '@/config'
import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
})

export async function sendEmail(
  subject: string,
  text: string = '---',
  html: string = ''
): Promise<boolean> {
  try {
    const from = '"Early-buy-bot" <early-buy@bot.com>'
    const to = config.emailRecipient
    await transporter.sendMail({ from, to, subject, text, html })
    return true
  } catch (e) {
    return false
  }
}

