export default function generateVerifyEmail({ url }: { url: string }): {
	html: string;
	text: string;
} {
	const html = `
		<h1>Confirm Project Sign up</h1>

		<a href="${url}">
			Click here to verify your email address
		</a>

		<p>
			If you didn't create an account, you can safely ignore this email.
		</p>
	`;

	const text = `Confirm Project Sign up\n\nVerify your email address: ${url}\n\nIf you didn't create an account, you can safely ignore this email.`;

	return { html, text };
}
