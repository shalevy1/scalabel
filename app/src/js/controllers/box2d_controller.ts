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
import {changeLabelShape, deleteLabel, updateMidpoint} from '../action/creators';
import {updateObject} from '../functional/util';
import {Label} from '@material-ui/icons';

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
   * Function to delete a label
   * @param {number} labelId
   */
  protected deleteLabel(labelId: number) {
    Box2dController.dispatch(deleteLabel(labelId));
  }

  /**
   * Check if the label is valid
   * @param {LabelType} label
   */
  protected isLabelValid(label: LabelType) {
    const rect = this.viewer.getShapeById(label.shapes[0]);
    return rect.w > 5 && rect.h > 5;
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
   * Set cursor by handle number
   * @param {number} handleNo
   */
  public setCursorByHandleNo(handleNo: number) {
    if (handleNo === 0) {
      // rectangle
      this.viewer.setCursor('move');
    } else if (handleNo === 1 || handleNo === 5) {
      this.viewer.setCursor('nwse-resize');
    } else if (handleNo === 3 || handleNo === 7) {
      this.viewer.setCursor('nesw-resize');
    } else if (handleNo === 2 || handleNo === 6) {
      this.viewer.setCursor('ns-resize');
    } else if (handleNo === 4 || handleNo === 8) {
      this.viewer.setCursor('ew-resize');
    }
  }

  /**
   * onMouseUp callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseUp(mousePos: number[]): void {
    if (this.controllerState === Box2dController.ControllerStates.RESIZE) {
      this.deselectAllShapes();
      if (!this.isLabelValid(this.targetLabel)) {
        this.deleteLabel(this.targetLabel.id);
        this.setControllerState(Box2dController.ControllerStates.NULL);
      } else {
        this.setControllerState(Box2dController.ControllerStates.SELECTED);
      }
      this.targetHandleNo = -1;
      this.targetLabel = null;
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
    if (this.controllerState === Box2dController.ControllerStates.NULL ||
        this.controllerState === Box2dController.ControllerStates.SELECTED) {
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
    if (this.controllerState === Box2dController.ControllerStates.RESIZE
    && this.targetLabel !== null) {
      const [x, y] = this.viewer.toImageCoords(mousePos);
      const shapeIds = this.targetLabel.shapes;
      let x1;
      let x2;
      let y1;
      let y2;
      if (this.targetHandleNo % 2 === 0) {
        // move a midpoint
        const v1 = this.viewer.getShapeById(shapeIds[1]);
        const v2 = this.viewer.getShapeById(shapeIds[5]);
        if (this.targetHandleNo === 2) {
          v1.y = y;
        } else if (this.targetHandleNo === 4) {
          v2.x = x;
        } else if (this.targetHandleNo === 6) {
          v2.y = y;
        } else if (this.targetHandleNo === 8) {
          v1.x = x;
        }
        x1 = Math.min(v1.x, v2.x);
        x2 = Math.max(v1.x, v2.x);
        y1 = Math.min(v1.y, v2.y);
        y2 = Math.max(v1.y, v2.y);
      } else {
        // move a vertex
        const oppVertex = this.viewer.getShapeById(
          shapeIds[idx(this.targetHandleNo + 4, 8))];
        x1 = Math.min(x, oppVertex.x);
        x2 = Math.max(x, oppVertex.x);
        y1 = Math.min(y, oppVertex.y);
        y2 = Math.max(y, oppVertex.y);
        if (oppVertex.x < x) {
          if (oppVertex.y < y) {
            this.targetHandleNo = 5;
          } else {
            this.targetHandleNo = 3;
          }
        } else {
          if (oppVertex.y < y) {
            this.targetHandleNo = 7;
          } else {
            this.targetHandleNo = 1;
          }
        }
      }
      // update vertex
      this.updateShape(shapeIds[1], {x: x1, y: y1});
      this.updateShape(shapeIds[3], {x: x2, y: y1});
      this.updateShape(shapeIds[5], {x: x2, y: y2});
      this.updateShape(shapeIds[7], {x: x1, y: y2});
      // update midpoint
      this.updateShape(shapeIds[2], {x: (x1 + x2) / 2, y: y1});
      this.updateShape(shapeIds[4], {x: x2, y: (y1 + y2) / 2});
      this.updateShape(shapeIds[6], {x: (x1 + x2) / 2, y: y2});
      this.updateShape(shapeIds[8], {x: x1, y: (y1 + y2) / 2});
      // update rectangle
      this.updateShape(shapeIds[0], {x: x1, y: y1, w: x2 - x1, h: y2 - y1});
      this.setCursorByHandleNo(this.targetHandleNo);
    } else if (this.controllerState === Box2dController.ControllerStates.MOVE) {
      let dx = mousePos[0] - this.startMoveMousePos[0];
      let dy = mousePos[1] - this.startMoveMousePos[1];
      // make moved box within the image
    } else if (this.controllerState ===
      Box2dController.ControllerStates.SELECTED ||
      this.controllerState === Box2dController.ControllerStates.NULL) {
      const hoveredShape = this.viewer.getHoveredShape();
      if (hoveredShape) {
        const hoveredLabel = this.viewer.getLabelById(hoveredShape.label);
        const handleNo = hoveredLabel.shapes.indexOf(hoveredShape.id);
        this.setCursorByHandleNo(handleNo);
      }
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
   * @param {boolean} selected
   * @param {number} hoveredShapeId
   */
  public redrawLabel(label: LabelType,
                     shapes: ShapeType[],
                     context: any,
                     displayToImageRatio: number,
                     selected: boolean,
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
    if (labelHovered || selected) {
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
