export default function generateResetPasswordEmail({ url }: { url: string }): {
	html: string;
	text: string;
} {
	const html = `
		<h1>Project Reset Password</h1>

		<a href="${url}">
			Click here to reset your password
		</a>

		<p>
			If you didn't request a password reset, you can safely ignore this email.
		</p>
	`;

	const text = `Project Reset Password\n\nReset your password: ${url}\n\nIf you didn't request a password reset, you can safely ignore this email.`;

	return { html, text };
}
