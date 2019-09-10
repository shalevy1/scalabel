import * as THREE from 'three'
import { Controller } from './transformation_control'
import { TranslationAxis } from './translation_axis'
import { TranslationPlane } from './translation_plane'

export interface TranslationControlUnit extends THREE.Object3D {
  /** get update vector */
  getDelta: (
    oldIntersection: THREE.Vector3,
    newProjection: THREE.Ray,
    dragPlane: THREE.Plane
  ) => THREE.Vector3
  /** set highlight */
  setHighlighted: (intersection ?: THREE.Intersection) => boolean
}

/**
 * Groups TranslationAxis's and TranslationPlanes to perform translation ops
 */
export class TranslationControl extends THREE.Group
  implements Controller {
  /** translation axes */
  private _translationUnits: TranslationControlUnit[]
  /** current axis being dragged */
  private _highlightedUnit: TranslationControlUnit | null
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

  constructor (camera: THREE.Camera) {
    super()
    this._camera = camera
    this._translationUnits = []
    this._translationUnits.push(
      new TranslationAxis(new THREE.Vector3(1, 0, 0), 0xff0000)
    )
    this._translationUnits.push(
      new TranslationAxis(new THREE.Vector3(0, 1, 0), 0x00ff00)
    )
    this._translationUnits.push(
      new TranslationAxis(new THREE.Vector3(0, 0, 1), 0x0000ff)
    )
    this._translationUnits.push(
      new TranslationPlane(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0.125, 0.125),
        0xff0000
      )
    )
    this._translationUnits.push(
      new TranslationPlane(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0.125, 0, 0.125),
        0x00ff00
      )
    )
    this._translationUnits.push(
      new TranslationPlane(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0.125, 0.125, 0),
        0x0000ff
      )
    )
    for (const unit of this._translationUnits) {
      this.add(unit)
    }

    this._highlightedUnit = null

    this._object = null

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
    for (const axis of this._translationUnits) {
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
      const delta = this._highlightedUnit.getDelta(
        this._intersectionPoint,
        projection,
        this._dragPlane
      )
      this._object.position.add(delta)
      this._intersectionPoint.add(delta)
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
    for (const axis of this._translationUnits) {
      axis.raycast(raycaster, intersects)
    }
  }

  /**
   * Attach to object
   * @param object
   */
  public attach (object: THREE.Object3D) {
    this._object = object
  }

  /**
   * Detach
   */
  public detach () {
    this._object = null
  }
}
