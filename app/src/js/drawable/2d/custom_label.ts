import { LabelSpecType } from '../../functional/types'
import { Size2D } from '../../math/size2d'
import { Vector2D } from '../../math/vector2d'
import { Context2D, encodeControlColor } from '../util'
import { DrawMode, Label2D } from './label2d'
import { makePoint2DStyle } from './point2d'

const DEFAULT_VIEW_POINT_STYLE = makePoint2DStyle({ radius: 8 })
const DEFAULT_VIEW_HIGH_POINT_STYLE = makePoint2DStyle({ radius: 12 })
const DEFAULT_CONTROL_POINT_STYLE = makePoint2DStyle({ radius: 12 })

/** Class for templated user-defined labels */
export class CustomLabel2D extends Label2D {
  /** Label specification */
  private _spec: LabelSpecType

  constructor (spec: LabelSpecType) {
    super()
    this._spec = spec
  }

  /** Draw according to spec */
  public draw (canvas: Context2D, ratio: number, mode: DrawMode): void {
    const self = this

    // Set proper drawing styles
    let pointStyle = makePoint2DStyle()
    let highPointStyle = makePoint2DStyle()
    let assignColor: (i: number) => number[] = () => [0]
    switch (mode) {
      case DrawMode.VIEW:
        pointStyle = _.assign(pointStyle, DEFAULT_VIEW_POINT_STYLE)
        highPointStyle = _.assign(highPointStyle, DEFAULT_VIEW_HIGH_POINT_STYLE)
        assignColor = (i: number): number[] => {
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

    // Draw!!!
    const rect = self._shapes[0]
    rectStyle.color = assignColor(0)
    rect.draw(context, ratio, rectStyle)
    if (mode === DrawMode.VIEW) {
      self.drawTag(context, ratio, [rect.x, rect.y], self._color)
    }
    if (mode === DrawMode.CONTROL || this._selected || this._highlighted) {
      for (let i = 1; i <= 8; i += 1) {
        let style
        if (i === self._highlightedHandle) {
          style = highPointStyle
        } else {
          style = pointStyle
        }
        style.color = assignColor(i)
        const point = self._shapes[i]
        point.draw(context, ratio, style)
      }
    }
  }

  /** Temporary initialization on mouse down */
  public initTemp (
    state: State, start: Vector2D
  ) {

  }

  /** Handle mouse move */
  public onMouseMove (
    coord: Vector2D, limit: Size2D, labelIndex: number, handleIndex: number
  ) {

  }

  /** On key down */
  public onKeyDown (key: string): boolean {

  }

  /**
   * handle keyboard up event
   * @param e pressed key
   */
  public onKeyUp (e: string): void {

  }

  /**
   * Expand the primitive shapes to drawable shapes
   * @param {ShapeType[]} shapes
   */
  public updateShapes (shapes: ShapeType[]): void {

  }

  /** Get shape id's and shapes for updating */
  public shapeObjects (): [number[], ShapeTypeName[], ShapeType[]] {

  }
}

