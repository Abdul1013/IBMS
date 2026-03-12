import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);
const FROM = 'IBMS LCU <noreply@lcu.edu.ng>';

const sendEmail = async (to: string, subject: string, html: string) => {
  await resend.emails.send({ from: FROM, to, subject, html });
};

export const sendVerificationEmail = (to: string, name: string, token: string) => {
  const url = `${env.CLIENT_URL}/verify-email?token=${token}`;
  return sendEmail(
    to,
    'Verify your IBMS account',
    `
    <p>Hi ${name},</p>
    <p>Click the link below to verify your IBMS account. This link expires in 24 hours.</p>
    <p><a href="${url}" style="background:#1A56A0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Verify Email</a></p>
    <p>If you did not register, ignore this email.</p>
  `
  );
};

export const sendPasswordResetEmail = (to: string, name: string, token: string) => {
  const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail(
    to,
    'Reset your IBMS password',
    `
    <p>Hi ${name},</p>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <p><a href="${url}" style="background:#1A56A0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p>
    <p>If you did not request this, ignore this email.</p>
  `
  );
};

export const sendApprovalEmail = (to: string, name: string, title: string) =>
  sendEmail(
    to,
    'Your announcement has been published',
    `
    <p>Hi ${name},</p>
    <p>Great news — your announcement <strong>"${title}"</strong> has been approved and is now live on the IBMS bulletin board.</p>
    <p><a href="${env.CLIENT_URL}/my-posts" style="background:#27AE60;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">View your posts</a></p>
  `
  );

export const sendRejectionEmail = (to: string, name: string, title: string, reason: string) =>
  sendEmail(
    to,
    'Your announcement needs revision',
    `
    <p>Hi ${name},</p>
    <p>Your announcement <strong>"${title}"</strong> has been returned for revision.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please edit and resubmit when ready.</p>
    <p><a href="${env.CLIENT_URL}/my-posts" style="background:#1A56A0;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Edit your posts</a></p>
  `
  );
