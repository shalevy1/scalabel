import * as THREE from 'three'
import { RotationRing } from './rotation_ring'
import { Controller } from './transformation_control'

export interface RotationControlUnit extends THREE.Object3D {
  /** get update vector */
  getDelta: (
    oldIntersection: THREE.Vector3,
    newProjection: THREE.Ray,
    dragPlane: THREE.Plane,
    local: boolean
  ) => [THREE.Vector3, THREE.Quaternion]
  /** set highlight */
  setHighlighted: (intersection ?: THREE.Intersection) => boolean
}

/**
 * Groups TranslationAxis's and TranslationPlanes to perform translation ops
 */
export class RotationControl extends THREE.Group
  implements Controller {
  /** translation axes */
  private _rotationUnits: RotationControlUnit[]
  /** current axis being dragged */
  private _highlightedUnit: RotationControlUnit | null
  /** camera */
  private _camera: THREE.Camera
  /** Object to modify */
  private _object: THREE.Object3D | null
  /** original intersection point */
  private _intersectionPoint: THREE.Vector3
  /** Plane of intersection point w/ camera direction */
  private _dragPlane: THREE.Plane | null
  /** previous projection */
  private _projection: THREE.Ray
  /** whether to apply in local coordinates */
  private _local: boolean

  constructor (camera: THREE.Camera) {
    super()
    this._camera = camera
    this._rotationUnits = []
    this._rotationUnits.push(
      new RotationRing(
        new THREE.Vector3(1, 0, 0),
        0xff0000
      )
    )
    this._rotationUnits.push(
      new RotationRing(
        new THREE.Vector3(0, 1, 0),
        0x00ff00
      )
    )
    this._rotationUnits.push(
      new RotationRing(
        new THREE.Vector3(0, 0, 1),
        0x0000ff
      )
    )
    for (const unit of this._rotationUnits) {
      this.add(unit)
    }

    this._highlightedUnit = null

    this._object = null
    this._local = true

    this._intersectionPoint = new THREE.Vector3()
    this._dragPlane = null
    this._projection = new THREE.Ray()
  }

  /**
   * Highlight correct axis if any
   * @param raycaster
   */
  public setHighlighted (intersection?: THREE.Intersection) {
    this._highlightedUnit = null
    for (const axis of this._rotationUnits) {
      if (axis.setHighlighted(intersection) && intersection) {
        this._highlightedUnit = axis
        this._intersectionPoint = intersection.point
      }
    }
  }

  /**
   * Mouse down
   */
  public onMouseDown () {
    if (this._highlightedUnit && this._object) {
      const normal = new THREE.Vector3()
      this._camera.getWorldDirection(normal)
      this._dragPlane = new THREE.Plane()
      this._dragPlane.setFromNormalAndCoplanarPoint(
        normal,
        this._intersectionPoint
      )
    }
  }

  /**
   * Mouse movement while mouse down on box (from raycast)
   * @param {THREE.Ray} projection
   */
  public onMouseMove (projection: THREE.Ray): void {
    if (this._highlightedUnit && this._dragPlane && this._object) {
      const [delta, quaternion] = this._highlightedUnit.getDelta(
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

  /**
   * Mouse up
   */
  public onMouseUp () {
    this._dragPlane = null
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
    for (const axis of this._rotationUnits) {
      axis.raycast(raycaster, intersects)
    }
  }

  /**
   * Attach to object
   * @param object
   */
  public attach (object: THREE.Object3D) {
    this._object = object
    if (this._local) {
      this.quaternion.set(0, 0, 0, 1)
      this.rotation.setFromQuaternion(this.quaternion)
    } else if (this.parent) {
      const quaternion = new THREE.Quaternion()
      this.parent.getWorldQuaternion(quaternion)
      this.quaternion.copy(quaternion.inverse())
      this.rotation.setFromQuaternion(this.quaternion)
    }
    this.updateMatrix()
    this.updateMatrixWorld(true)
  }

  /**
   * Detach
   */
  public detach () {
    this._object = null
  }

  /**
   * Toggle between local/world
   */
  public toggleFrame () {
    if (this._object) {
      this._local = !this._local
      this.attach(this._object)
    }
  }
}
