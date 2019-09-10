import * as THREE from 'three'
import { TranslationControlUnit } from './translation_control'

/**
 * ThreeJS object used for moving parent object along certain axis
 */
export class TranslationAxis extends THREE.ArrowHelper
  implements TranslationControlUnit {
  /** Translation direction (180 degree symmetric) */
  private _direction?: THREE.Vector3

  constructor (direction: THREE.Vector3, color: number) {
    super(direction, new THREE.Vector3(0, 0, 0), 1, color, 0.15, 0.09)

    this._direction = new THREE.Vector3()
    this._direction.copy(direction)
    this._direction.normalize()

    this.setHighlighted()

    { (this.line.material as THREE.LineBasicMaterial).linewidth = 4 }
  }

  /**
   * Mouse movement while mouse down on box (from raycast)
   * @param oldIntersection
   * @param newProjection
   * @param dragPlane
   */
  public getDelta (
    oldIntersection: THREE.Vector3,
    newProjection: THREE.Ray,
    dragPlane: THREE.Plane
  ): THREE.Vector3 {
    if (!this._direction) {
      return new THREE.Vector3()
    }

    const newIntersection = new THREE.Vector3()
    newProjection.intersectPlane(dragPlane, newIntersection)

    const mouseDelta = new THREE.Vector3()
    mouseDelta.copy(newIntersection)
    mouseDelta.sub(oldIntersection)

    const projectionLength = mouseDelta.dot(this._direction)
    const delta = new THREE.Vector3()
    delta.copy(this._direction)
    delta.multiplyScalar(projectionLength)

    return delta
  }

  /**
   * Set highlighted
   * @param object
   */
  public setHighlighted (intersection ?: THREE.Intersection): boolean {
    { (this.line.material as THREE.Material).needsUpdate = true }
    { (this.cone.material as THREE.Material).needsUpdate = true }
    if (
      intersection && (
        intersection.object === this ||
        intersection.object === this.line ||
        intersection.object === this.cone
      )
    ) {
      { (this.line.material as THREE.Material).opacity = 1 }
      { (this.cone.material as THREE.Material).opacity = 1 }
      return true
    } else {
      { (this.line.material as THREE.Material).opacity = 0.01 }
      { (this.cone.material as THREE.Material).opacity = 0.01 }
      return false
    }
  }

  /**
   * Override ThreeJS raycast to intersect with box
   * @param raycaster
   * @param intersects
   */
  public raycast (
    raycaster: THREE.Raycaster,
    intersects: THREE.Intersection[]
  ) {
    this.line.raycast(raycaster, intersects)
    this.cone.raycast(raycaster, intersects)
  }
}
