import * as THREE from 'three'
import { TransformationController } from './transformation_control'
import { TranslationAxis } from './translation_axis'

/**
 * Groups TranslationAxis's and TranslationPlanes to perform translation ops
 */
export class TranslationControl extends THREE.Group
  implements TransformationController {
  /** translation axes */
  private _translationAxes: TranslationAxis[]
  /** current axis being dragged */
  private _highlightedAxis: TranslationAxis | null
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
    this._translationAxes = []
    this._translationAxes.push(
      new TranslationAxis(new THREE.Vector3(1, 0, 0), 0xff0000)
    )
    this._translationAxes.push(
      new TranslationAxis(new THREE.Vector3(0, 1, 0), 0x00ff00)
    )
    this._translationAxes.push(
      new TranslationAxis(new THREE.Vector3(0, 0, 1), 0x0000ff)
    )
    for (const axis of this._translationAxes) {
      this.add(axis)
    }

    this._highlightedAxis = null

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
    this._highlightedAxis = null
    for (const axis of this._translationAxes) {
      if (axis.setHighlighted(intersection) && intersection) {
        this._highlightedAxis = axis
        this._intersectionPoint = intersection.point
      }
    }
  }

  /**
   * Mouse down
   */
  public onMouseDown () {
    if (this._highlightedAxis && this._object) {
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
    if (this._highlightedAxis && this._dragPlane && this._object) {
      const delta = this._highlightedAxis.getDelta(
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
    for (const axis of this._translationAxes) {
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
