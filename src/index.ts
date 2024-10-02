async function setupWebCam(): Promise<HTMLVideoElement> {
	const videoElement: HTMLVideoElement = document.createElement("video");
	videoElement.autoplay = true;
	videoElement.playsInline = true;

	try {
		const stream: MediaStream = await navigator.mediaDevices.getUserMedia({
			video: true,
		});
		videoElement.srcObject = stream;
		document.body.appendChild(videoElement);
	} catch (err) {
		console.error("Error accessing webcam", err);
	}

	return videoElement;
}

async function startDetection() {
	const videoElement: HTMLVideoElement = await setupWebCam();

	const onFrame = () => {
		requestAnimationFrame(onFrame);
	};

	onFrame();
}
startDetection();
