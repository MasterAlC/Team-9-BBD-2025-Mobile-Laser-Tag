
// Access all HTML elements for colour detection
const REGION_SIZE = 100;
const COLOUR_THRESHOLD = 150;
const PIXEL_COUNT_THRESHOLD = 500;

// Select video, canvas, and result elements
const video = document.getElementById('video');
const resultDiv = document.getElementById('result');

// Create hidden canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

function initCameraDetection() {
    // Gain access to video stream
    navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}}).then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        resultDiv.innerText = 'Camera access denied';
        console.error(err)
    })
}

function detectColor() {
    // Detect colour at centre of camera feed
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const startX = Math.floor(centerX - REGION_SIZE / 2);
    const startY = Math.floor(centerY - REGION_SIZE / 2);

    const imageData = ctx.getImageData(startX, startY, REGION_SIZE, REGION_SIZE);
    const data = imageData.data;

    let redCount = 0;
    let blueCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r > COLOUR_THRESHOLD && r > g + 30 && r > b + 30) redCount++;
      else if (b > COLOUR_THRESHOLD && b > g + 30 && b > r + 30) blueCount++;
    }

    if (redCount > blueCount && redCount > PIXEL_COUNT_THRESHOLD) {
      resultDiv.innerText = 'HEADSHOT on RED 🔴!';
      return "red"
    } else if (blueCount > redCount && blueCount > PIXEL_COUNT_THRESHOLD) {
      resultDiv.innerText = 'HEADSHOT on BLUE 🔵!';
      return "blue"
    } else {
      resultDiv.innerText = 'Blank shot';
      return "blank"
    }
}

export {initCameraDetection, detectColor};
