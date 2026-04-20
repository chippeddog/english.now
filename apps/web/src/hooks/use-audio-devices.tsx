import { useEffect, useState } from "react";

export default function useAudioDevices(enabled: boolean) {
	const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
	const [selectedDevice, setSelectedDevice] = useState<string>("");
	const [microphoneAccess, setMicrophoneAccess] = useState<
		"unknown" | "granted" | "denied"
	>("unknown");

	useEffect(() => {
		const getDevices = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const devices = await navigator.mediaDevices.enumerateDevices();
				const audioInputs = devices.filter(
					(device) => device.kind === "audioinput",
				);

				setMicrophoneAccess("granted");
				setAudioDevices(audioInputs);

				const hasSelectedDevice = audioInputs.some(
					(device) => device.deviceId === selectedDevice,
				);
				if (audioInputs.length > 0 && !hasSelectedDevice) {
					setSelectedDevice(audioInputs[0]?.deviceId ?? "");
				}

				for (const track of stream.getTracks()) {
					track.stop();
				}
			} catch (err) {
				setMicrophoneAccess("denied");
				setAudioDevices([]);
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
		microphoneAccess,
	};
}
