/**
 * Title utils
 */
const BASE_TITLE = "English Now";

export const DEFAULT_TITLE = "English Now - Learn English with AI";

export const createTitle = (
	pageTitle: string,
	baseTitle: string = BASE_TITLE,
): string => `${pageTitle} | ${baseTitle}`;

/**
 * Common page titles
 */
export const PAGE_TITLE = {
	// Public
	home: "Home",
	about: "About",
	features: "Features",
	pricing: "Pricing",
	contact: "Contact",
	blog: "Blog",
	tools: "Free English Tools",
	forBusiness: "For Business",
	bookADemo: "Book a demo",
	privacy: "Privacy Policy",
	terms: "Terms of Service",
	refund: "Refund Policy",
	// Auth
	login: "Login",
	register: "Register",
	forgotPassword: "Forgot Password",
	resetPassword: "Reset Password",
	verifyEmail: "Verify Email",
	//Dashboard
	dashboard: "Dashboard",
	lessons: "Lessons",
	practice: "Practice",
	pronunciation: "Pronunciation",
	vocabulary: "Vocabulary",
	settings: "Settings",
};
