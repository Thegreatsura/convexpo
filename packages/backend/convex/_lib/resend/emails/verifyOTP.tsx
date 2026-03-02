export default function generateVerifyOTP({ code }: { code: string }): {
	html: string;
	text: string;
} {
	const html = `
		<h1>Verify your Project Account</h1>

		<p>
			Enter this verification code to verify your email address:
		</p>

		<code>${code}</code>

		<p>
			If you didn't create an account, you can safely ignore this email.
		</p>
	`;

	const text = `Verify your Project Account\n\nEnter this verification code to verify your email address:\n\n${code}\n\nIf you didn't create an account, you can safely ignore this email.`;

	return { html, text };
}
