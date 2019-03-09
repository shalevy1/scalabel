import {sprintf} from 'sprintf-js';

window.onload = function() {
    window.imageIndex = 0;
    updateImage();
    let nextButton = document.getElementById("next");
    let labelButton = document.getElementById("label");
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
};
/**
 * Gets sample URLs for images numbered from 51 to 99
 */
function getNextSampleUrl() {
    let trueIndex = (window.imageIndex % 49) + 51;
    let url = sprintf("https://s3-us-west-2.amazonaws.com/scalabel-public/demo/frames/intersection-00000%d.jpg", trueIndex);
    return url;
}

/**
 * Change the image to the next one, and clear any labels
 */
function updateImage() {
    let image = new Image(1280, 720);
    let url = getNextSampleUrl();
    image.onload=function(){
        console.log("loaded");
        let imageCanvas = document.getElementById('image-canvas');
        let imageCtx = imageCanvas.getContext('2d');
        imageCtx.clearRect(0, 0, 1280, 720);
        imageCtx.drawImage(image, 0, 0);
        imageCtx.restore();
        window.imageIndex += 1;
    }
    image.src = url;
}

/**
 * Requests labels from the backend, and applies them to the image
 */
function getLabels() {
    // test case: should be centered in x, top of y
    let boundingBoxes = [[[600, 700], [10, 110]]];
    for (let i = 0; i < boundingBoxes.length; i++) {
        let boundingBox = boundingBoxes[i];
        let xCoords = boundingBox[0];
        let yCoords = boundingBox[1];
        let w = xCoords[1] - xCoords[0];
        let h = yCoords[1] - yCoords[0];
        let imageCanvas = document.getElementById('image-canvas');
        let imageCtx = imageCanvas.getContext('2d');
        imageCtx.lineWidth = 3;
        imageCtx.strokeRect(xCoords[0], yCoords[0], w, h);
        imageCtx.restore();
    }
}
