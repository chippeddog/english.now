import { env } from "@english.now/env/client";
import { useNavigate } from "@tanstack/react-router";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
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
import { authClient } from "@/lib/auth-client";

export const Profile = () => {
	const navigate = useNavigate();
	const { data: session } = authClient.useSession();
	const [name, setName] = useState(session?.user?.name || "");
	const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	// Delete account state
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	const handleUpdateProfile = async () => {
		if (!name.trim()) {
			toast.error("Name cannot be empty");
			return;
		}

		setIsUpdatingProfile(true);
		try {
			await authClient.updateUser({
				name: name.trim(),
			});
			toast.success("Profile updated successfully");
		} catch (error) {
			toast.error("Failed to update profile");
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
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image must be smaller than 5MB");
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
				throw new Error(error.error || "Failed to upload image");
			}

			const { publicUrl } = await response.json();

			// Update user profile with new avatar URL
			await authClient.updateUser({
				image: publicUrl,
			});

			toast.success("Avatar updated successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to upload avatar",
			);
			console.error(error);
			setAvatarPreview(null);
		} finally {
			setIsUploadingAvatar(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (deleteConfirmation !== "DELETE") {
			toast.error('Please type "DELETE" to confirm');
			return;
		}

		setIsDeleting(true);
		try {
			await authClient.deleteUser();
			toast.success("Account deleted successfully");
			navigate({ to: "/" });
		} catch (error) {
			toast.error("Failed to delete account");
			console.error(error);
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const currentAvatar = avatarPreview || session?.user?.image;
	return (
		<>
			<div className="space-y-6">
				<div>
					<div>
						<button
							type="button"
							onClick={handleAvatarClick}
							disabled={isUploadingAvatar}
							className="group relative size-16 overflow-hidden rounded-full border-2 border-transparent border-dashed transition-colors hover:border-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							{currentAvatar ? (
								<img
									src={currentAvatar}
									alt={session?.user?.name ?? "Avatar"}
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
					</div>
				</div>

				{/* Name */}
				<div>
					<Label htmlFor="name" className="text-muted-foreground">
						Name
					</Label>
					<div className="mt-2 flex gap-3">
						<Input
							id="name"
							value={name || session?.user?.name || ""}
							onChange={(e) => setName(e.target.value)}
							placeholder="Your name"
							className="max-w-md rounded-xl"
						/>
						{name && name !== session?.user?.name && (
							<Button
								onClick={handleUpdateProfile}
								disabled={isUpdatingProfile}
								className="rounded-xl"
							>
								{isUpdatingProfile ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Check className="size-4" />
								)}
								Save
							</Button>
						)}
					</div>
				</div>

				{/* Email */}
				<div>
					<Label htmlFor="email" className="text-muted-foreground">
						Email
					</Label>
					<div className="mt-2">
						<Input
							id="email"
							value={session?.user?.email ?? ""}
							disabled
							className="max-w-md rounded-xl bg-muted/50"
						/>
						<p className="mt-2 text-muted-foreground text-sm">
							If you need to change your email, please contact support.
						</p>
					</div>
				</div>
			</div>
			<div className="mt-6">
				{" "}
				<hr className="mt-2 mb-4 border-border/50" />
				<div className="flex flex-col items-start justify-between gap-4">
					<div>
						<h3 className="font-medium text-destructive">Delete Account</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							Permanently delete your account and all associated data. This
							action cannot be undone.
						</p>
					</div>
					<Button
						variant="destructive"
						className="shrink-0 rounded-xl"
						onClick={() => setShowDeleteDialog(true)}
					>
						<Trash2 className="size-4" />
						Delete
					</Button>
				</div>
			</div>
			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle className="text-destructive">
							Delete Account
						</DialogTitle>
						<DialogDescription>
							This action is irreversible. All your data, progress, and
							subscription will be permanently deleted.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Label htmlFor="confirm-delete" className="text-sm">
							Type <span className="font-mono font-semibold">DELETE</span> to
							confirm
						</Label>
						<Input
							id="confirm-delete"
							value={deleteConfirmation}
							onChange={(e) => setDeleteConfirmation(e.target.value)}
							placeholder="DELETE"
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
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteAccount}
							disabled={deleteConfirmation !== "DELETE" || isDeleting}
						>
							{isDeleting ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Trash2 className="size-4" />
							)}
							Delete Account
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
