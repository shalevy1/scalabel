import * as types from '../action/types';
import {BaseController} from './base_controller';
import {LabelType, RectType, ShapeType, VertexType} from '../functional/types';
import {
  HANDLE_RADIUS,
  CONTROL_FILL_COLOR,
  ALPHA_CONTROL_POINT,
  redrawRect,
  redrawVertex,
  HOVERED_HANDLE_RADIUS
} from '../functional/draw';

/**
 * Box2D Controller
 */
export class Box2DController extends BaseController {

  constructor() {
    super();
    this.ControllerStates = Object.freeze({
      NULL: 0, RESIZE: 1, MOVE: 2
    });
    this.controllerState = this.ControllerStates.NULL;
    this.defaultCursorStyle = 'crosshair';
  }

  /**
   * onMouseUp callback
   * @param {MouseEvent} event: mouse event
   */
  public onMouseUp(event: MouseEvent): void {
    // mouse up
    const state = Box2DController.getState();
    // dispatch a newBox dummy action here to test Box2dViewer
    Box2DController.dispatch({
      type: types.NEW_IMAGE_BOX2D_LABEL,
      itemId: state.current.item,
      optionalAttributes: {x: event.x, y: event.y, w: 70, h: 35}
    });
  }

  /**
   * onMouseDown callback
   * @param {MouseEvent} _: mouse event
   */
  public onMouseDown(_: MouseEvent): void {
    // mouse down
  }

  /**
   * onMouseMove callback
   * @param {MouseEvent} _: mouse event
   */
  public onMouseMove(_: MouseEvent): void {
    // mouse move
  }

  /**
   * onDblClick callback
   * @param {MouseEvent} _: mouse event
   */
  public onDblClick(_: MouseEvent): void {
    // double click
  }

  /**
   * onWheel callback
   * @param {WheelEvent} _: wheel event
   */
  public onWheel(_: WheelEvent): void {
    // wheel
  }

  /**
   * onKeyDown callback
   * @param {KeyboardEvent} _: keyboard event
   */
  public onKeyDown(_: KeyboardEvent): void {
    // key down
  }

  /**
   * onKeyUp callback
   * @param {KeyboardEvent} _: keyboard event
   */
  public onKeyUp(_: KeyboardEvent): void {
    // key up
  }

  /**
   * Redraw a single label
   * @param {LabelType} label
   * @param {ShapeType[]} shapes
   * @param context
   * @param {number} displayToImageRatio
   * @param {number} hoveredShapeId
   */
  public redrawLabel(label: LabelType,
                     shapes: ShapeType[],
                     context: any,
                     displayToImageRatio: number,
                     hoveredShapeId: number) {
    // Redraw rectangle
    redrawRect(shapes[label.shapes[0]] as RectType,
      context, displayToImageRatio);

    let labelHovered = false;
    // Check if label hovered
    if (hoveredShapeId > 0) {
      for (const shapeId of label.shapes) {
        if (shapeId === hoveredShapeId) {
          labelHovered = true;
          break;
        }
      }
    }

    // Redraw vertices if the label is hovered
    if (labelHovered) {
      for (let i = 1; i <= 8; i++) {
        const shapeId = label.shapes[i];
        // color and alpha
        let color = label.color;
        let alpha = 1;
        if (i % 2 === 0) {
          color = CONTROL_FILL_COLOR;
          alpha = ALPHA_CONTROL_POINT;
        }

        // radius
        let radius = HANDLE_RADIUS;
        if (shapeId === hoveredShapeId) {
          radius = HOVERED_HANDLE_RADIUS;
        }
        redrawVertex(shapes[shapeId] as VertexType,
          context, displayToImageRatio,
          radius, color, alpha);
      }
    }
  }
}
