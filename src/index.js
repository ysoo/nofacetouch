const videoElement = document.getElementById("videoElement");
const canvasElement = document.getElementById("outputCanvas");
const canvasCtx = canvasElement.getContext("2d");

// Adjust the canvas size to match video resolution
videoElement.width = canvasElement.width;
videoElement.height = canvasElement.height;

latestHandResults = null;
latestFaceResults = null;

function onFaceResults(results) {
	latestFaceResults = results;
	requestAnimationFrame(drawFaceAndHandLandmarks);
}

function onHandsResults(results) {
	latestHandResults = results;
	requestAnimationFrame(drawFaceAndHandLandmarks);
}

function drawFaceAndHandLandmarks() {
	canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
	canvasCtx.drawImage(
		videoElement,
		0,
		0,
		canvasElement.width,
		canvasElement.height
	);
	if (latestFaceResults && latestFaceResults.multiFaceLandmarks) {
		for (const landmarks of latestFaceResults.multiFaceLandmarks) {
			drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
				color: "#C0C0C070",
				lineWidth: 1,
			});
			drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {
				color: "#FF3030",
			});
			drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {
				color: "#30FF30",
			});
			drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {
				color: "#E0E0E0",
			});
			drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: "#E0E0E0" });
		}
	}

	if (latestHandResults && latestHandResults.multiHandLandmarks) {
		for (const landmarks of latestHandResults.multiHandLandmarks) {
			drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
				color: "#00FF00",
				lineWidth: 5,
			});
			drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 2 });
		}
	}

	canvasCtx.restore();
}

function initializeFaceMesh() {
	const faceMesh = new FaceMesh({
		locateFile: (file) =>
			`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
	});
	faceMesh.setOptions({
		maxNumFaces: 1,
		refineLandmarks: true,
		minDetectionConfidence: 0.5,
		minTrackingConfidence: 0.5,
	});

	return faceMesh;
}

function initializeHandsMesh() {
	const hands = new Hands({
		locateFile: (file) => {
			return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
		},
	});
	hands.setOptions({
		maxNumHands: 2,
		modelComplexity: 1,
		minDetectionConfidence: 0.5,
		minTrackingConfidence: 0.5,
	});
	return hands;
}

faceMesh = initializeFaceMesh();
faceMesh.onResults(onFaceResults);

handsMesh = initializeHandsMesh();
handsMesh.onResults(onHandsResults);

// Set up the webcam and use it as input for FaceMesh
const camera = new Camera(videoElement, {
	onFrame: async () => {
		await faceMesh.send({ image: videoElement });
		await handsMesh.send({ image: videoElement });
	},
	width: 1280,
	height: 720,
});
camera.start();
