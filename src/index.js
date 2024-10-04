const videoElement = document.getElementById("videoElement");
const canvasElement = document.getElementById("outputCanvas");
const canvasCtx = canvasElement.getContext("2d");
const touchTextElement = document.getElementById("touchText");

// Adjust the canvas size to match video resolution
videoElement.width = canvasElement.width;
videoElement.height = canvasElement.height;

latestHandResults = null;
latestFaceResults = null;

function onFaceResults(results) {
	latestFaceResults = results;
	requestAnimationFrame(drawFaceAndHandLandmarks);
	checkDistance();
}

function onHandsResults(results) {
	latestHandResults = results;
	requestAnimationFrame(drawFaceAndHandLandmarks);
	// Collection of detected/tracked hands, where each hand is represented as a list of 21 hand landmarks
	// each landmark is composed of x, y and z. x and y are normalized to [0.0, 1.0] by the image width and height respectively.
	// z represents the landmark depth with the depth at the wrist being the origin,
	// and the smaller the value the closer the landmark is to the camera.
	// The magnitude of z uses roughly the same scale as x.
}

function checkDistance() {
	if (!latestFaceResults) {
		return;
	}
	// Collection of detected/tracked faces, where each face is represented as a list of 468 face landmarks and each landmark is composed of x, y and z.
	// x and y are normalized to [0.0, 1.0] by the image width and height respectively.
	// z represents the landmark depth with the depth at center of the head being the origin,
	// and the smaller the value the closer the landmark is to the camera.
	// The magnitude of z uses roughly the same scale as x.
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

	if (
		latestHandResults &&
		latestFaceResults &&
		latestFaceResults.multiFaceLandmarks &&
		latestHandResults.multiHandLandmarks
	) {
		const faceLandmarks = latestFaceResults.multiFaceLandmarks[0];
		const multihandLandmarks = latestHandResults.multiHandLandmarks;

		const leftIrisSize = calculateLeftIrisSize(faceLandmarks);
		// Check for collision between face and hand landmarks

		if (checkCollision(faceLandmarks, multihandLandmarks, leftIrisSize)) {
			playAudio();
			showTouchText();
		} else {
			hideTouchText();
		}
		printZ(multihandLandmarks);
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

function startbeep() {
	var context = new AudioContext();
	var oscillator = context.createOscillator();
	oscillator.type = "sine";
	oscillator.frequency.value = 700;
	oscillator.connect(context.destination);
	oscillator.start();
	// setTimeout(function () {
	// 	oscillator.stop();
	// }, 50);
}

let audio = document.getElementById("myAudio");

function playAudio() {
	audio.play();
}

const COLLISION_THRESHOLD = 0.05;

function printZ(multiHandLandmarks) {
	if (!multiHandLandmarks) {
		return;
	}
	// if (multiHandLandmarks[0]) {
	// 	console.log("hand1 z: ", multiHandLandmarks[0][4].z);
	// }
	// if (multiHandLandmarks[1]) {
	// 	console.log("hand2 z: ", multiHandLandmarks[1][4].z);
	// }
	if (multiHandLandmarks[0] && multiHandLandmarks[1]) {
		// console.log("distance between thumbs: ", calculateZDistance(multiHandLandmarks[0], multiHandLandmarks[1]));
	}
}

function calculateZDistance(hand1, hand2) {
	point1 = hand1[4];
	point2 = hand2[4];
	const dz = (point1.z - point2.z) * 100;
	return Math.sqrt(dz * dz);
}

function checkCollision(faceLandmarks, multihandLandmarks, irisSize) {
	if (!faceLandmarks || !multihandLandmarks) {
		return;
	}
	const normalizedFaceLandmarks = normalizeLandmarksByIrisSize(
		faceLandmarks,
		irisSize
	);

	for (let handLandmarks of multihandLandmarks) {
		const normalizedHandLandmarks = normalizeLandmarksByIrisSize(
			handLandmarks,
			irisSize
		);
		for (let faceLandmark of normalizedFaceLandmarks) {
			for (let handLandmark of normalizedHandLandmarks) {
				const distance = calculateDistance(handLandmark, faceLandmark);
				if (distance < COLLISION_THRESHOLD) {
					return true;
				}
			}
		}
	}
	return false;
}// Function to show the "Touched!" text
function showTouchText() {
	touchTextElement.style.display = "block"; // Show the text
}

// Function to hide the "Touched!" text
function hideTouchText() {
	touchTextElement.style.display = "none"; // Hide the text
}

function calculateLeftIrisSize(landmarks) {
	// center, right, up, left, down
	const irisTop = landmarks[474]; // right
	const irisBottom = landmarks[476]; // left

	const dx = irisTop.x - irisBottom.x;

	return Math.sqrt(dx * dx);
}

function normalizeLandmarksByIrisSize(landmarks, irisSize) {
	return landmarks.map((landmark) => ({
		x: landmark.x,
		y: landmark.y,
		z: landmark.z, // irisSize, // Scale z by the iris size
	}));
}

function calculateDistance(point1, point2) {
	const dx = point1.x - point2.x;
	const dy = point1.y - point2.y;
	const dz = point1.z - point2.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
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
	width: 960,
	height: 540,
});
camera.start();
