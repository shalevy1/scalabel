import * as THREE from 'three'
import { LabelType, ShapeType, State } from '../functional/types'
import { TransformationControl } from './control/transformation_control'
import { Cube3D } from './cube3d'
import { Grid3D } from './grid3d'
import { Plane3D } from './plane3d'
import { getColorById } from './util'

type Shape = Cube3D | Grid3D

/**
 * Abstract class for 3D drawable labels
 */
export abstract class Label3D {
  /* The members are public for testing purpose */
  /** label id in state */
  protected _labelId: number
  /** index of the label */
  protected _index: number
  /** drawing order of the label */
  protected _order: number
  /** the corresponding label in the state */
  protected _label: LabelType | null
  /** whether the label is selected */
  protected _selected: boolean
  /** whether the label is highlighted */
  protected _highlighted: boolean
  /** rgba color decided by labelId */
  protected _color: number[]
  /** plane if attached */
  protected _plane?: Plane3D

  constructor () {
    this._index = -1
    this._labelId = -1
    this._order = -1
    this._selected = false
    this._highlighted = false
    this._label = null
    this._color = [0, 0, 0, 1]
  }

  /**
   * Set index of this label
   */
  public set index (i: number) {
    this._index = i
  }

  /** get index */
  public get index (): number {
    return this._index
  }

  /** get labelId */
  public get labelId (): number {
    return this._labelId
  }

  /** select the label */
  public setSelected (s: boolean) {
    this._selected = s
  }

  /** highlight the label */
  public setHighlighted (intersection?: THREE.Intersection) {
    if (intersection) {
      this._highlighted = true
    } else {
      this._highlighted = false
    }
  }

  /** Attach label to plane */
  public attachToPlane (plane: Plane3D) {
    plane.attachLabel(this)
    this._plane = plane
  }

  /** Attach control */
  public abstract attachControl (control: TransformationControl): void

  /** Attach control */
  public abstract detachControl (control: TransformationControl): void

  /**
   * Modify ThreeJS objects to draw label
   * @param {THREE.Scene} scene: ThreeJS Scene Object
   */
  public abstract render (scene: THREE.Scene, camera: THREE.Camera): void

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e
   * @returns true if consumed, false otherwise
   */
  public abstract onKeyDown (e: KeyboardEvent): boolean

  /**
   * Handle keyboard events
   * @returns true if consumed, false otherwise
   */
  public abstract onKeyUp (e: KeyboardEvent): boolean

  /**
   * Expand the primitive shapes to drawable shapes
   * @param {ShapeType[]} shapes
   */
  public abstract updateShapes (shapes: ShapeType[]): void

  /** Update the shapes of the label to the state */
  public abstract commitLabel (): void

  /**
   * Initialize label
   * @param {State} state
   */
  public abstract init (state: State): void

  /**
   * Return a list of the shape for inspection and testing
   */
  public abstract shapes (): Array<Readonly<Shape>>

  /** Convert label state to drawable */
  public updateState (
    state: State, itemIndex: number, labelId: number): void {
    const item = state.task.items[itemIndex]
    this._label = item.labels[labelId]
    this._labelId = this._label.id
    this._color = getColorById(this._labelId)
    this.updateShapes(this._label.shapes.map((i) => item.shapes[i].shape))
  }
}

export default Label3D
