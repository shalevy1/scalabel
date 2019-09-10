import * as THREE from 'three'
import { TranslationControlUnit } from './translation_control'

/**
 * Translate along plane
 */
export class TranslationPlane extends THREE.Mesh
  implements TranslationControlUnit {
  /** normal direction */
  private _normal: THREE.Vector3

  constructor (normal: THREE.Vector3, position: THREE.Vector3, color: number) {
    super(
      new THREE.PlaneGeometry(0.25, 0.25),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    )
    this._normal = new THREE.Vector3()
    this._normal.copy(normal)
    this._normal.normalize()

    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this._normal)
    this.quaternion.copy(quaternion)

    this.position.copy(position)
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
      { (this.material as THREE.Material).opacity = 0.25 }
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
    _dragPlane: THREE.Plane
  ): THREE.Vector3 {
    const plane = new THREE.Plane()
    plane.setFromNormalAndCoplanarPoint(this._normal, oldIntersection)
    const newIntersection = new THREE.Vector3()
    newProjection.intersectPlane(plane, newIntersection)

    const delta = new THREE.Vector3()
    delta.copy(newIntersection)
    delta.sub(oldIntersection)
    return delta
  }
}
