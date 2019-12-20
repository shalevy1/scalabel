import _ from 'lodash'
import { ShapeTypeName } from '../../common/types'
import { makeLabel } from '../../functional/states'
import { Label2DSpecType, Point2DType, RectType, ShapeType, State } from '../../functional/types'
import { Size2D } from '../../math/size2d'
import { Vector2D } from '../../math/vector2d'
import { Context2D, encodeControlColor, getColorById, toCssColor } from '../util'
import { DrawMode, Label2D } from './label2d'
import { makePoint2DStyle, Point2D } from './point2d'

const DEFAULT_VIEW_POINT_STYLE = makePoint2DStyle({ radius: 8 })
const DEFAULT_VIEW_HIGH_POINT_STYLE = makePoint2DStyle({ radius: 12 })
const DEFAULT_CONTROL_POINT_STYLE = makePoint2DStyle({ radius: 12 })
const lineWidth = 4

/** Class for templated user-defined labels */
export class CustomLabel2D extends Label2D {
  /** Label specification */
  private _spec: Label2DSpecType
  /** Shapes */
  private _shapes: Point2D[]
  /** Bounds of the shape */
  private _bounds: RectType

  constructor (spec: Label2DSpecType) {
    super()
    this._spec = spec
    this._shapes = []
    this._bounds = {
      x1: -1, y1: -1, x2: -1, y2: -1
    }
  }

  /** Draw according to spec */
  public draw (context: Context2D, ratio: number, mode: DrawMode): void {
    const self = this

    // Set proper drawing styles
    let pointStyle = makePoint2DStyle()
    let highPointStyle = makePoint2DStyle()
    let assignColor: (i: number) => number[] = () => [0]
    switch (mode) {
      case DrawMode.VIEW:
        pointStyle = _.assign(pointStyle, DEFAULT_VIEW_POINT_STYLE)
        highPointStyle = _.assign(highPointStyle, DEFAULT_VIEW_HIGH_POINT_STYLE)
        assignColor = (_i: number): number[] => {
          // vertex
          return self._color
        }
        break
      case DrawMode.CONTROL:
        pointStyle = _.assign(pointStyle, DEFAULT_CONTROL_POINT_STYLE)
        highPointStyle = _.assign(
          highPointStyle, DEFAULT_CONTROL_POINT_STYLE)
        assignColor = (i: number): number[] => {
          return encodeControlColor(self._index, i)
        }
        break
    }

    for (let i = 0; i < this._shapes.length; i++) {
      pointStyle.color = assignColor(i)
      this._shapes[i].draw(context, ratio, pointStyle)
    }

    for (let i = 0; i < this._spec.connections.length; i++) {
      const connection = this._spec.connections[i]
      const startPoint = this._shapes[connection[0]]
      const endPoint = this._shapes[connection[1]]

      const realStart = startPoint.clone().scale(ratio)
      const realEnd = endPoint.clone().scale(ratio)
      console.log(realStart, realEnd)

      context.save()
      context.strokeStyle = toCssColor(assignColor(i))
      context.lineWidth = lineWidth
      context.beginPath()
      context.moveTo(realStart.x, realStart.y)
      context.lineTo(realEnd.x, realEnd.y)
      context.closePath()
      context.stroke()
      context.restore()
    }
  }

  /** Temporary initialization on mouse down */
  public initTemp (
    state: State, start: Vector2D
  ) {
    const itemIndex = state.user.select.item
    this._order = state.task.status.maxOrder + 1
    this._label = makeLabel({
      type: this._spec.name,
      id: -1,
      item: itemIndex,
      category: [state.user.select.category],
      attributes: state.user.select.attributes,
      order: this._order
    })
    this._labelId = -1
    this._color = getColorById(
      state.task.status.maxLabelId + 1,
      (state.task.config.tracking) ? state.task.status.maxTrackId + 1 : -1
    )

    this._bounds.x1 = Infinity
    this._bounds.y1 = Infinity
    this._bounds.x2 = -Infinity
    this._bounds.y2 = -Infinity

    for (const point of this._spec.template) {
      this._bounds.x1 = Math.min(point.x, this._bounds.x1)
      this._bounds.y1 = Math.min(point.y, this._bounds.y1)
      this._bounds.x2 = Math.max(point.x, this._bounds.x2)
      this._bounds.y2 = Math.max(point.y, this._bounds.y2)
    }

    this._shapes = []
    for (const point of this._spec.template) {
      this._shapes.push(new Point2D(
        point.x - this._bounds.x1 + start.x,
        point.y - this._bounds.y1 + start.y
      ))
    }

    const width = this._bounds.x2 - this._bounds.x1
    const height = this._bounds.y2 - this._bounds.y1

    this._bounds.x1 = start.x
    this._bounds.y1 = start.y
    this._bounds.x2 = start.x + width
    this._bounds.y2 = start.y + height

    this.setSelected(true)
    this._highlightedHandle = 5
  }

  /** Override on mouse down */
  public onMouseDown (coord: Vector2D, handleIndex: number): boolean {
    const returnValue = super.onMouseDown(coord, handleIndex)
    this.editing = true
    if (this._labelId < 0) {
      this._bounds.x1 = coord.x
      this._bounds.y1 = coord.y
    }
    return returnValue
  }

  /** Handle mouse move */
  public onMouseMove (
    coord: Vector2D,
    _limit: Size2D,
    _labelIndex: number,
    _handleIndex: number
  ) {
    if (this._labelId < 0) {
      const newWidth = Math.max(coord.x - this._bounds.x1, 1)
      const xScale =
        (newWidth) / (this._bounds.x2 - this._bounds.x1)
      const newHeight = Math.max(coord.y - this._bounds.y1, 1)
      const yScale =
        (newHeight) / (this._bounds.y2 - this._bounds.y1)
      console.log(this._bounds, coord, xScale, yScale)

      for (const shape of this._shapes) {
        shape.x = (shape.x - this._bounds.x1) * xScale + this._bounds.x1
        shape.y = (shape.y - this._bounds.y1) * yScale + this._bounds.y1
      }

      this._bounds.x2 = this._bounds.x1 + newWidth
      this._bounds.y2 = this._bounds.y1 + newHeight
    }
    return false
  }

  /** Override on mouse up */
  public onMouseUp (coord: Vector2D): boolean {
    const returnValue = super.onMouseUp(coord)
    this.editing = false
    return returnValue
  }

  /** On key down */
  public onKeyDown (_key: string): boolean {
    return false
  }

  /**
   * handle keyboard up event
   * @param e pressed key
   */
  public onKeyUp (_key: string): void {
    return
  }

  /**
   * Expand the primitive shapes to drawable shapes
   * @param {ShapeType[]} shapes
   */
  public updateShapes (shapes: ShapeType[]): void {
    if (shapes.length !== this._shapes.length) {
      this._shapes = []
      for (const shape of shapes) {
        const point = shape as Point2DType
        this._shapes.push(new Point2D(point.x, point.y))
      }
    } else {
      for (let i = 0; i < shapes.length; i++) {
        const point = shapes[i] as Point2DType
        this._shapes[i].x = point.x
        this._shapes[i].y = point.y
      }
    }
  }

  /** Get shape id's and shapes for updating */
  public shapeObjects (): [number[], ShapeTypeName[], ShapeType[]] {
    if (!this._label) {
      throw new Error('Uninitialized label')
    }
    const shapeTypes = this._shapes.map(() => ShapeTypeName.POINT_2D)
    const shapeStates = this._shapes.map(
      (shape) => ({ x: shape.x, y: shape.y })
    )
    return [this._label.shapes, shapeTypes, shapeStates]
  }
}
