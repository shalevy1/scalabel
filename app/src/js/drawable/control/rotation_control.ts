import * as THREE from 'three'
import { Controller } from './controller'
import { RotationRing } from './rotation_ring'

/**
 * Groups TranslationAxis's and TranslationPlanes to perform translation ops
 */
export class RotationControl extends Controller {
  constructor (camera: THREE.Camera) {
    super(camera)
    this._controlUnits.push(
      new RotationRing(
        new THREE.Vector3(1, 0, 0),
        0xff0000
      )
    )
    this._controlUnits.push(
      new RotationRing(
        new THREE.Vector3(0, 1, 0),
        0x00ff00
      )
    )
    this._controlUnits.push(
      new RotationRing(
        new THREE.Vector3(0, 0, 1),
        0x0000ff
      )
    )
    for (const unit of this._controlUnits) {
      this.add(unit)
    }
  }

  /**
   * Mouse movement while mouse down on box (from raycast)
   * @param {THREE.Ray} projection
   */
  public onMouseMove (projection: THREE.Ray): void {
    if (this._highlightedUnit && this._dragPlane && this._object) {
      const [delta, quaternion ] = this._highlightedUnit.getDelta(
        this._intersectionPoint,
        projection,
        this._dragPlane,
        this._local
      )

      this._intersectionPoint.add(delta)

      this._object.applyQuaternion(quaternion)

      // if (!this._local) {
      //   this.applyQuaternion(quaternion.inverse())
      // }
    }
    this._projection.copy(projection)
  }
}
