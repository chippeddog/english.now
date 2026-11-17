import { PlayIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";

export default function Hero() {
	const [open, setOpen] = useState(false);
	return (
		<div className="relative flex flex-col items-center gap-4 pt-18">
			{/* <div className="relative size-18 overflow-hidden rounded-3xl border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,_#EFFF9B_0%,_#D8FF76_60%,_#C6F64D_100%)]">
        <img
          className="absolute bottom-[-10px] h-full w-full object-contain"
          src="/logo.svg"
          alt="English Logo"
          width={62}
          height={62}
        />
      </div> */}
			<div className="group relative">
				<button
					type="button"
					onClick={() => setOpen(true)}
					className="relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[1.2rem] border border-[#C6F64D] bg-[radial-gradient(100%_100%_at_50%_0%,#EFFF9B_0%,#D8FF76_60%,#C6F64D_100%)] p-1 text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-[#C6F64D]/30 hover:shadow-lg"
				>
					<div className="flex h-10 w-16 items-center justify-center rounded-2xl bg-white p-1.5 transition-transform duration-300">
						<PlayIcon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
					</div>
					<span className="flex items-center justify-center pr-2 text-center font-medium text-black text-sm">
						Watch Demo
					</span>
				</button>
				{/* Animated duration badge */}
				<span className="-right-12 absolute top-0 flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 font-medium text-white text-xs opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:right-1 group-hover:opacity-100">
					3 min
				</span>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
					<DialogTitle className="sr-only">Demo Video</DialogTitle>
					<div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
						<iframe
							className="absolute inset-0 h-full w-full"
							src={
								open
									? "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
									: ""
							}
							title="Demo Video"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					</div>
				</DialogContent>
			</Dialog>
			<h1 className="mt-6 mb-2 text-center font-bold font-lyon text-5xl tracking-tight md:text-7xl 2xl:text-7xl">
				The only English learning app <br className="hidden md:block" />
				you’ll ever need.
			</h1>
			<p className="animate-fade-in-up text-center text-muted-foreground leading-relaxed md:text-xl">
				English Now is more than just a platform that helps you learn English
				faster and easier.
				<br />
			</p>
			<div className="flex justify-center">
				<Button size="lg" className="mt-4 rounded-full">
					Get Started
				</Button>
				no card required
			</div>
		</div>
	);
}
