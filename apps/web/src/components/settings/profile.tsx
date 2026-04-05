import { env } from "@english.now/env/client";
import { useTranslation } from "@english.now/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/utils/trpc";

const TIMEZONE_OPTIONS =
	typeof Intl.supportedValuesOf === "function"
		? Intl.supportedValuesOf("timeZone")
		: ["UTC"];

export const Profile = () => {
	const navigate = useNavigate();
	const { t } = useTranslation("app");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: session } = authClient.useSession();
	const { data: profile, isLoading: isLoadingProfile } = useQuery(
		trpc.profile.get.queryOptions(),
	);
	const [name, setName] = useState(session?.user?.name || "");
	const [detectedTimezone, setDetectedTimezone] = useState("UTC");
	const [timezone, setTimezone] = useState("UTC");
	const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	// Delete account state
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const deleteKeyword = "DELETE";

	const updateTimezoneMutation = useMutation(
		trpc.profile.updateProfile.mutationOptions({
			onSuccess: async () => {
				await queryClient.invalidateQueries({
					queryKey: trpc.profile.get.queryKey(),
				});
				toast.success(t("settings.profile.toasts.timezoneUpdated"));
			},
			onError: (error) => {
				toast.error(
					error.message || t("settings.profile.toasts.timezoneUpdateError"),
				);
			},
		}),
	);

	useEffect(() => {
		setDetectedTimezone(
			Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
		);
	}, []);

	useEffect(() => {
		if (isLoadingProfile) {
			return;
		}

		setTimezone(profile?.timezone || detectedTimezone);
	}, [detectedTimezone, isLoadingProfile, profile?.timezone]);

	const handleUpdateProfile = async () => {
		if (!name.trim()) {
			toast.error(t("settings.profile.toasts.nameRequired"));
			return;
		}

		setIsUpdatingProfile(true);
		try {
			await authClient.updateUser({
				name: name.trim(),
			});
			toast.success(t("settings.profile.toasts.profileUpdated"));
		} catch (error) {
			toast.error(t("settings.profile.toasts.profileUpdateError"));
			console.error(error);
		} finally {
			setIsUpdatingProfile(false);
		}
	};

	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error(t("settings.profile.toasts.invalidImageType"));
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error(t("settings.profile.toasts.imageTooLarge"));
			return;
		}

		// Show preview
		const reader = new FileReader();
		reader.onload = (e) => {
			setAvatarPreview(e.target?.result as string);
		};
		reader.readAsDataURL(file);

		// Upload to R2 through server
		setIsUploadingAvatar(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`${env.VITE_SERVER_URL}/api/upload/avatar`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(
					error.error || t("settings.profile.toasts.avatarUploadError"),
				);
			}

			const { publicUrl } = await response.json();

			// Update user profile with new avatar URL
			await authClient.updateUser({
				image: publicUrl,
			});

			toast.success(t("settings.profile.toasts.avatarUpdated"));
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("settings.profile.toasts.avatarUploadError"),
			);
			console.error(error);
			setAvatarPreview(null);
		} finally {
			setIsUploadingAvatar(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (deleteConfirmation !== deleteKeyword) {
			toast.error(
				t("settings.profile.toasts.deleteKeywordRequired", {
					keyword: deleteKeyword,
				}),
			);
			return;
		}

		setIsDeleting(true);
		try {
			await authClient.deleteUser();
			toast.success(t("settings.profile.toasts.accountDeleted"));
			navigate({ to: "/" });
		} catch (error) {
			toast.error(t("settings.profile.toasts.accountDeleteError"));
			console.error(error);
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const currentAvatar = avatarPreview || session?.user?.image;
	const savedTimezone = profile?.timezone || detectedTimezone;
	const hasTimezoneChanges = timezone !== savedTimezone;

	if (isLoadingProfile) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<>
			<div className="space-y-5">
				<h2 className="font-semibold">{t("settings.account")}</h2>
				<div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={handleAvatarClick}
							disabled={isUploadingAvatar}
							className="group relative size-12 overflow-hidden rounded-full border-2 border-transparent border-dashed transition-colors hover:border-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							{currentAvatar ? (
								<img
									src={currentAvatar}
									alt={session?.user?.name ?? t("settings.profile.avatarAlt")}
									className="size-full rounded-full object-cover"
								/>
							) : (
								<div className="flex size-full items-center justify-center rounded-full bg-neutral-200 font-bold font-lyon text-2xl text-neutral-500 uppercase">
									{session?.user?.name?.charAt(0) ?? "?"}
								</div>
							)}
							<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
								{isUploadingAvatar ? (
									<Loader2 className="size-5 animate-spin text-white" />
								) : (
									<Camera className="size-5 text-white" />
								)}
							</div>
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/*"
							onChange={handleFileSelect}
							className="hidden"
						/>
						<p className="text-muted-foreground text-sm">
							{t("settings.profile.avatarHelp")} <br />
							{t("settings.profile.avatarRequirements")}
						</p>
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="name">{t("settings.profile.nameLabel")}</Label>
					<div className="flex gap-3">
						<Input
							id="name"
							value={name || session?.user?.name || ""}
							onChange={(e) => setName(e.target.value)}
							placeholder={t("settings.profile.namePlaceholder")}
							className="max-w-xs rounded-xl"
						/>
						{name && name !== session?.user?.name && (
							<Button
								onClick={handleUpdateProfile}
								disabled={isUpdatingProfile}
								className="rounded-xl"
							>
								{isUpdatingProfile && (
									<Loader2 className="size-4 animate-spin" />
								)}
								{t("settings.common.save")}
							</Button>
						)}
					</div>
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">{t("settings.profile.emailLabel")}</Label>
					<div>
						<Input
							id="email"
							value={session?.user?.email ?? ""}
							disabled
							className="max-w-xs rounded-xl bg-muted/50"
						/>
						<p className="mt-2 text-muted-foreground text-sm">
							{t("settings.profile.emailHelp")}
						</p>
					</div>
				</div>
				<hr className="my-5 border-border/50" />
				<div className="space-y-2">
					<Label htmlFor="timezone">
						{t("settings.profile.timezoneLabel")}
					</Label>
					<div className="flex gap-3">
						<NativeSelect
							id="timezone"
							value={timezone}
							onChange={(e) => setTimezone(e.target.value)}
							disabled={isLoadingProfile || updateTimezoneMutation.isPending}
							className="min-w-[20rem] rounded-xl"
						>
							{TIMEZONE_OPTIONS.map((timezoneOption) => (
								<NativeSelectOption key={timezoneOption} value={timezoneOption}>
									{timezoneOption.replaceAll("_", " ")}
								</NativeSelectOption>
							))}
						</NativeSelect>
						{hasTimezoneChanges && (
							<Button
								onClick={() =>
									updateTimezoneMutation.mutate({
										timezone,
									})
								}
								disabled={updateTimezoneMutation.isPending}
								className="rounded-xl"
							>
								{updateTimezoneMutation.isPending && (
									<Loader2 className="size-4 animate-spin" />
								)}
								{t("settings.common.save")}
							</Button>
						)}
					</div>
					<p className="text-muted-foreground text-sm">
						{t("settings.profile.timezoneDetected", {
							timezone: detectedTimezone,
						})}
					</p>
				</div>
			</div>
			<hr className="my-5 border-border/50" />
			<div className="mb-4">
				<h3 className="font-medium text-sm">
					{t("settings.profile.deleteTitle")}
				</h3>
				<p className="mt-1 text-muted-foreground text-sm">
					{t("settings.profile.deleteDescription")}
				</p>
			</div>
			<Button
				variant="destructive"
				className="shrink-0 rounded-xl"
				onClick={() => setShowDeleteDialog(true)}
			>
				<Trash2 className="size-4" />
				{t("settings.profile.deleteButton")}
			</Button>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="text-destructive">
							{t("settings.profile.deleteDialog.title")}
						</DialogTitle>
						<DialogDescription>
							{t("settings.profile.deleteDialog.description")}
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Label htmlFor="confirm-delete" className="text-sm">
							{
								t("settings.profile.deleteDialog.confirmLabel", {
									keyword: deleteKeyword,
								}).split(deleteKeyword)[0]
							}
							<span className="font-mono font-semibold">{deleteKeyword}</span>
							{
								t("settings.profile.deleteDialog.confirmLabel", {
									keyword: deleteKeyword,
								}).split(deleteKeyword)[1]
							}
						</Label>
						<Input
							id="confirm-delete"
							value={deleteConfirmation}
							onChange={(e) => setDeleteConfirmation(e.target.value)}
							placeholder={deleteKeyword}
							className="mt-2"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowDeleteDialog(false);
								setDeleteConfirmation("");
							}}
						>
							{t("settings.profile.deleteDialog.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={deleteConfirmation !== deleteKeyword || isDeleting}
						>
							{isDeleting ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Trash2 className="size-4" />
							)}
							{t("settings.profile.deleteDialog.confirmButton")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
