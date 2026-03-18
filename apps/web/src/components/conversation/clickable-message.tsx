import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { WordPopover } from "./word-popover";

type ClickableMessageProps = {
	sessionId: string;
	content: string;
	vocabMode: "off" | "word" | "phrase";
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
	sessionId,
	content,
	vocabMode,
	disabled,
}: ClickableMessageProps) {
	const [selectedWord, setSelectedWord] = useState<string | null>(null);
	const [selectedPhraseKeys, setSelectedPhraseKeys] = useState<string[]>([]);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const tokens = useMemo(() => tokenize(content), [content]);
	const selectedPhrase = useMemo(() => {
		if (selectedPhraseKeys.length === 0) return "";
		return tokens
			.filter((token) => token.word && selectedPhraseKeys.includes(token.key))
			.map((token) => token.word)
			.join(" ");
	}, [selectedPhraseKeys, tokens]);

	useEffect(() => {
		setSelectedWord(null);
		setSelectedPhraseKeys([]);
		setAnchorEl(null);
	}, [content, vocabMode]);

	if (vocabMode === "off") {
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
							data-vocab-token="true"
							tabIndex={disabled ? -1 : 0}
							className={cn(
								"cursor-pointer rounded-sm transition-colors duration-100",
								"decoration-lime-400/60 decoration-dotted underline-offset-4 hover:underline",
								vocabMode === "word" && "hover:bg-lime-100/60",
								vocabMode === "phrase" && "hover:bg-sky-100/60",
								selectedPhraseKeys.includes(token.key) &&
									"bg-sky-100 text-sky-800 underline",
								disabled && "pointer-events-none",
							)}
							onClick={(e) => {
								if (!token.word) return;
								e.stopPropagation();
								if (vocabMode === "word") {
									setSelectedPhraseKeys([]);
									setSelectedWord(token.word);
									setAnchorEl(e.currentTarget);
									return;
								}

								setSelectedWord(null);
								const nextSelection = selectedPhraseKeys.includes(token.key)
									? selectedPhraseKeys.filter((key) => key !== token.key)
									: [...selectedPhraseKeys, token.key];
								setSelectedPhraseKeys(nextSelection);
								setAnchorEl(nextSelection.length > 0 ? e.currentTarget : null);
							}}
						>
							{token.text}
						</button>
					);
				})}
			</span>

			{selectedWord && anchorEl && (
				<WordPopover
					sessionId={sessionId}
					text={selectedWord}
					mode="word"
					anchorEl={anchorEl}
					onClose={() => {
						setSelectedWord(null);
						setAnchorEl(null);
					}}
				/>
			)}
			{vocabMode === "phrase" &&
			selectedPhraseKeys.length > 1 &&
			selectedPhrase &&
			anchorEl ? (
				<WordPopover
					sessionId={sessionId}
					text={selectedPhrase}
					mode="phrase"
					selectionCount={selectedPhraseKeys.length}
					anchorEl={anchorEl}
					onClose={() => {
						setSelectedPhraseKeys([]);
						setAnchorEl(null);
					}}
				/>
			) : null}
		</>
	);
}
