import { useEffect, useState } from "react";

export default function useAudioDevices(enabled: boolean) {
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<string>("");

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

		if (enabled) {
			getDevices();
		}
	}, [enabled, selectedDevice]);

	return {
		audioDevices,
		selectedDevice,
		setSelectedDevice,
	};
}
