import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	Modal,
	Platform,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { FieldLabel, SectionHeader } from "@/components/ui/section-header";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { getDeviceTimezone } from "@/lib/date";
import { signOut } from "@/lib/social-auth";
import { showMessage } from "@/lib/toast";
import { trpc } from "@/utils/trpc";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const DELETE_KEYWORD = "DELETE";

const inputClassName =
	"rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900";

async function uploadAvatar(asset: ImagePicker.ImagePickerAsset) {
	const formData = new FormData();
	const type = asset.mimeType ?? "image/jpeg";
	const name = asset.fileName ?? `avatar.${type.split("/")[1] ?? "jpg"}`;

	if (Platform.OS === "web" && asset.file) {
		formData.append("file", asset.file);
	} else {
		formData.append("file", { uri: asset.uri, name, type } as unknown as Blob);
	}

	const response = await apiFetch("/api/upload/avatar", {
		method: "POST",
		body: formData,
	});
	const json = (await response.json().catch(() => ({}))) as {
		publicUrl?: string;
		error?: string;
	};
	if (!response.ok || !json.publicUrl) {
		throw new Error(json.error || "Failed to upload avatar");
	}
	return json.publicUrl;
}

export function AccountSection() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { data: profile } = useQuery(trpc.profile.get.queryOptions());
	const user = session?.user;

	const [name, setName] = useState(user?.name ?? "");
	const [isSavingName, setIsSavingName] = useState(false);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	useEffect(() => {
		if (user?.name) {
			setName(user.name);
		}
	}, [user?.name]);

	const detectedTimezone = getDeviceTimezone();
	const timezone = profile?.timezone || detectedTimezone;
	const avatar = avatarPreview || user?.image;
	const hasNameChanges =
		name.trim() !== (user?.name ?? "") && name.trim() !== "";

	const handleSaveName = async () => {
		if (!name.trim()) {
			showMessage("Name cannot be empty");
			return;
		}
		setIsSavingName(true);
		const { error } = await authClient.updateUser({ name: name.trim() });
		setIsSavingName(false);
		showMessage(
			error ? "Failed to update profile" : "Profile updated successfully",
			error?.message,
		);
	};

	const handlePickAvatar = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return;

		if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
			showMessage("Please select an image file");
			return;
		}
		if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
			showMessage("Image must be smaller than 5MB");
			return;
		}

		setAvatarPreview(asset.uri);
		setIsUploadingAvatar(true);
		try {
			const publicUrl = await uploadAvatar(asset);
			const { error } = await authClient.updateUser({ image: publicUrl });
			if (error) throw new Error(error.message);
			showMessage("Avatar updated successfully");
		} catch (error) {
			setAvatarPreview(null);
			showMessage(
				"Failed to upload avatar",
				error instanceof Error ? error.message : undefined,
			);
		} finally {
			setIsUploadingAvatar(false);
		}
	};

	return (
		<View className="gap-5">
			<SectionHeader title="Account" />

			<View className="flex-row items-center gap-3">
				<Pressable
					onPress={handlePickAvatar}
					disabled={isUploadingAvatar}
					accessibilityRole="button"
					accessibilityLabel="Change avatar"
					className="size-16 overflow-hidden rounded-full bg-neutral-200"
				>
					{avatar ? (
						<Image source={{ uri: avatar }} className="size-full" />
					) : (
						<View className="size-full items-center justify-center">
							<Text className="font-bold text-2xl text-neutral-500 uppercase">
								{user?.name?.charAt(0) ?? "?"}
							</Text>
						</View>
					)}
					<View className="absolute right-0 bottom-0 left-0 items-center bg-black/40 py-0.5">
						{isUploadingAvatar ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Ionicons name="camera" size={14} color="#fff" />
						)}
					</View>
				</Pressable>
				<Text className="flex-1 text-neutral-500 text-sm">
					Tap to upload a new avatar.{"\n"}JPG, PNG or GIF. Max 5MB.
				</Text>
			</View>

			<View>
				<FieldLabel label="Name" />
				<View className="flex-row gap-2">
					<TextInput
						value={name}
						onChangeText={setName}
						placeholder="Your name"
						placeholderTextColor="#a3a3a3"
						autoCapitalize="words"
						className={`flex-1 ${inputClassName}`}
					/>
					{hasNameChanges ? (
						<Pressable
							onPress={handleSaveName}
							disabled={isSavingName}
							accessibilityRole="button"
							className="items-center justify-center rounded-xl bg-neutral-900 px-4 active:opacity-80"
						>
							{isSavingName ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Text className="font-semibold text-white">Save</Text>
							)}
						</Pressable>
					) : null}
				</View>
			</View>

			<View>
				<FieldLabel label="Email" />
				<TextInput
					value={user?.email ?? ""}
					editable={false}
					className={`${inputClassName} bg-neutral-100 text-neutral-500`}
				/>
				<Text className="mt-2 text-neutral-500 text-sm">
					If you need to change your email, please contact support.
				</Text>
			</View>

			<View>
				<FieldLabel label="Timezone" />
				<Pressable
					onPress={() => router.push("/settings/timezone")}
					accessibilityRole="button"
					className="min-h-12 flex-row items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 active:opacity-70"
				>
					<Text className="text-base text-neutral-900">
						{timezone.replaceAll("_", " ")}
					</Text>
					<Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
				</Pressable>
				<Text className="mt-2 text-neutral-500 text-sm">
					Detected from your device: {detectedTimezone}.
				</Text>
			</View>

			<View className="border-neutral-200 border-t pt-5">
				<Text className="font-medium text-neutral-900 text-sm">
					Delete Account
				</Text>
				<Text className="mt-1 mb-3 text-neutral-500 text-sm">
					Permanently delete your account and all data. This action cannot be
					undone.
				</Text>
				<Pressable
					onPress={() => setShowDeleteDialog(true)}
					accessibilityRole="button"
					className="flex-row items-center gap-2 self-start rounded-xl bg-red-600 px-4 py-2.5 active:opacity-80"
				>
					<Ionicons name="trash-outline" size={16} color="#fff" />
					<Text className="font-semibold text-white">Delete</Text>
				</Pressable>
			</View>

			<DeleteAccountDialog
				visible={showDeleteDialog}
				onClose={() => setShowDeleteDialog(false)}
			/>
		</View>
	);
}

function DeleteAccountDialog({
	visible,
	onClose,
}: {
	visible: boolean;
	onClose: () => void;
}) {
	const [confirmation, setConfirmation] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	const close = () => {
		setConfirmation("");
		onClose();
	};

	const handleDelete = async () => {
		if (confirmation !== DELETE_KEYWORD) return;
		setIsDeleting(true);
		const { error } = await authClient.deleteUser();
		setIsDeleting(false);
		if (error) {
			showMessage("Failed to delete account", error.message);
			return;
		}
		close();
		await signOut();
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={close}
		>
			<View className="flex-1 items-center justify-center bg-black/40 px-6">
				<View className="w-full max-w-sm rounded-3xl bg-white p-6">
					<Text className="mb-2 font-bold text-lg text-red-600">
						Delete Account
					</Text>
					<Text className="mb-4 text-neutral-500 text-sm">
						This action is irreversible. All your data, progress, and
						subscription will be permanently deleted.
					</Text>
					<Text className="mb-2 text-neutral-700 text-sm">
						Type <Text className="font-semibold">{DELETE_KEYWORD}</Text> to
						confirm
					</Text>
					<TextInput
						value={confirmation}
						onChangeText={setConfirmation}
						placeholder={DELETE_KEYWORD}
						placeholderTextColor="#a3a3a3"
						autoCapitalize="characters"
						autoCorrect={false}
						className={inputClassName}
					/>
					<View className="mt-5 flex-row justify-end gap-2">
						<Pressable
							onPress={close}
							accessibilityRole="button"
							className="rounded-xl border border-neutral-200 px-4 py-2.5 active:opacity-70"
						>
							<Text className="font-medium text-neutral-900">Cancel</Text>
						</Pressable>
						<Pressable
							onPress={handleDelete}
							disabled={confirmation !== DELETE_KEYWORD || isDeleting}
							accessibilityRole="button"
							className={`flex-row items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 active:opacity-80 ${confirmation !== DELETE_KEYWORD ? "opacity-50" : ""}`}
						>
							{isDeleting ? (
								<ActivityIndicator size="small" color="#fff" />
							) : null}
							<Text className="font-semibold text-white">Delete Account</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Modal>
	);
}
