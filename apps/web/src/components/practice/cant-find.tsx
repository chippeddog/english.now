import { useTranslation } from "react-i18next";
export default function CantFind() {
	const { t } = useTranslation("app");
	return (
		<a
			href="mailto:support@english.now"
			className="group flex min-h-[72px] cursor-pointer items-center justify-center rounded-[1.2rem] border border-dashed bg-white p-3.5 opacity-50 transition-all duration-300 hover:opacity-100 dark:bg-slate-900/50"
		>
			<div className="flex items-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="1rem"
					height="1rem"
					className="size-6 text-white"
					fill="none"
					viewBox="0 0 50 49"
					aria-label="Practice icon"
					role="img"
				>
					<path
						d="M49.3701 37.44C45.5301 27.97 -4.08989 27.42 0.270112 41.23C3.53011 51.58 54.8101 50.86 49.3701 37.44Z"
						fill="black"
					/>
					<path
						d="M19.1701 12.0402C16.6701 10.9202 16.3401 8.12017 17.6401 5.88017C19.3001 3.01017 23.5101 2.60017 26.4501 3.22017C28.0201 3.55017 29.6601 4.19017 30.6101 5.55017C31.6501 7.04017 31.4601 8.96017 30.6301 10.5002C28.5301 14.3802 23.8001 16.1102 21.1001 19.5202C19.8601 21.0902 18.9701 23.0302 19.4901 25.0602C20.0101 27.0902 21.6301 28.3202 23.5401 28.8202C25.4501 29.3202 26.2101 26.4102 24.3401 25.9302C22.4701 25.4502 21.9001 23.8202 22.9001 22.1402C24.1701 20.0202 26.4501 18.5502 28.3601 17.0702C31.8201 14.3802 35.6201 10.4202 33.9601 5.61017C32.5601 1.53017 28.0001 -0.0498294 24.0301 0.000170624C20.0601 0.0501706 16.3401 1.44017 14.7001 5.06017C13.0601 8.68017 13.9301 12.9502 17.6601 14.6202C19.4101 15.4002 20.9301 12.8202 19.1701 12.0302V12.0402Z"
						fill="black"
					/>
					<path
						d="M25.9596 35.6602C22.4496 36.0302 23.0796 41.4002 26.5596 40.9602C29.7196 40.4002 29.2096 35.5602 26.0196 35.6602H25.9596Z"
						fill="white"
					/>
				</svg>
				<div className="flex flex-col">
					<div className="flex items-center font-medium text-neutral-900 text-sm transition-all duration-300 group-hover:text-lime-700">
						{t("practice.cantFind")}
					</div>
				</div>
			</div>
		</a>
	);
}
