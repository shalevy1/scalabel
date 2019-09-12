import * as THREE from 'three'
import { ControlUnit } from './controller'

/**
 * Single rotation ring
 */
export class RotationRing extends THREE.Mesh implements ControlUnit {
  /** normal */
  private _normal: THREE.Vector3

  constructor (normal: THREE.Vector3, color: number) {
    super(
      new THREE.TorusGeometry(1, .02, 32, 24),
      new THREE.MeshBasicMaterial({ color })
   )

    this._normal = normal

    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this._normal)
    this.quaternion.copy(quaternion)

    this.setHighlighted()
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
    dragPlane: THREE.Plane,
    local: boolean
  ): [THREE.Vector3, THREE.Quaternion, THREE.Vector3, THREE.Vector3] {
    const newIntersection = new THREE.Vector3()
    newProjection.intersectPlane(dragPlane, newIntersection)

    const normal = new THREE.Vector3()
    normal.copy(this._normal)

    if (local && this.parent) {
      const quaternion = new THREE.Quaternion()
      this.parent.getWorldQuaternion(quaternion)

      normal.applyQuaternion(quaternion)
    }

    const delta = new THREE.Vector3()
    delta.copy(newIntersection)
    delta.sub(oldIntersection)

    const dragDirection = new THREE.Vector3()
    dragDirection.crossVectors(dragPlane.normal, normal)
    dragDirection.normalize()

    const dragAmount = delta.dot(dragDirection)

    const rotation = new THREE.Quaternion()
    rotation.setFromAxisAngle(normal, dragAmount)

    return [
      new THREE.Vector3(0, 0, 0),
      rotation,
      new THREE.Vector3(),
      newIntersection
    ]
  }

  /**
   * Update scale according to world scale
   * @param worldScale
   */
  public updateScale (_worldScale: THREE.Vector3) {
    return
  }
}
