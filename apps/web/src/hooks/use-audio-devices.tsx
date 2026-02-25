import { useEffect, useState } from "react";

export default function useAudioDevices() {
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<string>("");
	const [settingsOpen, setSettingsOpen] = useState(false);

	useEffect(() => {
		const getDevices = async () => {
			try {
				await navigator.mediaDevices.getUserMedia({ audio: true });
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioInputs = devices.filter(
					(device) => device.kind === "audioinput",
				);
				setAudioDevices(audioInputs);
				if (audioInputs.length > 0 && !selectedDevice) {
					setSelectedDevice(audioInputs[0].deviceId);
				}
			} catch (err) {
				console.error("Error getting audio devices:", err);
			}
		};

		if (settingsOpen) {
			getDevices();
		}
	}, [settingsOpen, selectedDevice]);

	return {
		audioDevices,
		selectedDevice,
		setSelectedDevice,
		settingsOpen,
		setSettingsOpen,
	};
}
