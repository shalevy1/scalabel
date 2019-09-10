import * as THREE from 'three'
import { projectionFromNDC } from '../../helper/point_cloud'
import { RotationControl } from './rotation_control'
import { TranslationControl } from './translation_control'

export interface Controller extends THREE.Object3D {
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
  /** Toggle local/world */
  toggleFrame: () => void
}

/**
 * Group TranslationControl, RotationControl, and ScaleControl together
 */
export class TransformationControl extends THREE.Group {
  /** Current controller */
  private _currentController: Controller
  /** Translation controller */
  private _translationControl: TranslationControl
  /** Rotation controller */
  private _rotationControl: RotationControl
  /** Camera */
  private _camera: THREE.Camera
  /** Attached object */
  private _object: THREE.Object3D | null

  constructor (camera: THREE.Camera) {
    super()
    this._camera = camera
    this._translationControl = new TranslationControl(camera)
    this._rotationControl = new RotationControl(camera)
    this._currentController = this._rotationControl
    this.add(this._currentController)
    this._object = null
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
   * Handle key events
   * @param e
   */
  public onKeyDown (e: KeyboardEvent): boolean {
    switch (e.key) {
      case 'Q':
      case 'q':
        this._currentController.toggleFrame()
        return true
      case 'T':
      case 't':
        this.switchController(this._translationControl)
        return true
      case 'R':
      case 'r':
        this.switchController(this._rotationControl)
        return true
      case 'S':
      case 's':
        return true
      case 'F':
      case 'f':
        return true
    }
    return false
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
    this._currentController.updateMatrix()
    this._currentController.updateMatrixWorld(true)
    this._object = object
  }

  /**
   * Detach
   */
  public detach () {
    this._currentController.detach()
    this._object = null
  }

  /**
   * Switch to new controller
   * @param controller
   */
  private switchController (controller: Controller) {
    if (!this._object) {
      return
    }
    const object = this._object
    this.detach()
    this.remove(this._currentController)

    this._currentController = controller
    this.attach(object)
    this.add(this._currentController)
  }
}
