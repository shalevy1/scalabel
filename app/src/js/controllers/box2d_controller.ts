import * as types from '../action/types';
import {BaseController} from './base_controller';
import {LabelType, RectType, ShapeType, VertexType} from '../functional/types';
import {
  HANDLE_RADIUS,
  CONTROL_FILL_COLOR,
  ALPHA_CONTROL_POINT,
  redrawRect,
  redrawVertex,
  HOVERED_HANDLE_RADIUS, idx, LINE_WIDTH
} from '../functional/draw';
import {Canvas} from '../components/canvas';
import {ImageView} from '../components/image_view';
import {addBox2dLabel} from '../action/box2d';
import {changeLabelShape, updateMidpoint} from '../action/creators';
import {updateObject} from '../functional/util';

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

  // for box moving
  /** mouse position when moving starts */
  protected startMoveMousePos: number[];

  // for box resizing
  /** target handle number */
  protected targetHandleNo: number;
  /** target label */
  protected targetLabel: LabelType | null;

  /**
   * Constructor
   * @param {ImageView<any>} viewer
   */
  constructor(viewer: ImageView<any>) {
    super(viewer);
    this.defaultCursorStyle = 'crosshair';
    this.controllerState = Box2dController.ControllerStates.NULL;
    this.startMoveMousePos = [];
    this.targetHandleNo = -1;
    this.targetLabel = null;
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
   * Function to update a vertex
   * @param {number} shapeId
   * @param {object} props
   */
  protected updateVertex(shapeId: number,
                        props: object) {
    Box2dController.dispatch(changeLabelShape(shapeId, props));
  }

  /**
   * Function to update the midpoints and therectangle
   * @param {number} labelId
   */
  protected updateMidpoint(labelId: number) {
    Box2dController.dispatch(updateMidpoint(labelId));
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
    if (this.controllerState === Box2dController.ControllerStates.RESIZE) {
      this.targetHandleNo = -1;
      this.targetLabel = null;
      this.deselectAllShapes();
      this.setControllerState(Box2dController.ControllerStates.SELECTED);
    }
    this.viewer.redrawControlCanvas();
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
        this.setControllerState(Box2dController.ControllerStates.RESIZE);
        this.targetHandleNo = 5;
        this.targetLabel = this.viewer.getSelectedLabel();
      } else {
        // if targeted at an existing label, select it
        this.selectShapeById(hoveredShape.id);
        this.selectLabelById(hoveredShape.label);
        this.targetLabel = this.viewer.getLabelById(hoveredShape.label);
        if (this.targetLabel === null) {
          return;
        }
        // manipulation based on hovered shape
        if (hoveredShape.name === 'RectType') {
          // if clicked on the rectangle, start moving
          this.setControllerState(Box2dController.ControllerStates.MOVE);
          this.startMoveMousePos = mousePos;
        } else if (hoveredShape.name === 'VertexType') {
          // if clicked on a vertex, start resizing
          this.setControllerState(Box2dController.ControllerStates.RESIZE);
          this.targetHandleNo = this.targetLabel.shapes
            .indexOf(hoveredShape.id);
        }
      }
    }
  }

  /**
   * onMouseMove callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseMove(mousePos: number[]): void {
    console.log(this.controllerState, this.targetLabel)
    if (this.controllerState === Box2dController.ControllerStates.RESIZE
    && this.targetLabel !== null) {
      console.log('resizing')
      const shapeIds = this.targetLabel.shapes;
      let xChangedIdxs: number[] = [];
      let yChangedIdxs: number[] = [];
      if (this.targetHandleNo % 2 === 0) {
        // move a midpoint
        const changedIdxs = [
          idx(this.targetHandleNo + 1, 8),
          idx(this.targetHandleNo - 1, 8)];
        if (this.targetHandleNo % 4 === 0) {
          // horizontal
          xChangedIdxs = changedIdxs;
        } else {
          // vertical
          yChangedIdxs = changedIdxs;
        }
      } else {
        // move a vertex
        const nextIdx = idx(this.targetHandleNo + 2, 8);
        const prevIdx = idx(this.targetHandleNo - 2, 8);

        if (this.targetHandleNo === 1 || this.targetHandleNo === 5) {
          xChangedIdxs.push(prevIdx);
          yChangedIdxs.push(nextIdx);
        } else {
          xChangedIdxs.push(nextIdx);
          yChangedIdxs.push(prevIdx);
        }
      }
      // update vertex
      const [x, y] = this.viewer.toImageCoords(mousePos);
      this.updateVertex(shapeIds[this.targetHandleNo], {x, y});
      console.log('X_CHANGED', xChangedIdxs, 'X', x);
      for (const i of xChangedIdxs) {
        this.updateVertex(shapeIds[i], {x});
      }
      for (const i of yChangedIdxs) {
        this.updateVertex(shapeIds[i], {y});
      }
      // update the midpoints and the rectangle
      this.updateMidpoint(this.targetLabel.id);
    } else if (this.controllerState === Box2dController.ControllerStates.MOVE) {
      let dx = mousePos[0] - this.startMoveMousePos[0];
      let dy = mousePos[1] - this.startMoveMousePos[1];
      // make moved box within the image
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
      context, displayToImageRatio,
      LINE_WIDTH,
      label.color);
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

    // Redraw vertices if the label is hovered or selected
    if (labelHovered || true) {
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
