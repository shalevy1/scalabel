import {UP_RES_RATIO} from './shape';
const math = require('mathjs');


/**
 * Base class for each 3D pose.
 *
 * @param {array} rotation: rotation
 * @param {array} translation: translation
 */
export function Pose3D(rotation, translation) {
    this.rotation = rotation;
    this.translation = translation;
}


// Pose3D.prototype.transformVectorOut = function(
//
//
// def transform_inverse(self, point):
// """Transform a point from this pose to world coordinates."""
// return self.get_rotation_matrix().T.dot(point - self.translation)
//
// def transform(self, point):
// """Transform a point from world to this pose coordinates."""
// return self.get_rotation_matrix().dot(point) + self.translation


/**
 * Base class for each 3D plane on 2D image.
 *
 * @param {Vector3d} center: center
 * @param {number} rotX: rotX
 * @param {number} rotZ: rotZ
 * @param {number} rotY: rotY
 */
export function Plane3D(center, rotX=0.0, rotZ=0.0, rotY=0.0) {
    Space3D.call(this, center, rotX, rotZ, rotY);
}


Plane3D.prototype = Object.create(Space3D.prototype);


Plane3D.prototype.intersect = function(vec3D) {
    let vecX = new Vector3d(1, 0, 0);
    vecX = vecX.toCameraCoords(this.rotX, this.rotZ, this.rotY);
    let vecZ = new Vector3d(0, 0, 1);
    vecZ = vecZ.toCameraCoords(this.rotX, this.rotZ, this.rotY);
    let A = math.matrix([vec3D.toArray(), vecX.toArray(), vecZ.toArray()]);
    let C = math.matrix(this.center.toArray());
    let ratio = math.lusolve(math.transpose(A), C).get([0, 0]);
    return vec3D.multiply(ratio);
};


Plane3D.prototype.moveBy = function(dx, dy, dz) {
    let center = this.center.moveBy(dx, dy, dz);
    return new Plane3D(center, this.rotX, this.rotZ, this.rotY);
};


Plane3D.prototype.rotate = function(rotX=0.0, rotZ=0.0, rotY=0.0) {
    return new Plane3D(this.center.getCopy(), this.rotX + rotX,
        this.rotZ + rotZ, this.rotY + rotY);
};


/**
 * Base class for each 3D space on 2D image.
 *
 * @param {Vector3d} center: center
 * @param {number} rotX: rotX
 * @param {number} rotZ: rotZ
 * @param {number} rotY: rotY
 */
export function Space3D(center, rotX=0.0, rotZ=0.0, rotY=0.0) {
    this.center = center;
    this.rotX = rotX;
    this.rotY = rotY;
    this.rotZ = rotZ;
}


Object.defineProperty(Space3D.prototype, 'x', {
    get: function() {
        return this.center.x;
    },
    set: function(x) {
        this.center.x = x;
    },
});


Object.defineProperty(Space3D.prototype, 'y', {
    get: function() {
        return this.center.y;
    },
    set: function(y) {
        this.center.y = y;
    },
});


Object.defineProperty(Space3D.prototype, 'z', {
    get: function() {
        return this.center.z;
    },
    set: function(z) {
        this.center.z = z;
    },
});


Space3D.prototype.transformVectorOut = function(vec3d, degree=true) {
    let [rotX, rotY, rotZ] = [this.rotX, this.rotY, this.rotZ];
    if (degree) {
        rotX = rotX / 180.0 * Math.PI;
        rotZ = rotZ / 180.0 * Math.PI;
        rotY = rotY / 180.0 * Math.PI;
    }
    let [x0, y0, z0] = [vec3d.x, vec3d.y, vec3d.z];
    let [cosRx, sinRx] = [Math.cos(rotX), Math.sin(rotX)];
    let [x1, y1, z1] = [x0, cosRx * y0 - sinRx * z0, sinRx * y0 + cosRx * z0];
    let [cosRz, sinRz] = [Math.cos(rotZ), Math.sin(rotZ)];
    let [x2, y2, z2] = [cosRz * x1 - sinRz * y1, sinRz * x1 + cosRz * y1, z1];
    let [cosRy, sinRy] = [Math.cos(rotY), Math.sin(rotY)];
    let [x3, y3, z3] = [sinRy * z2 + cosRy * x2, y2, cosRy * z2 - sinRy * x2];
    return this.center.moveBy(x3, y3, z3);
};


Space3D.prototype.transformVectorIn = function(vec3d, degree=true) {
    let [rotX, rotY, rotZ] = [-this.rotX, -this.rotY, -this.rotZ];
    if (degree) {
        rotX = rotX / 180.0 * Math.PI;
        rotZ = rotZ / 180.0 * Math.PI;
        rotY = rotY / 180.0 * Math.PI;
    }
    let [x0, y0, z0] = [vec3d.x - this.center.x,
        vec3d.y - this.center.y, vec3d.z - this.center.z];
    let [cosRy, sinRy] = [Math.cos(rotY), Math.sin(rotY)];
    let [x1, y1, z1] = [sinRy * z0 + cosRy * x0, y0, cosRy * z0 - sinRy * x0];
    let [cosRz, sinRz] = [Math.cos(rotZ), Math.sin(rotZ)];
    let [x2, y2, z2] = [cosRz * x1 - sinRz * y1, sinRz * x1 + cosRz * y1, z1];
    let [cosRx, sinRx] = [Math.cos(rotX), Math.sin(rotX)];
    let [x3, y3, z3] = [x2, cosRx * y2 - sinRx * z2, sinRx * y2 + cosRx * z2];
    return new Vector3d(x3, y3, z3);
};


Space3D.prototype.toPlane = function() {
    return new Plane3D(this.center.getCopy(), this.rotX, this.rotZ, this.rotY);
};


Space3D.prototype.getCopy = function() {
    return new Space3D(this.center.getCopy(), this.rotX, this.rotZ, this.rotY);
};


Space3D.prototype.moveBy = function(dx, dy, dz) {
    let center = this.center.moveBy(dx, dy, dz);
    return new Space3D(center, this.rotX, this.rotZ, this.rotY);
};


Space3D.prototype.toArray = function() {
    return [this.rotX, this.rotZ, this.rotY, this.center];
};


Space3D.prototype.toJson = function() {
    return {
        center: this.center.toJson(),
        rotX: this.rotX,
        rotY: this.rotY,
        rotZ: this.rotZ,
    };
};


Space3D.fromJson = function(json) {
    return new Space3D(Vector3d.fromJson(json.center),
        json.rotX, json.rotZ, json.rotY);
};


/**
 * Base class for each 2D vector on 2D image.
 *
 * @param {number} x: x
 * @param {number} y: y
 */
export function Vector2d(x=0.0, y=0.0) {
    this.x = x;
    this.y = y;
}


Vector2d.prototype.moveBy = function(dx, dy) {
    return new Vector2d(this.x + dx, this.y + dy);
};


Vector2d.prototype.distanceTo = function(vec2d) {
    let [dx, dy] = [this.x - vec2d.x, this.y - vec2d.y];
    return Math.sqrt(dx * dx + dy * dy);
};


Vector2d.prototype.midPointWith = function(vec2d) {
    let [dx, dy] = [vec2d.x - this.x, vec2d.y - this.y];
    return this.moveBy(dx / 2.0, dy / 2.0);
};


Vector2d.prototype.rotate = function(radian, center=null) {
    if (!center) {
        center = new Vector2d();
    }
    let [dx, dy] = [this.x - center.x, this.y - center.y];
    let dxNew = Math.cos(radian) * dx - Math.sin(radian) * dy;
    let dyNew = Math.sin(radian) * dx + Math.cos(radian) * dy;
    return center.moveBy(dxNew, dyNew);
};


Vector2d.prototype.toArray = function() {
    return [this.x, this.y];
};


Vector2d.fromArray = function(array) {
    return new Vector2d(array[0], array[1]);
};


/**
 * Base class for each 3D vector on 2D image.
 *
 * @param {number} x: x
 * @param {number} y: y
 * @param {number} z: z
 */
export function Vector3d(x=0.0, y=0.0, z=0.0) {
    this.x = x;
    this.y = y;
    this.z = z;
}


// deprecated
Vector3d.prototype.toCameraCoords = function(rotX=0.0, rotZ=0.0, rotY=0.0,
                                             center=null, degree=true) {
    if (!center) {
        center = new Vector3d();
    }
    if (degree) {
        rotX = rotX / 180.0 * Math.PI;
        rotZ = rotZ / 180.0 * Math.PI;
        rotY = rotY / 180.0 * Math.PI;
    }
    let [x0, y0, z0] = [this.x, this.y, this.z];
    let [cosRx, sinRx] = [Math.cos(rotX), Math.sin(rotX)];
    let [x1, y1, z1] = [x0, cosRx * y0 - sinRx * z0, sinRx * y0 + cosRx * z0];
    let [cosRz, sinRz] = [Math.cos(rotZ), Math.sin(rotZ)];
    let [x2, y2, z2] = [cosRz * x1 - sinRz * y1, sinRz * x1 + cosRz * y1, z1];
    let [cosRy, sinRy] = [Math.cos(rotY), Math.sin(rotY)];
    let [x3, y3, z3] = [sinRy * z2 + cosRy * x2, y2, cosRy * z2 - sinRy * x2];
    return center.moveBy(x3, y3, z3);
};


// deprecated
Vector3d.prototype.toPlaneCoords = function(rotX=0.0, rotZ=0.0, rotY=0.0,
                                            center=null, degree=true) {
    if (!center) {
        center = new Vector3d();
    }
    if (degree) {
        rotX = rotX / 180.0 * Math.PI;
        rotZ = rotZ / 180.0 * Math.PI;
        rotY = rotY / 180.0 * Math.PI;
    }
    [rotX, rotY, rotZ] = [-rotX, -rotY, -rotZ];
    let [x0, y0, z0] = [
        this.x - center.x, this.y - center.y, this.z - center.z];
    let [cosRy, sinRy] = [Math.cos(rotY), Math.sin(rotY)];
    let [x1, y1, z1] = [sinRy * z0 + cosRy * x0, y0, cosRy * z0 - sinRy * x0];
    let [cosRz, sinRz] = [Math.cos(rotZ), Math.sin(rotZ)];
    let [x2, y2, z2] = [cosRz * x1 - sinRz * y1, sinRz * x1 + cosRz * y1, z1];
    let [cosRx, sinRx] = [Math.cos(rotX), Math.sin(rotX)];
    let [x3, y3, z3] = [x2, cosRx * y2 - sinRx * z2, sinRx * y2 + cosRx * z2];
    return new Vector3d(x3, y3, z3);
};


Vector3d.prototype.to2d = function(satImage, affine=true,
                                   ratio=UP_RES_RATIO, pad=null) {
    let [x, y, z] = this.toArray();
    if (pad == null) {
        pad = satImage.mainView._getPadding();
    }
    let focalLength = satImage.sat.focalLength
        * (pad.h / satImage.sat.imageHeight);
    if (affine) {
        return [(pad.x + pad.w * 0.5 + x / z * focalLength) * ratio,
            (pad.y + pad.h * 0.5 + y / z * focalLength) * ratio];
    } else {
        return [(pad.w * 0.5 + x / z * focalLength) * ratio,
            (pad.h * 0.5 + y / z * focalLength) * ratio];
    }
};


Vector3d.from2d = function(pos, satImage, affine=true,
                           ratio=UP_RES_RATIO, pad=null) {
    let [posX, posY] = pos;
    if (pad == null) {
        pad = satImage.mainView._getPadding();
    }
    let upscale = satImage.sat.imageHeight / pad.h;
    let vec3d = new Vector3d(0.0, 0.0, satImage.sat.focalLength);
    if (affine) {
        vec3d.x = (posX / ratio - pad.x - 0.5 * pad.w) * upscale;
        vec3d.y = (posY / ratio - pad.y - 0.5 * pad.h) * upscale;
    } else {
        vec3d.x = (posX / ratio - 0.5 * pad.w) * upscale;
        vec3d.y = (posY / ratio - 0.5 * pad.h) * upscale;
    }
    return vec3d;
};


Vector3d.prototype.toJson = function() {
    return {
        x: this.x,
        y: this.y,
        z: this.z,
    };
};


Vector3d.fromJson = function(json) {
    return new Vector3d(json.x, json.y, json.z);
};


Vector3d.prototype.toArray = function() {
    return [this.x, this.y, this.z];
};


Vector3d.fromArray = function(array) {
    return new Vector3d(array[0], array[1], array[2]);
};


Vector3d.prototype.getCopy = function() {
    return new Vector3d(this.x, this.y, this.z);
};


// todo: update needed
Vector3d.prototype.moveBy = function(dx, dy, dz,
                                     inPlaneCoords=false, plane=null) {
    if (!inPlaneCoords) {
        return new Vector3d(this.x + dx, this.y + dy, this.z + dz);
    } else {
        let vecPlane = this.toPlaneCoords(...plane.toArray());
        vecPlane = vecPlane.moveBy(dx, dy, dz);
        return vecPlane.toCameraCoords(...plane.toArray());
    }
};


// todo: update needed
Vector3d.prototype.rotateBy = function(rotX, rotZ, rotY, plane, degree=true) {
    if (degree) {
        rotX = rotX / 180.0 * Math.PI;
        rotZ = rotZ / 180.0 * Math.PI;
        rotY = rotY / 180.0 * Math.PI;
    }
    let vecIn = this.toPlaneCoords(...plane.toArray());
    let [x0, y0, z0] = vecIn.toArray();
    let [cosRy, sinRy] = [Math.cos(rotY), Math.sin(rotY)];
    let [x1, y1, z1] = [sinRy * z0 + cosRy * x0, y0, cosRy * z0 - sinRy * x0];
    let [cosRz, sinRz] = [Math.cos(rotZ), Math.sin(rotZ)];
    let [x2, y2, z2] = [cosRz * x1 - sinRz * y1, sinRz * x1 + cosRz * y1, z1];
    let [cosRx, sinRx] = [Math.cos(rotX), Math.sin(rotX)];
    let [x3, y3, z3] = [x2, cosRx * y2 - sinRx * z2, sinRx * y2 + cosRx * z2];
    let vecOut = new Vector3d(x3, y3, z3);
    return vecOut.toCameraCoords(...plane.toArray());
};


Vector3d.prototype.multiply = function(ratio) {
    return new Vector3d(this.x * ratio, this.y * ratio, this.z * ratio);
};


Vector3d.prototype.distanceTo = function(vec3d) {
    let [dx, dy, dz] = [this.x - vec3d.x, this.y - vec3d.y, this.z - vec3d.z];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};


Vector3d.prototype.midPointWith = function(vec3d) {
    let [dx, dy, dz] = [vec3d.x - this.x, vec3d.y - this.y, vec3d.z - this.z];
    return this.moveBy(dx / 2.0, dy / 2.0, dz / 2.0);
};


Vector3d.prototype.isZero = function() {
    return this.x == 0.0 && this.y == 0.0 && this.z == 0.0;
};


// deprecated
Vector3d.prototype.drawTo = function(vec3d, satImage, color='#FBF2DC') {
    let [x0, y0] = this.to2d(satImage);
    let [x1, y1] = vec3d.to2d(satImage);
    let ctx = satImage.mainView.labelCtx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 7;
    ctx.shadowColor = '#444444';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
};


// deprecated
Vector3d.prototype.drawBy = function(dx, dy, dz, satImage, inPlaneCoords=false,
                                     plane=null, color='#FBF2DC') {
    let vec3d = this.moveBy(dx, dy, dz, inPlaneCoords, plane);
    this.drawTo(vec3d, satImage, color);
};


/**
 * Storage for homography matrices.
 *
 * @param {number} src: an array of four 2D points (shape = 4 * 2)
 * @param {number} dst: an array of four 2D points (shape = 4 * 2)
 */
export function Homography(src, dst) {
    this.matrixTR = this._calculate(src, dst);
    this.matrixRT = this._calculate(dst, src);
}


Homography.prototype._calculate = function(src, dst) {
    let [x1t, y1t] = [src[0][0], src[0][1]];
    let [x2t, y2t] = [src[1][0], src[1][1]];
    let [x3t, y3t] = [src[2][0], src[2][1]];
    let [x4t, y4t] = [src[3][0], src[3][1]];

    let [x1r, y1r] = [dst[0][0], dst[0][1]];
    let [x2r, y2r] = [dst[1][0], dst[1][1]];
    let [x3r, y3r] = [dst[2][0], dst[2][1]];
    let [x4r, y4r] = [dst[3][0], dst[3][1]];

    let A = math.matrix(
        [[-x1t, -y1t, -1, 0, 0, 0, x1t * x1r, y1t * x1r, x1r],
            [0, 0, 0, -x1t, -y1t, -1, x1t * y1r, y1t * y1r, y1r],
            [-x2t, -y2t, -1, 0, 0, 0, x2t * x2r, y2t * x2r, x2r],
            [0, 0, 0, -x2t, -y2t, -1, x2t * y2r, y2t * y2r, y2r],
            [-x3t, -y3t, -1, 0, 0, 0, x3t * x3r, y3t * x3r, x3r],
            [0, 0, 0, -x3t, -y3t, -1, x3t * y3r, y3t * y3r, y3r],
            [-x4t, -y4t, -1, 0, 0, 0, x4t * x4r, y4t * x4r, x4r],
            [0, 0, 0, -x4t, -y4t, -1, x4t * y4r, y4t * y4r, y4r],
            [0, 0, 0, 0, 0, 0, 0, 0, 1]]);

    let b = math.matrix([0, 0, 0, 0, 0, 0, 0, 0, 1]);
    return math.reshape(math.lusolve(A, b), [3, 3]);
};


Homography.prototype.transformPointForward = function(point) {
    let [x0, y0] = point;
    let [x1, y1, z1] = math.multiply(this.matrixTR, [x0, y0, 1])._data;
    return [x1 / z1, y1 / z1];
};


Homography.prototype.transformPointBackward = function(point) {
    let [x0, y0] = point;
    let [x1, y1, z1] = math.multiply(this.matrixRT, [x0, y0, 1])._data;
    return [x1 / z1, y1 / z1];
};


Homography.prototype.drawPlaneForward = function(srcData, dstData) {
    let dstWidth = dstData.width;
    let dstHeight = dstData.height;
    for (let y1 = 0; y1 < dstHeight; y1++) {
        for (let x1 = 0; x1 < dstWidth; x1++) {
            let point = this.transformPointBackward([x1, y1]);
            let colorOut = this.getColor(point, srcData);
            dstData.data.set(colorOut, (y1 * dstWidth + x1) * 4);
        }
    }
};


Homography.prototype.getColor = function(point, imageData) {
    let width = imageData.width;
    let height = imageData.height;
    let [x0, y0] = [math.floor(point[0]), math.floor(point[1])];
    let [dx, dy] = [point[0] - x0, point[1] - y0];
    if (x0 < 0 || y0 < 0 || x0 > width - 2 || y0 > height - 2) {
        return [0, 0, 0, 255];
    }
    let index = (y0 * width + x0) * 4;
    let c00 = imageData.data.slice(index, index + 4);
    index = ((y0 + 1) * width + x0) * 4;
    let c01 = imageData.data.slice(index, index + 4);
    index = (y0 * width + x0 + 1) * 4;
    let c10 = imageData.data.slice(index, index + 4);
    index = ((y0 + 1) * width + x0 + 1) * 4;
    let c11 = imageData.data.slice(index, index + 4);
    let out = [];
    for (let i = 0; i < 4; i++) {
        out.push((1 - dy) * ((1 - dx) * c00[i] + dx * c10[i]) +
            dy * ((1 - dx) * c01[i] + dx * c11[i]));
    }
    return out;
};
