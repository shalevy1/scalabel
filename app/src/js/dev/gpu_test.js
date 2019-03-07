window.onload = function() {
    let image = new Image(1280, 720);
    image.src = "https://s3-us-west-2.amazonaws.com/scalabel-public/demo/frames/intersection-0000051.jpg";
    document.getElementById("image").src = image.src;
};
