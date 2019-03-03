import {hiddenStyleColor} from './utils';
import {UP_RES_RATIO, Rect, Vertex, VertexTypes} from './shape';
import {Vector3d} from './geometry';
import * as config3d from './config_3d';


/**
 * Base class for each image and view in browser.
 * @param {object} satImage: SatImage object on which the view is created
 * @param {str} suffix: suffix of canvas id
 * @param {bool} isAssistView: whether this view is an assistant view
 */
export function View(satImage, suffix, isAssistView=false) {
    this.satImage = satImage;
    this.suffix = suffix;
    this.isAssistView = isAssistView;

    this.divCanvas = document.getElementById('div_canvas' + suffix);
    this.imageCanvas = document.getElementById('image_canvas' + suffix);
    this.labelCanvas = document.getElementById('label_canvas' + suffix);
    this.hiddenCanvas = document.getElementById('hidden_canvas' + suffix);
    this.imageCtx = this.imageCanvas.getContext('2d');
    this.labelCtx = this.labelCanvas.getContext('2d');
    this.hiddenCtx = this.hiddenCanvas.getContext('2d');

    if (isAssistView) {
        this.image = satImage.imageSquare;
    } else {
        this.image = satImage.image;
    }
    this.scale = 1.0;
}


View.prototype.redraw = function() {
    this.redrawImageCanvas();
    this.redrawLabelCanvas();
    this.redrawHiddenCanvas();
};


View.prototype.redrawImageCanvas = function() {
    this.padBox = this._getPadding();
    let ctx = this.imageCtx;

    // clean background
    let [x, y] = [this.padBox.x * UP_RES_RATIO, this.padBox.y * UP_RES_RATIO];
    let [w, h] = [this.padBox.w * UP_RES_RATIO, this.padBox.h * UP_RES_RATIO];
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, x + w + x, y + h + y);

    if (this.satImage.mainViewType < 2) {
        ctx.clearRect(0, 0, this.padBox.w, this.padBox.h);
        ctx.drawImage(this.image,
            this.padBox.x, this.padBox.y, this.padBox.w, this.padBox.h);
    }

    if (this.satImage.imageData == null) {
        this.satImage.cacheImage();
        this.satImage.updateView = true;
    }

    // point cloud visualization
    if (config3d.USE_POINT_CLOUD) {
        if (!this.isAssistView && this.satImage.mainViewType > 0) {
            let pad = this._getPadding();
            if (this.satImage.mainViewType == 3) {
                for (let color in this.satImage.pointCloud) {
                    let points = this.satImage.pointCloud[color];
                    for (let p in points) {
                        let [pCoord, _, pColor] = points[p];
                        ctx.strokeStyle = pColor;
                        ctx.fillStyle = pColor;
                        let sX = (pad.x + pad.w * pCoord[0]);
                        let sY = (pad.y + pad.h * pCoord[1]);
                        ctx.fillRect(sX - 1, sY - 1, 3, 3);
                    }
                }
            } else {
                for (let color in this.satImage.pointCloud) {
                    ctx.strokeStyle = color;
                    ctx.fillStyle = color;
                    let points = this.satImage.pointCloud[color];
                    for (let p in points) {
                        let pCoord = points[p][0];
                        let sX = (pad.x + pad.w * pCoord[0]);
                        let sY = (pad.y + pad.h * pCoord[1]);
                        ctx.fillRect(sX - 1, sY - 1, 3, 3);
                    }
                }
            }
        }
        if (this.isAssistView && this.satImage.assistViewType > 0) {
            let pad = this._getPadding();
            for (let color in this.satImage.pointCloud) {
                let points = this.satImage.pointCloud[color];
                for (let p in points) {
                    let [_, pCoord3d, pColor] = points[p];
                    if ( this.satImage.assistViewType == 1) {
                        ctx.strokeStyle = color;
                        ctx.fillStyle = color;
                    } else {
                        ctx.strokeStyle = pColor;
                        ctx.fillStyle = pColor;
                    }
                    let pCoord2d = Vector3d.fromArray(pCoord3d).to2d(this.satImage);
                    let [sX, sY] = this.satImage.labelHomography.transformPointForward(pCoord2d);
                    // console.log(sX, sY, pad.x + sX/2 - 1, pad.y + sY/2 - 1);
                    ctx.fillRect(pad.x + sX/2 - 1, pad.y + sY/2 - 1, 3, 3);
                }
            }
        }
    }
};


View.prototype.redrawLabelCanvas = function() {
    this.padBox = this._getPadding();
    this.satImage.deleteInvalidLabels();
    if (this.satImage.selectedLabel && !this.satImage.selectedLabel.valid) {
        this.satImage.selectedLabel = null;
    }
    this.labelCtx.clearRect(0, 0,
        (2 * this.padBox.x + this.imageCanvas.width) * UP_RES_RATIO,
        (2 * this.padBox.y + this.imageCanvas.height) * UP_RES_RATIO);

    if (this.satImage.assistViewOn && !this.isAssistView) {
        let ctx = this.labelCtx;

        // plane visualization
        let plane = this.satImage.space3D.toPlane();
        let center = this.satImage.space3D.center;
        let unit = this.satImage.sat.focalLength / 250;
        for (let zi of [-1.0, -0.5, 0, 0.5, 1.0]) {
            let start = center.moveBy(-unit, 0, zi * unit, true, plane);
            start.drawBy(2 * unit, 0, 0, this.satImage, true, plane);
        }
        for (let xi of [-1.0, -0.5, 0, 0.5, 1.0]) {
            let start = center.moveBy(xi * unit, 0, -unit, true, plane);
            start.drawBy(0, 0, 2 * unit, this.satImage, true, plane);
        }
        center.drawBy(0, -0.2 * unit, 0, this.satImage, true,
            plane, '#9DD3FA');

        // sphere visualization
        if (this.satImage.rotationOn) {
            let points = {x: [], y: [], z: []};
            let c = center.to2d(this.satImage);
            let unit = this.satImage.sat.focalLength / 250;
            let start = center.moveBy(0.5 * unit, 0, 0, true, plane);
            for (let rotZ = 0; rotZ <= 90; rotZ += 90) {
                points.z.push(start.rotateBy(0, rotZ, 0, plane)
                    .to2d(this.satImage));
            }
            start = center.moveBy(0.5 * unit, 0, 0, true, plane);
            for (let rotY = 0; rotY <= 90; rotY += 90) {
                points.y.push(start.rotateBy(0, 0, rotY, plane)
                    .to2d(this.satImage));
            }
            start = center.moveBy(0, 0.5 * unit, 0, true, plane);
            for (let rotX = 0; rotX <= 90; rotX += 90) {
                points.x.push(start.rotateBy(rotX, 0, 0, plane)
                    .to2d(this.satImage));
            }
            ctx.strokeStyle = '#A5D8DD';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#444444';
            for (let i in points) {
                let circle = points[i];
                ctx.fillStyle = '#20202020';
                ctx.beginPath();
                let xRad = (i == 'z' || i == 'x') ? 30*Math.PI :
                  Math.abs(circle[1][0] - c[0]);
                let yRad = (i == 'y' || i == 'z') ? 30*Math.PI :
                  Math.abs(circle[1][1] - c[1]);
                ctx.ellipse(c[0], c[1], xRad, yRad, 0, 0, 2*Math.PI);
                ctx.stroke();
                ctx.fill();
                ctx.closePath();
            }
        }

        // ground truth labels visualization
        if (config3d.USE_GROUND_TRUTH_LABELS) {
            ctx.strokeStyle = '#FF0000';
            for (let labelID in this.satImage.groundTruthLabels) {
                let label = this.satImage.groundTruthLabels[labelID];
                let label3d = new Rect(1, 1, 1, 1);
                let n = this.satImage.groundTruthRatio;
                label3d.vec000 = Vector3d.fromArray(label[0][0][0]).multiply(n);
                label3d.vec001 = Vector3d.fromArray(label[1][0][0]).multiply(n);
                label3d.vec010 = Vector3d.fromArray(label[0][1][0]).multiply(n);
                label3d.vec011 = Vector3d.fromArray(label[1][1][0]).multiply(n);
                label3d.vec100 = Vector3d.fromArray(label[0][0][1]).multiply(n);
                label3d.vec101 = Vector3d.fromArray(label[1][0][1]).multiply(n);
                label3d.vec110 = Vector3d.fromArray(label[0][1][1]).multiply(n);
                label3d.vec111 = Vector3d.fromArray(label[1][1][1]).multiply(n);
                label3d.static = true;
                label3d.draw(ctx, this.satImage, false, false);
            }
        }

        // control point and cursor style
        let center2d = center.to2d(this.satImage);
        let v = new Vertex(center2d[0], center2d[1], VertexTypes.CONTROL_POINT);
        if (this.satImage.withinCenter) {
            v.draw(ctx, this.satImage, null, null, false, false, true);
            this.labelCanvas.style.cursor = 'move';
        } else {
            v.draw(ctx, this.satImage, null, null, false, false, false);
            if (this.satImage.aroundCenter) {
                this.labelCanvas.style.cursor = 'pointer';
            }
        }
    }

    for (let label of this.satImage.getLabels()) {
        if (label.valid) {
            label.redrawLabelCanvas(this.labelCtx, this.isAssistView);
        }
    }
};


View.prototype.redrawHiddenCanvas = function() {
    this.padBox = this._getPadding();
    this.hiddenCtx.clearRect(
        0, 0, (this.padBox.x + this.padBox.w) * UP_RES_RATIO,
        (this.padBox.y + this.padBox.h) * UP_RES_RATIO);
    for (let i = 0; i < this.satImage._hiddenMap.list.length; i++) {
        let shape = this.satImage._hiddenMap.get(i);
        shape.drawHidden(this.hiddenCtx, this.satImage, hiddenStyleColor(i));
    }
};


View.prototype._getPadding = function() {
    let xRatio = this.image.width / this.imageCanvas.width;
    let yRatio = this.image.height / this.imageCanvas.height;
    // use ratios to determine how to pad
    let box = {x: 0, y: 0, w: 0, h: 0};
    if (xRatio >= yRatio) {
        this.displayToImageRatio = this.imageCanvas.width / this.image.width;
        box.x = 0;
        box.y = 0.5 * (this.imageCanvas.height -
            this.image.height * this.displayToImageRatio);
        box.w = this.imageCanvas.width;
        box.h = this.imageCanvas.height - 2 * box.y;
    } else {
        this.displayToImageRatio = this.imageCanvas.height / this.image.height;
        box.x = 0.5 * (this.imageCanvas.width -
            this.image.width * this.displayToImageRatio);
        box.y = 0;
        box.w = this.imageCanvas.width - 2 * box.x;
        box.h = this.imageCanvas.height;
    }
    return box;
};


View.prototype.toCanvasCoords = function(values, affine=true) {
    if (values) {
        for (let i = 0; i < values.length; i++) {
            values[i] *= this.displayToImageRatio * UP_RES_RATIO;
        }
    }
    if (affine) {
        this.padBox = this._getPadding();
        values[0] += this.padBox.x * UP_RES_RATIO;
        values[1] += this.padBox.y * UP_RES_RATIO;
    }
    return values;
};


View.prototype.toImageCoords = function(values, affine=true) {
    if (affine) {
        this.padBox = this._getPadding();
        values[0] -= this.padBox.x;
        values[1] -= this.padBox.y;
    }
    if (values) {
        for (let i = 0; i < values.length; i++) {
            values[i] /= this.displayToImageRatio;
        }
    }
    return values;
};


View.prototype.setScale = function(scale) {
    if (scale >= this.satImage.MIN_SCALE && scale < this.satImage.MAX_SCALE) {
        let ratio = scale / this.scale;
        this.imageCtx.scale(ratio, ratio);
        this.labelCtx.scale(ratio, ratio);
        this.hiddenCtx.scale(ratio, ratio);
        this.scale = scale;
    } else {
        return false;
    }
    // resize canvas
    let rectDiv = this.divCanvas.getBoundingClientRect();
    this.imageCanvas.style.height =
        Math.round(rectDiv.height * this.scale) + 'px';
    this.imageCanvas.style.width =
        Math.round(rectDiv.width * this.scale) + 'px';
    this.labelCanvas.style.height =
        Math.round(rectDiv.height * this.scale) + 'px';
    this.labelCanvas.style.width =
        Math.round(rectDiv.width * this.scale) + 'px';
    this.hiddenCanvas.style.height =
        Math.round(rectDiv.height * this.scale) + 'px';
    this.hiddenCanvas.style.width =
        Math.round(rectDiv.width * this.scale) + 'px';

    this.imageCanvas.width = rectDiv.width * this.scale;
    this.imageCanvas.height = rectDiv.height * this.scale;
    this.hiddenCanvas.height =
        Math.round(rectDiv.height * UP_RES_RATIO * this.scale);
    this.hiddenCanvas.width =
        Math.round(rectDiv.width * UP_RES_RATIO * this.scale);
    this.labelCanvas.height =
        Math.round(rectDiv.height * UP_RES_RATIO * this.scale);
    this.labelCanvas.width =
        Math.round(rectDiv.width * UP_RES_RATIO * this.scale);

    return true;
};
