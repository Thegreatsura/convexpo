import { Resend } from "@convex-dev/resend";
import { components } from "../../_generated/api";
import type { ActionCtx } from "../../_generated/server";
import { requireEnv } from "../../util";

export const resendHandler = new Resend(components.resend, {
	/**
	 * NOTE:
	 * if wanting to use test addresses,
	 * isDevelopment()
	 * you cant use your own email in test mode
	 */
	testMode: false,
});

export const sendEmail = async (
	ctx: ActionCtx,
	{
		to,
		subject,
		html,
		text,
	}: {
		to: string;
		subject: string;
		html: string;
		text?: string;
	},
) => {
	await resendHandler.sendEmail(ctx, {
		/**
		 * IMPORTANT: The 'from' email domain MUST be verified in your Resend account.
		 * You cannot use test mode for authentication emails - a verified domain is required.
		 * Replace 'apyri.com' with your own verified domain.
		 */
		from: requireEnv("RESEND_AUTH_EMAIL"),
		to,
		subject,
		html,
		text,
	});
};
