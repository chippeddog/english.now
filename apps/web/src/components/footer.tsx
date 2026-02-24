import { useTranslation } from "@english.now/i18n";
import { Link } from "@tanstack/react-router";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";

export default function Footer() {
	const { t } = useTranslation("common");
	const { t: tHome } = useTranslation("home");

	const navigation = [
		{
			label: tHome("footer.product"),
			items: [
				{ label: t("nav.home"), to: "/" },
				{ label: t("nav.features"), to: "/features" },
				{ label: t("nav.pricing"), to: "/pricing" },
			],
		},
		// {
		// 	label: "Resources",
		// 	items: [
		// 		{ label: "Feedback", to: "https://english.userjot.com/board" },
		// 		{ label: "Roadmap", to: "https://english.userjot.com/roadmap" },
		// 		{ label: "Updates", to: "https://english.userjot.com/updates" },
		// 	],
		// },
		{
			label: tHome("footer.company"),
			items: [
				{ label: t("nav.about"), to: "/about" },
				{ label: t("nav.blog"), to: "/blog" },
				{ label: tHome("footer.contact"), to: "/contact" },
			],
		},
		{
			label: tHome("footer.social"),
			items: [
				{ label: "X", to: "https://x.com/tihunov" },
				{
					label: "GitHub",
					to: "https://github.com/Dmytro-Tihunov/english.now",
				},
			],
		},
		{
			label: tHome("footer.legal"),
			items: [
				{ label: tHome("footer.privacy"), to: "/privacy-policy" },
				{ label: tHome("footer.terms"), to: "/terms-of-service" },
				{
					label: tHome("footer.cancellation"),
					to: "/refund",
				},
			],
		},
	];

	return (
		<footer>
			<div className="container relative z-10 mx-auto max-w-5xl px-4">
				<div className="mx-auto grid grid-cols-1 border-border/50 border-t pt-12 md:grid-cols-3">
					<div className="col-span-1">
						<div className="mb-5 flex items-center gap-2">
							<Link to="/" className="flex items-center gap-3">
								<div className="relative size-9 overflow-hidden rounded-xl border border-border/50 bg-neutral-100">
									<svg
										className="absolute bottom-[-5px] h-full w-full object-contain"
										width="147"
										height="182"
										viewBox="0 0 147 182"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
										aria-hidden="true"
									>
										<path
											d="M67.334 5.42313C63.3714 11.1355 58.8324 16.7032 48.0974 28.7064C35.129 43.2404 29.7975 51.9897 28.2125 61.0282L27.3479 65.9452L25.4747 62.2575C24.466 60.1605 21.7282 56.5451 19.3507 54.1589C14.3074 48.8804 14.7397 48.5912 9.91253 60.0882C-1.25475 86.6977 -3.12797 114.97 5.01333 135.361C14.3794 158.861 33.1837 174.697 59.1927 181.06C61.6422 181.638 67.334 182 73.9623 182C83.4004 181.928 85.6339 181.711 91.974 179.975C119.496 172.383 139.669 151.269 145.793 123.575C147.018 117.79 147.162 115.187 146.874 104.269C146.297 85.2515 142.767 70.8621 134.121 53.2189C129.871 44.3973 120.649 29.791 115.894 24.3679L113.444 21.5479L110.274 23.6448C105.015 27.1156 98.8905 33.768 96.8012 38.2511L94.8559 42.445L94.4236 37.7449C93.8472 32.2495 92.9827 29.6464 89.6685 23.7171C87.363 19.6679 80.3745 10.557 73.8182 3.18157L71.0804 4.05312e-06L67.334 5.42313ZM43.0541 115.187C50.7632 119.67 57.0312 123.503 57.0312 123.792C57.0312 124.081 56.0946 125.6 54.9419 127.19C52.4202 130.733 48.8899 132.469 44.2789 132.469C37.8667 132.397 33.0396 129.07 29.5093 122.056C27.3479 117.79 26.6995 107.161 28.6447 107.161C28.9329 107.161 35.4172 110.776 43.0541 115.187ZM119.568 111.789C120.288 125.889 107.968 136.518 97.0173 131.312C94.7118 130.227 90.1728 125.238 90.1728 123.792C90.1728 123.069 117.839 107.161 118.631 107.378C119.064 107.522 119.424 109.475 119.568 111.789Z"
											fill="#190A26"
										/>
										<path
											d="M58 124.268C58 122.549 38.0595 111.381 28.0893 106.012C27.021 105.435 23.8163 125.341 37.7034 131.247C51.5906 137.154 58 126.415 58 124.268Z"
											fill="white"
										/>
										<path
											d="M89 124.268C89 122.549 108.94 111.381 118.911 106.012C119.979 105.435 123.184 125.341 109.297 131.247C95.4094 137.154 89 126.415 89 124.268Z"
											fill="white"
										/>
									</svg>
								</div>
							</Link>
						</div>
						<div className="mb-5 text-muted-foreground text-sm leading-relaxed tracking-tight">
							<span className="h-auto w-fit font-medium text-[13px] text-muted-foreground leading-[20px] tracking-[0.1px]">
								{tHome("footer.description")}
							</span>
							<p className="mt-1 h-auto w-fit text-[12px] text-muted-foreground leading-[20px] tracking-[0.1px]">
								{tHome("footer.descriptionNote")}
							</p>
						</div>
					</div>
					<div className="col-span-2 md:pl-18">
						<div className="grid grid-cols-4 gap-4">
							{navigation.map(({ label, items }) => (
								<div key={label} className="flex flex-col">
									<h5 className="mb-3 text-muted-foreground text-sm uppercase leading-relaxed tracking-tight">
										{label}
									</h5>
									<ul className="flex flex-col gap-3">
										{items.map(({ label, to }) => (
											<li key={to}>
												<Link
													className="font-medium text-xs hover:text-neutral-700 md:text-sm"
													to={to}
												>
													{label}
												</Link>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="mt-8 flex flex-row items-center justify-between py-3.5 pb-5">
					<div className="flex items-center text-center">
						<div className="font-medium text-muted-foreground text-xs">
							© {new Date().getFullYear()} English Now.{" "}
							{tHome("footer.copyright")}{" "}
						</div>
						{/* 
						<div className="flex flex-col items-center gap-1">
							<div className="flex items-center gap-1">
								<svg
									className="size-3.5"
									viewBox="0 0 17 16"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										clipRule="evenodd"
										d="M8.98112 0.833374C8.60699 0.833374 8.30219 0.990781 8.02485 1.20243C7.76505 1.40063 7.47849 1.68721 7.14325 2.02249L7.11967 2.04607C6.77656 2.38917 6.47745 2.52421 6.01584 2.52421C5.95799 2.52421 5.88498 2.52216 5.80253 2.51984C5.59118 2.51389 5.31777 2.5062 5.07855 2.52689C4.72864 2.55715 4.29133 2.6529 3.95942 2.9876C3.63005 3.31974 3.53663 3.75525 3.50727 4.10297C3.48727 4.34001 3.49495 4.61138 3.50089 4.82123C3.50323 4.90389 3.50531 4.97703 3.50531 5.03475C3.50531 5.49636 3.37026 5.79547 3.02713 6.1386L3.00357 6.16217C2.66829 6.49741 2.38171 6.78397 2.18351 7.04371C1.97187 7.32111 1.81446 7.62591 1.81445 8.00004C1.81446 8.37411 1.97187 8.67891 2.18351 8.95631C2.38175 9.21617 2.66839 9.50277 3.00375 9.83811L3.02716 9.86151C3.2496 10.0839 3.35453 10.2282 3.414 10.3643C3.47191 10.4969 3.50531 10.6648 3.50531 10.9653C3.50531 11.0232 3.50325 11.0962 3.50093 11.1786C3.49499 11.39 3.48729 11.6634 3.50798 11.9026C3.53825 12.2525 3.63401 12.6898 3.96871 13.0218C4.30086 13.3511 4.73637 13.4445 5.08407 13.4738C5.3211 13.4939 5.59247 13.4862 5.80231 13.4802C5.88499 13.4779 5.95812 13.4758 6.01583 13.4758C6.30997 13.4758 6.47529 13.5054 6.60542 13.5591C6.73543 13.6128 6.87449 13.7088 7.08395 13.9183C7.12865 13.963 7.18754 14.0261 7.25547 14.0989C7.40878 14.2632 7.60826 14.477 7.79445 14.6398C8.07692 14.8867 8.48219 15.1667 8.98112 15.1667C9.48012 15.1667 9.88532 14.8867 10.1679 14.6398C10.354 14.477 10.5533 14.2634 10.7066 14.0991C10.7746 14.0262 10.8336 13.963 10.8783 13.9182C11.0877 13.7088 11.2268 13.6128 11.3568 13.5591C11.4869 13.5054 11.6523 13.4758 11.9464 13.4758C12.0041 13.4758 12.0773 13.4779 12.1599 13.4802C12.3698 13.4862 12.6411 13.4939 12.8782 13.4738C13.2259 13.4445 13.6614 13.3511 13.9935 13.0218C14.3283 12.6898 14.424 12.2525 14.4543 11.9026C14.4749 11.6634 14.4673 11.39 14.4613 11.1786C14.459 11.0962 14.4569 11.0231 14.4569 10.9653C14.4569 10.6648 14.4903 10.4969 14.5483 10.3643C14.6077 10.2282 14.7127 10.0839 14.9351 9.86151L14.9585 9.83811C15.2939 9.50277 15.5805 9.21617 15.7787 8.95631C15.9904 8.67891 16.1478 8.37411 16.1478 8.00004C16.1478 7.62591 15.9904 7.32111 15.7787 7.04371C15.5805 6.78397 15.294 6.49742 14.9587 6.16219L14.9351 6.1386C14.7127 5.91615 14.6077 5.7719 14.5483 5.63573C14.4903 5.50316 14.4569 5.33529 14.4569 5.03475C14.4569 4.97693 14.459 4.90399 14.4613 4.82161C14.4673 4.61026 14.4749 4.33668 14.4543 4.09747C14.424 3.74757 14.3283 3.31026 13.9936 2.97835C13.6615 2.64897 13.2259 2.55554 12.8782 2.52618C12.6411 2.50617 12.3698 2.51385 12.1599 2.5198C12.0773 2.52214 12.0041 2.52421 11.9464 2.52421C11.4847 2.52421 11.1856 2.38911 10.8426 2.04607L10.819 2.02249C10.4837 1.68721 10.1972 1.40063 9.93739 1.20243C9.66005 0.990781 9.35525 0.833374 8.98112 0.833374ZM11.2891 6.92477C11.6157 6.75471 11.7425 6.35211 11.5725 6.02555C11.4024 5.699 10.9998 5.57215 10.6733 5.74223C9.72125 6.23805 8.94459 7.18724 8.43139 7.93564C8.28679 8.14657 8.15819 8.34884 8.04765 8.53157C7.97219 8.46771 7.89939 8.41031 7.83219 8.35971C7.68865 8.25164 7.55959 8.16644 7.46532 8.10764L7.30047 8.01017L7.2994 8.00957C6.97585 7.83384 6.57111 7.95364 6.39537 8.27724C6.21967 8.60071 6.33962 9.00544 6.66299 9.18124C6.75883 9.24184 6.96643 9.37544 7.03018 9.42484C7.25257 9.59231 7.47917 9.80251 7.61664 10.0214C7.74579 10.227 7.97652 10.3462 8.21892 10.3324C8.46125 10.3187 8.67712 10.1741 8.78219 9.95531C8.81632 9.88664 8.90285 9.71684 8.97639 9.58704C9.10645 9.35311 9.29552 9.03311 9.53099 8.68971C10.0178 7.97977 10.6411 7.26231 11.2891 6.92477Z"
										fill="#02B96C"
									/>
								</svg>
								<span className="text-xs">CEFR Aligned</span>
							</div>
						</div> */}
					</div>

					<div className="flex items-center gap-2">
						<LanguageSwitcher />
						{/* <ThemeSwitcher /> */}
					</div>
				</div>
			</div>
		</footer>
	);
}
