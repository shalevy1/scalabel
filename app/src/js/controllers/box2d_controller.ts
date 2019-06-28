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
import {Canvas} from '../components/canvas';
import {ImageView} from '../components/image_view';
import {addBox2dLabel} from '../action/box2d';

/**
 * Box2D Controller
 */
export class Box2dController extends BaseController {
  /** The controller states */
  public static ControllerStates = Object.freeze({
    NULL: 0, SELECTED: 1, RESIZE: 2, MOVE: 3
  });

  /** image viewer */
  protected viewer: ImageView<any>;

  /** for box moving */
  protected startMoveMousePos: number[];

  /**
   * Constructor
   * @param {ImageView<any>} viewer
   */
  constructor(viewer: ImageView<any>) {
    super(viewer);
    this.defaultCursorStyle = 'crosshair';
    this.controllerState = Box2dController.ControllerStates.NULL;
  }

  /**
   * Function to create a new label
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  protected createLabel(x: number, y: number, w: number, h: number) {
    // FIXME: add category
    Box2dController.dispatch(addBox2dLabel([0], x, y, w, h));
  }

  /**
   * Function to set the controller state
   * @param {number} state - The state to set to
   */
  protected setControllerState(state: number) {
    if (state === Box2dController.ControllerStates.NULL) {
      this.deselectAllLabels();
      this.viewer.redrawLabelCanvas();
    } else if (state === Box2dController.ControllerStates.SELECTED) {
      // select
      this.viewer.redrawLabelCanvas();
    } else if (state === Box2dController.ControllerStates.RESIZE) {
      // resize
    } else if (state === Box2dController.ControllerStates.MOVE) {
      // move
    }
    this.controllerState = state;
  }

  /**
   * onMouseUp callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseUp(mousePos: number[]): void {

  }

  /**
   * onMouseDown callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseDown(mousePos: number[]): void {
    // find the target shape
    const hoveredShape = this.viewer.getHoveredShape();
    if (this.controllerState ===
      Box2dController.ControllerStates.NULL) {
      if (hoveredShape === null) {
        // start a new label
        this.createLabel(mousePos[0], mousePos[1], 0, 0);
      } else {
        // if targeted at an existing label, select it
        this.selectLabelById(hoveredShape.label);
        // manipulation based on hovered shape
        if (hoveredShape.name === 'RectType') {
          // if clicked on the rectangle, start moving
          this.setControllerState(Box2dController.ControllerStates.MOVE);
          this.startMoveMousePos = mousePos;
        } else if (hoveredShape.name === 'VertexType') {
          // if clicked on a vertex, start resizing
          this.setControllerState(Box2dController.ControllerStates.RESIZE);
        }
      }
    }
  }

  /**
   * onMouseMove callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseMove(mousePos: number[]): void {
    if (this.controllerState === Box2dController.ControllerStates.RESIZE) {

    }
  }

  /**
   * onDblClick callback
   * @param {number[]} mousePos - mouse position
   */
  public onDblClick(mousePos: number[]): void {
    // double click
  }

  /**
   * onWheel callback
   * @param {number[]} mousePos - mouse position
   */
  public onWheel(mousePos: number[]): void {
    // wheel
  }

  /**
   * onKeyDown callback
   * @param {number} keyId: key ID
   */
  public onKeyDown(keyId: number): void {
    // key down
  }

  /**
   * onKeyUp callback
   * @param {number} keyId: key ID
   */
  public onKeyUp(keyId: number): void {
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
