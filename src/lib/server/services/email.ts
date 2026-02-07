const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_ADDRESS = 'Movie Night <noreply@fcmovienight.org>';

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail(apiKey: string, options: SendEmailOptions): Promise<boolean> {
	const response = await fetch(RESEND_API_URL, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: FROM_ADDRESS,
			to: options.to,
			subject: options.subject,
			html: options.html
		})
	});

	return response.ok;
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
	return {
		subject: 'Reset your Movie Night password',
		html: `
			<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
				<h2 style="color: #e2e8f0;">Movie Night</h2>
				<p style="color: #a0aec0;">You requested a password reset. Click the link below to choose a new password:</p>
				<p style="margin: 24px 0;">
					<a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 500;">
						Reset Password
					</a>
				</p>
				<p style="color: #a0aec0; font-size: 14px;">This link expires in 1 hour.</p>
				<p style="color: #a0aec0; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
			</div>
		`
	};
}
