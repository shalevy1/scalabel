import _ from 'lodash'
import * as THREE from 'three'

import { addBox3dLabel } from '../action/box3d'
import { changeLabelShape } from '../action/common'
import Session from '../common/session'

import { getCurrentPointCloudViewerConfig } from '../functional/state_util'
import { makeLabel } from '../functional/states'
import {
  CubeType, PointCloudViewerConfigType, ShapeType, State
} from '../functional/types'

import { Vector3D } from '../math/vector3d'

import { LabelTypes } from '../common/types'
import { Cube3D } from './cube3d'
import { Label3D } from './label3d'

/**
 * Box3d Label
 */
export class Box3D extends Label3D {
  /** ThreeJS object for rendering shape */
  private _shape: Cube3D
  /** Direction from target to camera */
  private _viewPlaneNormal: THREE.Vector3
  /** Camera position */
  private _cameraPosition: THREE.Vector3
  /** Intersection between ray from mouse & box */
  private _intersectionPoint: THREE.Vector3
  /** Vector from intersection point to original box position */
  private _intersectionToBox: THREE.Vector3
  /** Vector from camera to original box position */
  private _intersectionToCamera: THREE.Vector3
  /** True if drag started */
  private _dragging: boolean

  constructor () {
    super()
    this._shape = new Cube3D(this._index)
    this._viewPlaneNormal = new THREE.Vector3()
    this._cameraPosition = new THREE.Vector3()
    this._intersectionPoint = new THREE.Vector3()
    this._intersectionToBox = new THREE.Vector3()
    this._intersectionToCamera = new THREE.Vector3()
    this._dragging = false
  }

  /**
   * Initialize label
   * @param {State} state
   */
  public init (state: State): void {
    const itemIndex = state.user.select.item
    this._order = state.task.status.maxOrder + 1
    this._label = makeLabel({
      type: LabelTypes.BOX_3D, id: -1, item: itemIndex,
      category: [state.user.select.category],
      order: this._order
    })
    this._labelId = -1
    const viewerConfig: PointCloudViewerConfigType =
      getCurrentPointCloudViewerConfig(state)
    this._shape.setCenter((new Vector3D()).fromObject(viewerConfig.target))
    Session.dispatch(addBox3dLabel(
      this._label.item, this._label.category,
      this._shape.getCenter(),
      this._shape.getSize(),
      this._shape.getOrientation()
    ))
  }

  /**
   * Override set selected
   * @param s
   */
  public setSelected (s: boolean) {
    super.setSelected(s)
  }

  /**
   * Return a list of the shape for inspection and testing
   */
  public shapes (): Array<Readonly<Cube3D>> {
    return [this._shape]
  }

  /**
   * Modify ThreeJS objects to draw label
   * @param {THREE.Scene} scene: ThreeJS Scene Object
   */
  public render (scene: THREE.Scene): void {
    this._shape.render(scene, this._highlighted)
  }

  /**
   * Set up for drag action
   * @param viewPlaneNormal
   * @param cameraPosition
   * @param intersectionPoint
   */
  public mouseDown (
    viewPlaneNormal: THREE.Vector3,
    cameraPosition: THREE.Vector3,
    intersectionPoint: THREE.Vector3
  ) {
    this._viewPlaneNormal.copy(viewPlaneNormal)
    this._cameraPosition.copy(cameraPosition)
    this._intersectionPoint.copy(intersectionPoint)
    this._intersectionToBox = new THREE.Vector3()
    this._intersectionToBox.copy(this._intersectionPoint)
    this._intersectionToBox.sub(this._shape.position)
    // Get vector from camera to box
    this._intersectionToCamera = new THREE.Vector3()
    this._intersectionToCamera.copy(this._cameraPosition)
    this._intersectionToCamera.sub(this._intersectionPoint)
    this._dragging = true
  }

  /**
   * Mouse movement while mouse down on box (from raycast)
   * @param {THREE.Vector3} projection
   */
  public mouseMove (
    _projection: THREE.Vector3
  ): void {
    return
  }

  /**
   * Clean up drag action
   */
  public mouseUp () {
    this._dragging = false
  }

  /**
   * Update Box3D internal parameters based on new state
   * @param state
   * @param itemIndex
   * @param labelId
   */
  public updateState (
    state: State, itemIndex: number, labelId: number): void {
    super.updateState(state, itemIndex, labelId)
    this._shape.setId(labelId)
  }

  /**
   * Expand the primitive shapes to drawable shapes
   * @param {ShapeType[]} shapes
   */
  public updateShapes (_shapes: ShapeType[]): void {
    const newShape = _shapes[0] as CubeType
    this._shape.setCenter((new Vector3D()).fromObject(newShape.center))
    this._shape.setSize((new Vector3D()).fromObject(newShape.size))
    this._shape.setOrientation(
      (new Vector3D()).fromObject(newShape.orientation)
    )
  }

  /**
   * move anchor to next corner
   */
  public incrementAnchorIndex (): void {
    this._shape.incrementAnchorIndex()
  }

  /** Update the shapes of the label to the state */
  public commitLabel (): void {
    if (this._label !== null) {
      Session.dispatch(changeLabelShape(
        this._label.item, this._label.shapes[0], this._shape.toCube()
      ))
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e
   * @returns true if consumed, false otherwise
   */
  public onKeyDown (_e: KeyboardEvent): boolean {
    return false
  }

  /**
   * Handle key up
   */
  public onKeyUp (_e: KeyboardEvent): boolean {
    if (this._dragging) {
      return false
    }
    return false
  }
}
