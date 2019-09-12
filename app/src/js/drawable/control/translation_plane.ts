import * as THREE from 'three'
import { ControlUnit } from './controller'

/**
 * Translate along plane
 */
export class TranslationPlane extends THREE.Mesh
  implements ControlUnit {
  /** normal direction */
  private _normal: THREE.Vector3

  constructor (normal: THREE.Vector3, color: number) {
    super(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    )
    this._normal = new THREE.Vector3()
    this._normal.copy(normal)
    this._normal.normalize()

    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this._normal)
    this.quaternion.copy(quaternion)
  }

  /**
   * Set highlighted
   * @param object
   */
  public setHighlighted (intersection ?: THREE.Intersection): boolean {
    { (this.material as THREE.Material).needsUpdate = true }
    if (intersection && intersection.object === this) {
      { (this.material as THREE.Material).opacity = 1 }
      return true
    } else {
      { (this.material as THREE.Material).opacity = 0.01 }
      return false
    }
  }

  /**
   * Get translation delta
   * @param oldIntersection
   * @param newProjection
   * @param dragPlane
   */
  public getDelta (
    oldIntersection: THREE.Vector3,
    newProjection: THREE.Ray,
    _dragPlane: THREE.Plane,
    local: boolean
  ): [THREE.Vector3, THREE.Quaternion, THREE.Vector3, THREE.Vector3] {
    const normal = new THREE.Vector3()
    normal.copy(this._normal)

    if (local && this.parent) {
      const quaternion = new THREE.Quaternion()
      this.parent.getWorldQuaternion(quaternion)

      normal.applyQuaternion(quaternion)
    }
    const plane = new THREE.Plane()
    plane.setFromNormalAndCoplanarPoint(normal, oldIntersection)
    const newIntersection = new THREE.Vector3()
    newProjection.intersectPlane(plane, newIntersection)

    const delta = new THREE.Vector3()
    delta.copy(newIntersection)
    delta.sub(oldIntersection)
    return [
      delta,
      new THREE.Quaternion(0, 0, 0, 1),
      new THREE.Vector3(),
      newIntersection
    ]
  }

  /**
   * Change scale & rotation to reflect changes in parent's parameters
   * @param local: whether in local coordinate frame
   */
  public refreshDisplayParameters (_local: boolean) {
    const worldScale = new THREE.Vector3()
    if (this.parent) {
      this.parent.getWorldScale(worldScale)
    }
    const minScale = Math.min(worldScale.x, worldScale.y, worldScale.z)
    this.scale.set(
      minScale / worldScale.x,
      minScale / worldScale.y,
      minScale / worldScale.z
    )
  }
}
