import { Link } from "@tanstack/react-router";
import type * as React from "react";
import { cn } from "@/lib/utils";

const logoMarkVariants = {
	lime: "border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)]",
	neutral: "border border-border/50 bg-neutral-100",
} as const;

type LogoMarkVariant = keyof typeof logoMarkVariants;

interface LogoMarkProps {
	className?: string;
	variant?: LogoMarkVariant;
}

interface LogoProps extends LogoMarkProps {
	link?: string;
	linkClassName?: string;
	onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

export function LogoMark({ className, variant = "lime" }: LogoMarkProps) {
	return (
		<div className="relative size-11">
			<svg
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				className="size-full"
				fill="none"
				viewBox="0 0 80 80"
			>
				<defs id="paint_resources">
					<radialGradient
						id="paint1_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(44 69.19) rotate(90) scale(4.219 24.61)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#041A52" offset="0" />
						<stop stop-color="#054191" stop-opacity=".74" offset=".526" />
						<stop stop-color="#1B8AF7" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint2_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(49.94 31.61) rotate(107.5) scale(40.22 33.03)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#424262" offset="0" />
						<stop stop-color="#1E1C3A" offset=".362" />
						<stop stop-color="#181633" offset=".6904" />
						<stop stop-color="#20264F" offset=".8883" />
						<stop stop-color="#3479D7" offset="1" />
					</radialGradient>
					<linearGradient
						id="paint3_linear_4032_8319"
						x1="70.75"
						x2="66.37"
						y1="29.11"
						y2="31"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".6" offset="0" />
						<stop stop-color="#4193FF" stop-opacity=".55" offset=".4427" />
						<stop stop-color="#2458D3" stop-opacity="0" offset="1" />
					</linearGradient>
					<linearGradient
						id="paint4_linear_4032_8319"
						x1="48.35"
						x2="43.78"
						y1="10.03"
						y2="11.11"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".6" offset="0" />
						<stop stop-color="#418BFF" stop-opacity=".55" offset=".4427" />
						<stop stop-color="#2454D0" stop-opacity="0" offset="1" />
					</linearGradient>
					<linearGradient
						id="paint5_linear_4032_8319"
						x1="37.71"
						x2="34.75"
						y1="14.24"
						y2="11.76"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity="0" offset="0" />
						<stop stop-color="#96B0FF" stop-opacity=".6" offset=".4844" />
						<stop stop-color="#2873E7" stop-opacity="0" offset="1" />
					</linearGradient>
					<linearGradient
						id="paint6_linear_4032_8319"
						x1="26.56"
						x2="24.22"
						y1="26.69"
						y2="27.84"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity="0" offset="0" />
						<stop stop-color="#5485FF" stop-opacity=".55" offset=".4427" />
						<stop stop-color="#2657CE" stop-opacity="0" offset="1" />
					</linearGradient>
					<linearGradient
						id="paint7_linear_4032_8319"
						x1="21.41"
						x2="18.32"
						y1="31.65"
						y2="30.55"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity="0" offset="0" />
						<stop stop-color="#73A0FF" stop-opacity=".55" offset=".4427" />
						<stop stop-color="#2763D5" stop-opacity="0" offset="1" />
					</linearGradient>
					<radialGradient
						id="paint8_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(22.13 48.47) rotate(78.55) scale(4.316 1.655)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".35" offset="0" />
						<stop stop-color="#fff" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint9_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(49.7 29.65) rotate(127.4) scale(4.249 1.227)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".25" offset="0" />
						<stop stop-color="#fff" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint10_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(46.93 16.15) rotate(123.7) scale(7.251 2.158)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".4" offset="0" />
						<stop stop-color="#fff" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint11_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(60.33 23.33) rotate(71.12) scale(7.593 2.884)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".45" offset="0" />
						<stop stop-color="#fff" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint12_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(26.85 30.7) rotate(65.15) scale(4.223 1.606)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#fff" stop-opacity=".5" offset="0" />
						<stop stop-color="#fff" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint13_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(33.59 50.6) rotate(90) scale(5.625 6.25)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#201F3D" offset="0" />
						<stop stop-color="#201F3D" offset=".6562" />
						<stop stop-color="#201F3D" stop-opacity="0" offset="1" />
					</radialGradient>
					<radialGradient
						id="paint14_radial_4032_8319"
						cx="0"
						cy="0"
						r="1"
						gradientTransform="translate(56.34 50.6) rotate(90) scale(5.625 6.25)"
						gradientUnits="userSpaceOnUse"
					>
						<stop stop-color="#201F3D" offset="0" />
						<stop stop-color="#201F3D" offset=".6562" />
						<stop stop-color="#201F3D" stop-opacity="0" offset="1" />
					</radialGradient>

					<g id="pearl_eye_gradients">
						<linearGradient
							id="pearl-left-eye"
							x1="33.43"
							y1="46.43"
							x2="30.26"
							y2="54.74"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0%" stop-color="#D8E5FA" />
							<stop offset="24%" stop-color="#FFFFFF" />
							<stop offset="52%" stop-color="#FCFEFF" />
							<stop offset="80%" stop-color="#E3EDFC" />
							<stop offset="100%" stop-color="#B5CAEB" />
						</linearGradient>
						<linearGradient
							id="pearl-right-eye"
							x1="56.83"
							y1="46.43"
							x2="60"
							y2="54.74"
							gradientUnits="userSpaceOnUse"
						>
							<stop offset="0%" stop-color="#D8E5FA" />
							<stop offset="24%" stop-color="#FFFFFF" />
							<stop offset="52%" stop-color="#FCFEFF" />
							<stop offset="80%" stop-color="#E3EDFC" />
							<stop offset="100%" stop-color="#B5CAEB" />
						</linearGradient>
					</g>
				</defs>
				<ellipse
					transform="scale(.9091)"
					cx="44"
					cy="69.19"
					rx="24.61"
					ry="4.219"
					fill="url(#paint1_radial_4032_8319)"
					id="ground_shadow"
				/>
				<g id="creature">
					<path
						transform="scale(.9091)"
						d="m44.26 70.85c-18.76 0-26.48-12.89-26.48-23.97 0-10.4 4.77-18.49 6.15-19.86 0.39-0.39 0.78-0.4 1.25-0.11 1.1 0.71 2.78 2.7 3.63 3.91 2.3-9.21 10.81-15.98 14.48-20.13 0.64-0.7 1.16-0.82 1.84-0.28 2.64 2.28 5.32 5.83 6.36 9.19 0.64 2.14 0.85 4.77 0.86 6.26 1.93-3.2 5.19-6.26 6.69-7.02 0.54-0.27 0.94-0.2 1.37 0.2 3.81 4.01 10.37 15.47 10.37 27.15 0 12.65-8.08 24.66-26.52 24.66z"
						fill="url(#paint2_radial_4032_8319)"
					/>
					<path
						transform="scale(.9091)"
						d="m59.7 18.72c0.31-0.11 0.64 0.05 0.89 0.3 4.59 4.85 10.16 16.25 10.16 26.88l-1.18 0.29c0-11.57-6.19-23.02-9.87-27.47z"
						fill="url(#paint3_linear_4032_8319)"
					/>
					<path
						transform="scale(.9091)"
						d="m44.06 10.07c0.33-0.12 0.73 0.03 1.04 0.28 3.25 2.79 5.61 6.27 6.46 9.39l-0.76 0.5c-1.29-3.89-4.42-7.86-6.74-10.17z"
						fill="url(#paint4_linear_4032_8319)"
					/>
					<path
						transform="scale(.9091)"
						d="m43.69 10.25 0.52 0.33c-4.24 5.77-12.85 12.19-14.96 20.63l-0.5-0.47c1.87-8.85 10.75-15.85 14.94-20.49z"
						fill="url(#paint5_linear_4032_8319)"
					/>
					<path
						transform="scale(.9091)"
						d="m24.39 26.74c0.3-0.12 0.68 0.01 0.99 0.22 1.36 1.02 2.81 2.79 3.57 3.99l-0.26 1.86c-1.19-2.26-2.91-4.57-4.3-6.07z"
						fill="url(#paint6_linear_4032_8319)"
					/>
					<path
						transform="scale(.9091)"
						d="m24.05 26.98 0.46 0.27c-2.97 5.04-5.91 12.18-5.91 19.63h-0.85c-0.14-9.03 4.05-17.37 6.3-19.9z"
						fill="url(#paint7_linear_4032_8319)"
					/>
					<ellipse
						transform="scale(.9091)"
						cx="22.13"
						cy="48.47"
						rx="1.523"
						ry="4.453"
						fill="url(#paint8_radial_4032_8319)"
						opacity=".7"
					/>
					<ellipse
						transform="matrix(.7336 .5369 -.5369 .7336 24.63 -21.48)"
						cx="49.7"
						cy="29.65"
						rx="1.216"
						ry="4.322"
						fill="url(#paint9_radial_4032_8319)"
						opacity=".5"
					/>
					<path
						transform="scale(.9091)"
						d="m44.47 11.15c2.93 2.54 5.11 6 6.04 9.31l-3.09 2.38c-2.25-3.64-3.13-7.94-2.95-11.69z"
						fill="url(#paint10_radial_4032_8319)"
						opacity=".6"
					/>
					<path
						transform="scale(.9091)"
						d="m59.54 19.25c4.48 5.02 7.28 12.26 7.89 18.49l-7.49-0.86c-2.36-5.97-1.79-12.3-0.4-17.63z"
						fill="url(#paint11_radial_4032_8319)"
						opacity=".6"
					/>
					<path
						transform="scale(.9091)"
						d="m24.55 27.27c1.67 1.33 3.58 3.41 4.57 5.29l-1.36 2.88c-1.87-2.52-3-5.6-3.21-8.17z"
						fill="url(#paint12_radial_4032_8319)"
						opacity=".6"
					/>
					<g id="eyes">
						<circle
							transform="scale(.9091)"
							cx="33.59"
							cy="50.6"
							r="6.25"
							fill="url(#paint13_radial_4032_8319)"
							fill-opacity=".5"
						/>
						<circle
							transform="scale(.9091)"
							cx="56.34"
							cy="50.6"
							r="6.25"
							fill="url(#paint14_radial_4032_8319)"
							fill-opacity=".5"
						/>
						<path
							transform="scale(.9091)"
							d="m39.09 51.79-10.44-6.55c-0.4-0.23-0.72-0.09-0.83 0.31-0.17 0.63-0.2 1.39-0.2 2.2 0 4.86 3.57 7.76 6.72 7.76 2.5 0 4.41-1.72 4.91-3.06 0.11-0.26 0.03-0.52-0.16-0.66z"
							fill="url(#pearl-left-eye)"
							stroke="#2D2D4F"
							stroke-width=".25"
							id="left_eye"
						/>
						<path
							transform="scale(.9091)"
							d="m50.91 51.79 10.54-6.58c0.39-0.24 0.72-0.12 0.82 0.29 0.16 0.65 0.2 1.38 0.2 2.16 0 4.94-3.62 7.85-6.71 7.85-2.55 0-4.48-1.77-5.01-3.06-0.11-0.27-0.03-0.53 0.16-0.66z"
							fill="url(#pearl-right-eye)"
							stroke="#2D2D4F"
							stroke-width=".25"
							id="right_eye"
						/>
						<g
							transform="scale(.9091)"
							fill="none"
							stroke-linecap="round"
							id="eye_highlights"
						>
							<path
								d="M29.10 46.08 L38.34 51.88"
								stroke="#FFFFFF"
								stroke-width="0.32"
								opacity="0.85"
							/>
							<path
								d="M61.17 46.03 L51.70 51.90"
								stroke="#FFFFFF"
								stroke-width="0.32"
								opacity="0.85"
							/>
							<path
								d="M28.25 46.15 C27.85 49.15 29.14 52.10 31.23 53.68"
								stroke="#FFFFFF"
								stroke-width="0.42"
								opacity="0.8"
							/>
							<path
								d="M61.83 46.15 C62.20 49.15 60.91 52.10 58.82 53.68"
								stroke="#FFFFFF"
								stroke-width="0.42"
								opacity="0.8"
							/>
							<path
								d="M30.50 53.57 C32.95 55.39 36.24 55.26 38.08 52.95"
								stroke="#829CCA"
								stroke-width="0.45"
								opacity="0.38"
							/>
							<path
								d="M59.60 53.57 C57.15 55.39 53.86 55.26 52.02 52.95"
								stroke="#829CCA"
								stroke-width="0.45"
								opacity="0.38"
							/>
						</g>
					</g>
				</g>
			</svg>
		</div>
		// <div
		// 	className={cn(
		// 		"relative size-9 overflow-hidden rounded-lg",
		// 		logoMarkVariants[variant],
		// 		className,
		// 	)}
		// >
		// 	<svg
		// 		className="absolute bottom-[-5px] h-full w-full object-contain"
		// 		width="147"
		// 		height="182"
		// 		viewBox="0 0 147 182"
		// 		fill="none"
		// 		xmlns="http://www.w3.org/2000/svg"
		// 		aria-hidden="true"
		// 	>
		// 		<path
		// 			d="M67.334 5.42313C63.3714 11.1355 58.8324 16.7032 48.0974 28.7064C35.129 43.2404 29.7975 51.9897 28.2125 61.0282L27.3479 65.9452L25.4747 62.2575C24.466 60.1605 21.7282 56.5451 19.3507 54.1589C14.3074 48.8804 14.7397 48.5912 9.91253 60.0882C-1.25475 86.6977 -3.12797 114.97 5.01333 135.361C14.3794 158.861 33.1837 174.697 59.1927 181.06C61.6422 181.638 67.334 182 73.9623 182C83.4004 181.928 85.6339 181.711 91.974 179.975C119.496 172.383 139.669 151.269 145.793 123.575C147.018 117.79 147.162 115.187 146.874 104.269C146.297 85.2515 142.767 70.8621 134.121 53.2189C129.871 44.3973 120.649 29.791 115.894 24.3679L113.444 21.5479L110.274 23.6448C105.015 27.1156 98.8905 33.768 96.8012 38.2511L94.8559 42.445L94.4236 37.7449C93.8472 32.2495 92.9827 29.6464 89.6685 23.7171C87.363 19.6679 80.3745 10.557 73.8182 3.18157L71.0804 4.05312e-06L67.334 5.42313ZM43.0541 115.187C50.7632 119.67 57.0312 123.503 57.0312 123.792C57.0312 124.081 56.0946 125.6 54.9419 127.19C52.4202 130.733 48.8899 132.469 44.2789 132.469C37.8667 132.397 33.0396 129.07 29.5093 122.056C27.3479 117.79 26.6995 107.161 28.6447 107.161C28.9329 107.161 35.4172 110.776 43.0541 115.187ZM119.568 111.789C120.288 125.889 107.968 136.518 97.0173 131.312C94.7118 130.227 90.1728 125.238 90.1728 123.792C90.1728 123.069 117.839 107.161 118.631 107.378C119.064 107.522 119.424 109.475 119.568 111.789Z"
		// 			fill="#190A26"
		// 		/>
		// 		<path
		// 			d="M58 124.268C58 122.549 38.0595 111.381 28.0893 106.012C27.021 105.435 23.8163 125.341 37.7034 131.247C51.5906 137.154 58 126.415 58 124.268Z"
		// 			fill="white"
		// 		/>
		// 		<path
		// 			d="M89 124.268C89 122.549 108.94 111.381 118.911 106.012C119.979 105.435 123.184 125.341 109.297 131.247C95.4094 137.154 89 126.415 89 124.268Z"
		// 			fill="white"
		// 		/>
		// 	</svg>
		// </div>
	);
}

export default function Logo({
	link = "/",
	linkClassName,
	onClick,
	...logoMarkProps
}: LogoProps) {
	return (
		<Link
			to={link}
			onClick={onClick}
			className={cn("inline-flex items-center gap-1", linkClassName)}
		>
			<LogoMark {...logoMarkProps} />
		</Link>
	);
}
