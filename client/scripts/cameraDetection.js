
function shoot(colour) {
  // This function communicates the shoot operation to the server.
  console.log("Sending shoot signal to server. Detected color:", colour);
}

function initCameraDetection() {
    const REGION_SIZE = 100;
    const COLOUR_THRESHOLD = 150;
    const PIXEL_COUNT_THRESHOLD = 500;
    
    // Select video, canvas, and result elements
    const video = document.getElementById('video');
    const resultDiv = document.getElementById('result');
    const shootButton = document.getElementById('shootButton');

    // Create hidden canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Gain access to video stream
    navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}}).then(stream => {
        video.srcObject = stream;
        console.log(video)
    })
    .catch(err => {
        resultDiv.innerText = 'Camera access denied';
        console.error(err)
    })

    function detectColor() {

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
          resultDiv.innerText = '🔴 Shot red';
          return "RED"
        } else if (blueCount > redCount && blueCount > PIXEL_COUNT_THRESHOLD) {
          resultDiv.innerText = '🔵 Shot blue';
          return "BLUE"
        } else {
          resultDiv.innerText = 'Blank shot';
          return "BLANK"
        }

        //requestAnimationFrame(detectColor)
    }

    // video.addEventListener('play', () => {
    //     requestAnimationFrame(detectColor);
    // });
    shootButton.addEventListener('click', () => {
      console.log('Shoot button pressed!'); 
      let colour = detectColor();
      shoot(colour) 
    });
}

  

export {initCameraDetection};
