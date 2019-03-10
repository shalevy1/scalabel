import {sprintf} from 'sprintf-js';

window.onload = function() {
    window.imageIndex = -1;
    updateImage();
    let nextButton = document.getElementById('next');
    let labelButton = document.getElementById('label');
    if (nextButton) {
        nextButton.onclick = function() {
            updateImage();
        };
    }
    if (labelButton) {
        labelButton.onclick = function() {
            getLabels();
        };
    }
    requestGateInfo();
};

/**
 * Set up gate info
 */
function requestGateInfo() {
  let xhr = new XMLHttpRequest();
  xhr.open('GET', './gateway');
  xhr.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      let data = JSON.parse(this.responseText);
      let addr = data['Addr'];
      let port = data['Port'];
      window.websockets = [];
      registerWebsocket('0', 0, addr, port)
    }
  };
  xhr.send();
}

/**
 * Registers the session with a websocket server
 * @param {string} sessionId - The ID of the session
 * @param {number} sessionIndex - The index of the session in window.websockets
 * @param {string} addr - Address of the gateway server
 * @param {string} port - Port of the gateway server
 */
function registerWebsocket(sessionId: string, sessionIndex: number,
                            addr: string, port: string) {
  let websocket = new WebSocket(`ws://${addr}:${port}/register`);
  window.websockets.push(websocket);

  //registration connection- do nothing with its response
  websocket.onopen = function() {
    websocket.send(JSON.stringify({
      sessionId: sessionId,
      startTime: window.performance.now().toString(),
    }));
  };

  websocket.onmessage = function(e) {
    let data = {};
    if (typeof e.data === 'string') {
      data = JSON.parse(e.data);
    }
    if (data['bboxData']) {
        let boundingBoxes = JSON.parse(data['bboxData']);
        console.log(boundingBoxes);
        for (let i = 0; i < boundingBoxes.length; i++) {
            let bb = boundingBoxes[i];
            let imageCanvas = document.getElementById('image-canvas');
            let imageCtx = imageCanvas.getContext('2d');
            imageCtx.lineWidth = 3;
            imageCtx.strokeRect(bb.x, bb.y, bb.w, bb.h);
            imageCtx.restore();
        }
    }

  };
  websocket.onclose = function() {
  };
}

/**
 * Gets sample URLs for images numbered from 51 to 99
 * @return {string} url - Current sample url
 */
function getNextSampleUrl() {
    let trueIndex = (window.imageIndex % 49) + 51;
    let url = sprintf('https://s3-us-west-2.amazonaws.com/scalabel-public/demo/frames/intersection-00000%d.jpg', trueIndex);
    return url;
}

/**
 * Change the image to the next one, and clear any labels
 */
function updateImage() {
    window.imageIndex += 1;
    let image = new Image(1280, 720);
    let url = getNextSampleUrl();
    image.onload=function() {
        let canvasElement = (document.getElementById('image-canvas'): any);
        let canvas = (canvasElement: HTMLCanvasElement);

        let imageCtx = canvas.getContext('2d');
        imageCtx.clearRect(0, 0, 1280, 720);
        imageCtx.drawImage(image, 0, 0);
        imageCtx.restore();
    };
    image.src = url;
}

/**
 * Requests labels from the backend, and applies them to the image
 */
function getLabels() {
    window.websockets[0].send(JSON.stringify({
      message: getNextSampleUrl(),
      startTime: window.performance.now().toString(),
      messageType: 'bbox',
    }));
}
