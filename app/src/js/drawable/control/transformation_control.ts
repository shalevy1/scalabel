import * as THREE from 'three'
import { projectionFromNDC } from '../../helper/point_cloud'
import { TranslationControl } from './translation_control'

export interface Controller {
  /** highlight function */
  setHighlighted: (intersection?: THREE.Intersection) => void
  /** mouse down */
  onMouseDown: () => void
  /** mouse move */
  onMouseMove: (projection: THREE.Ray) => void
  /** mouse up */
  onMouseUp: () => void
  /** raycast */
  raycast:
    (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void
  /** attach to object */
  attach: (object: THREE.Object3D) => void
  /** detach */
  detach: () => void
}

/**
 * Group TranslationControl, RotationControl, and ScaleControl together
 */
export class TransformationControl extends THREE.Group {
  /** Current controller */
  private _currentController: Controller
  /** TranslationControl */
  private _translationControl: TranslationControl
  /** Camera */
  private _camera: THREE.Camera

  constructor (camera: THREE.Camera) {
    super()
    this._camera = camera
    this._translationControl = new TranslationControl(camera)
    this._currentController = this._translationControl
    this.add(this._translationControl)
  }

  /**
   * Highlight correct axis
   * @param intersection
   */
  public setHighlighted (intersection?: THREE.Intersection) {
    this._currentController.setHighlighted(intersection)
  }

  /**
   * Mouse down
   */
  public onMouseDown () {
    this._currentController.onMouseDown()
  }

  /**
   * Mouse movement while mouse down on box (from raycast)
   * @param x: NDC
   * @param y: NDC
   */
  public onMouseMove (x: number, y: number): void {
    const projection = projectionFromNDC(x, y, this._camera)
    this._currentController.onMouseMove(projection)
  }

  /**
   * Mouse up
   */
  public onMouseUp () {
    this._currentController.onMouseUp()
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
    this._currentController.raycast(raycaster, intersects)
  }

  /**
   * Attach to object
   * @param object
   */
  public attach (object: THREE.Object3D) {
    this._currentController.attach(object)
  }

  /**
   * Detach
   */
  public detach () {
    this._currentController.detach()
  }
}
