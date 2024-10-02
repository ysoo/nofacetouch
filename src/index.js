"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function setupWebCam() {
    return __awaiter(this, void 0, void 0, function* () {
        const videoElement = document.createElement("video");
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        try {
            const stream = yield navigator.mediaDevices.getUserMedia({
                video: true,
            });
            videoElement.srcObject = stream;
            document.body.appendChild(videoElement);
        }
        catch (err) {
            console.error("Error accessing webcam", err);
        }
        return videoElement;
    });
}
function startDetection() {
    return __awaiter(this, void 0, void 0, function* () {
        const videoElement = yield setupWebCam();
        const onFrame = () => {
            requestAnimationFrame(onFrame);
        };
        onFrame();
    });
}
startDetection();
