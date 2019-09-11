import * as THREE from 'three'
import { ControlUnit } from './controller'

/**
 * Unit for scaling object in certain direction
 */
export class ScaleAxis extends THREE.Group implements ControlUnit {
  /** axis to scale */
  private _axis: 'x' | 'y' | 'z'
  /** direction for scaling */
  private _direction: THREE.Vector3
  /** line */
  private _line: THREE.Line
  /** box */
  private _box: THREE.Mesh

  constructor (axis: 'x' | 'y' | 'z',
               negate: boolean,
               color: number) {
    super()
    this._axis = axis
    this._direction = new THREE.Vector3()
    switch (this._axis) {
      case 'x':
        this._direction.x = 1
        break
      case 'y':
        this._direction.y = 1
        break
      case 'z':
        this._direction.z = 1
        break
    }

    if (negate) {
      this._direction.multiplyScalar(-1)
    }

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.addAttribute(
      'position',
      new THREE.Float32BufferAttribute([ 0, 0, 0, 0, 0, 1 ], 3)
    )
    this._line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color })
    )
    this._line.matrixAutoUpdate = false
    this.add(this._line)

    this._box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color })
    )
    this._box.matrixAutoUpdate = false
    this.add(this._box)

    this._line.scale.set(1, 0.75, 1)
    this._line.updateMatrix()

    this._box.scale.set(0.25, 0.25, 0.25)
    this._box.position.z = 1
    this._box.updateMatrix()

    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this._direction)
    this.applyQuaternion(quaternion)
  }

  /** get update vectors: [translation, rotation, scale, new intersection] */
  public getDelta (
    oldIntersection: THREE.Vector3,
    newProjection: THREE.Ray,
    dragPlane: THREE.Plane,
    _local: boolean
  ): [THREE.Vector3, THREE.Quaternion, THREE.Vector3, THREE.Vector3] {
    const direction = new THREE.Vector3()
    direction.copy(this._direction)

    // Only works in local frame
    if (this.parent) {
      const quaternion = new THREE.Quaternion()
      this.parent.getWorldQuaternion(quaternion)

      direction.applyQuaternion(quaternion)
    }

    const newIntersection = new THREE.Vector3()
    newProjection.intersectPlane(dragPlane, newIntersection)

    const mouseDelta = new THREE.Vector3()
    mouseDelta.copy(newIntersection)
    mouseDelta.sub(oldIntersection)

    const projectionLength = mouseDelta.dot(direction)
    const worldDelta = new THREE.Vector3()
    worldDelta.copy(direction)
    worldDelta.multiplyScalar(projectionLength)

    const nextIntersection = new THREE.Vector3()
    nextIntersection.copy(oldIntersection)
    nextIntersection.add(worldDelta)

    const scaleDelta = new THREE.Vector3()
    scaleDelta.copy(this._direction)
    scaleDelta.x = Math.abs(scaleDelta.x)
    scaleDelta.y = Math.abs(scaleDelta.y)
    scaleDelta.z = Math.abs(scaleDelta.z)
    scaleDelta.multiplyScalar(projectionLength)

    const positionDelta = new THREE.Vector3()
    positionDelta.copy(direction)
    positionDelta.multiplyScalar(0.5 * projectionLength)

    return [
      positionDelta,
      new THREE.Quaternion(0, 0, 0, 1),
      scaleDelta,
      nextIntersection
    ]
  }

  /** set highlight */
  public setHighlighted (intersection ?: THREE.Intersection): boolean {
    { (this._box.material as THREE.Material).needsUpdate = true }
    { (this._line.material as THREE.Material).needsUpdate = true }
    if (
      intersection && (
        intersection.object === this ||
        intersection.object === this._line ||
        intersection.object === this._box
      )
    ) {
      { (this._box.material as THREE.Material).opacity = 1 }
      { (this._line.material as THREE.Material).opacity = 1 }
      return true
    } else {
      { (this._box.material as THREE.Material).opacity = 0.01 }
      { (this._line.material as THREE.Material).opacity = 0.01 }
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
    this._line.raycast(raycaster, intersects)
    this._box.raycast(raycaster, intersects)
  }
}
