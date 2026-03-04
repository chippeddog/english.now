import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { WordPopover } from "./word-popover";

type ClickableMessageProps = {
	content: string;
	vocabMode: boolean;
	disabled?: boolean;
};

type Token = { key: string; text: string; word: string | null };

function stripPunctuation(token: string) {
	return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function tokenize(content: string): Token[] {
	const parts = content.split(/(\s+)/);
	const counts = new Map<string, number>();

	return parts.map((text) => {
		const count = (counts.get(text) ?? 0) + 1;
		counts.set(text, count);
		const key = `${text}__${count}`;

		if (/^\s+$/.test(text)) {
			return { key, text, word: null };
		}

		const clean = stripPunctuation(text);
		return { key, text, word: clean || null };
	});
}

export default function ClickableMessage({
	content,
	vocabMode,
	disabled,
}: ClickableMessageProps) {
	const [selectedWord, setSelectedWord] = useState<string | null>(null);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const tokens = useMemo(() => tokenize(content), [content]);

	if (!vocabMode) {
		return <>{content}</>;
	}

	return (
		<>
			<span>
				{tokens.map((token) => {
					if (!token.word) {
						return <span key={token.key}>{token.text}</span>;
					}

					return (
						<button
							key={token.key}
							type="button"
							tabIndex={disabled ? -1 : 0}
							className={cn(
								"cursor-pointer rounded-sm transition-colors duration-100",
								"decoration-lime-400/60 decoration-dotted underline-offset-4 hover:underline",
								"hover:bg-lime-100/60",
								disabled && "pointer-events-none",
							)}
							onClick={(e) => {
								if (!token.word) return;
								e.stopPropagation();
								setSelectedWord(token.word.toLowerCase());
								setAnchorEl(e.currentTarget);
							}}
						>
							{token.text}
						</button>
					);
				})}
			</span>

			{selectedWord && anchorEl && (
				<WordPopover
					word={selectedWord}
					anchorEl={anchorEl}
					onClose={() => {
						setSelectedWord(null);
						setAnchorEl(null);
					}}
				/>
			)}
		</>
	);
}
