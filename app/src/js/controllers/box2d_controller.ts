import {BaseController} from './base_controller';
import {DrawableLabel, LabelType, RectType, ShapeType} from '../functional/types';
import {ImageView} from '../components/image_view';
import {addBox2dLabel} from '../action/box2d';
import {deleteLabel} from '../action/creators';
import {getLabelAndShapeIdFromControlIndex, idx} from '../functional/draw';
import {makeRect, makeVertex, VertexTypes} from '../functional/states';

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
  }

  /**
   * function to update the temporary label to the state
   */
  public updateTemporaryLabelToState() {
    const label = this.viewer.temporaryDrawableLabel;
    if (label) {
      const rect = label.shapes[0];
      if (label.id === -1) {
        // create a new label
        this.createLabel(rect.x, rect.y, rect.w, rect.h);
      } else {
        // update an existing label
        this.updateShape(rect.id, {
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h
        });
      }
    }
    this.viewer.resetTemporaryDrawableLabel();
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
   * Copy the currently selected label as the temporary drawable label
   * @return {DrawableLabel}
   */
  protected copySelectedLabelAsTemporaryDrawableLabel() {
    const selectedDrawableLabel = this.viewer.getSelectedDrawableLabel();
    const rect = selectedDrawableLabel.shapes[0];
    const temporaryDrawableLabel = this.getBox2dDrawableLabel(
      rect,
      selectedDrawableLabel.category, selectedDrawableLabel.id,
      selectedDrawableLabel.color
    );
    this.viewer.setTemporaryDrawableLabel(temporaryDrawableLabel);
  }

  /**
   * function to get DrawableLabel from state label
   * @param {LabelType} label
   * @param {{[key: string]: ShapeType}} shapes
   * @return {DrawableLabel}
   */
  public getDrawableLabelFromStateLabel(
    label: LabelType,
    shapes: {[key: string]: ShapeType}): DrawableLabel {
    const rect = shapes[label.shapes[0]] as RectType;
    return this.getBox2dDrawableLabel(
      rect,
      label.category,
      label.id,
      label.color);
  }

  /**
   * Create AddLabelAction to create a box2d label
   * @param {RectType} rect
   * @param {number[]} category: list of category ids
   * @param {number} id
   * @param {number[]} color
   * @return {DrawableLabel}
   */
  protected getBox2dDrawableLabel(
    rect: RectType,
    category: number[] = [0], id: number = -1, color: number[] | null = null)
    : DrawableLabel {
    // FIXME: add category
    const x = rect.x;
    const y = rect.y;
    const w = rect.w;
    const h = rect.h;

    // vertices
    const tl = makeVertex({x, y});
    const tr = makeVertex({x: x + w, y});
    const bl = makeVertex({x, y: y + h});
    const br = makeVertex({x: x + w, y: y + h});

    // midpoints
    const tm = makeVertex({x: x + w / 2, y,
      type: VertexTypes.MIDPOINT});
    const bm = makeVertex({x: x + w / 2, y: y + h,
      type: VertexTypes.MIDPOINT});
    const lm = makeVertex({x, y: y + h / 2,
      type: VertexTypes.MIDPOINT});
    const rm = makeVertex({x: x + w, y: y + h / 2,
      type: VertexTypes.MIDPOINT});

    // use the color of the next label if null
    if (color === null) {
      color = this.viewer.getColorOfNextLabel();
    }

    return {
      id, category, color,
      shapes: [rect, tl, tm, tr, rm, br, bm, bl, lm],
      type: 'box2d'
    };
  }

  /**
   * Get new box2d label
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @return {DrawableLabel}
   */
  protected newBox2dDrawableLabel(x: number, y: number, w: number, h: number)
    : DrawableLabel {
    const rect = makeRect({x, y, w, h});
    return this.getBox2dDrawableLabel(rect);
  }

  /**
   * Function to update the temporary label
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   */
  protected updateTemporaryLabel(x: number, y: number, w: number, h: number) {
    const previousLabel = this.viewer.temporaryDrawableLabel;
    const rect = previousLabel.shapes[0];
    rect.x = x;
    rect.y = y;
    rect.w = w;
    rect.h = h;
    if (previousLabel) {
      const label = this.getBox2dDrawableLabel(rect,
        previousLabel.category, previousLabel.id, previousLabel.color
      );
      this.viewer.setTemporaryDrawableLabel(label);
    }
  }

  /**
   * Function to delete a label
   * @param {number} itemId
   * @param {number} labelId
   */
  protected deleteLabel(itemId: number, labelId: number) {
    Box2dController.dispatch(deleteLabel(itemId, labelId));
  }

  /**
   * Check if the label is valid
   * @param {DrawableLabel} label
   */
  protected isLabelValid(label: DrawableLabel) {
    const rect = label.shapes[0] as RectType;
    return rect.w > 5 && rect.h > 5;
  }

  /**
   * Function to set the controller state
   * @param {number} state - The state to set to
   */
  protected setControllerState(state: number) {
    if (state === Box2dController.ControllerStates.NULL) {
      this.viewer.resetTemporaryDrawableLabel();
      this.viewer.redrawLabelCanvas();
      this.deselectAllLabels();
    } else if (state === Box2dController.ControllerStates.SELECTED) {
      // select
      this.viewer.resetTemporaryDrawableLabel();
      this.viewer.redrawLabelCanvas();
    } else if (state === Box2dController.ControllerStates.RESIZE) {
      // resize
    } else if (state === Box2dController.ControllerStates.MOVE) {
      // move
      this.copySelectedLabelAsTemporaryDrawableLabel();
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
   * @param {number[]} _mousePos - mouse position
   */
  public onMouseUp(_mousePos: number[]): void {
    if (this.controllerState === Box2dController.ControllerStates.RESIZE) {
      if (!this.isLabelValid(this.viewer.temporaryDrawableLabel)) {
        // set controller state to null without updating temporary label
        this.setControllerState(Box2dController.ControllerStates.NULL);
      } else {
        this.updateTemporaryLabelToState();
        this.viewer.updateDrawableLabels();
        this.setControllerState(Box2dController.ControllerStates.SELECTED);
      }
      this.targetHandleNo = -1;
    }
    this.viewer.redrawControlCanvas();
  }

  /**
   * onMouseDown callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseDown(mousePos: number[]): void {
    // find the target shape
    if (this.controllerState === Box2dController.ControllerStates.NULL ||
        this.controllerState === Box2dController.ControllerStates.SELECTED) {
      if (this.viewer.hoveredLabelId < 0) {
        // start a new label
        const newLabel = this.newBox2dDrawableLabel(
          mousePos[0], mousePos[1], 0, 0);
        this.viewer.setTemporaryDrawableLabel(newLabel);
        this.setControllerState(Box2dController.ControllerStates.RESIZE);
        this.targetHandleNo = 5;
      } else {
        // if targeted at an existing label, select it
        this.selectLabelById(this.viewer.hoveredLabelId);
        this.copySelectedLabelAsTemporaryDrawableLabel();
        // manipulation based on hovered shape
        if (this.viewer.hoveredShapeIndex === 0) {
          // if clicked on the rectangle, start moving
          this.setControllerState(Box2dController.ControllerStates.MOVE);
          this.startMoveMousePos = mousePos;
        } else {
          // if clicked on a vertex, start resizing
          this.setControllerState(Box2dController.ControllerStates.RESIZE);
          this.targetHandleNo = this.viewer.hoveredShapeIndex;
        }
      }
    }
    this.viewer.redrawLabelCanvas();
  }

  /**
   * onMouseMove callback
   * @param {number[]} mousePos - mouse position
   */
  public onMouseMove(mousePos: number[]): void {
    if (this.controllerState === Box2dController.ControllerStates.RESIZE
    && this.viewer.temporaryDrawableLabel !== null) {
      const [x, y] = this.viewer.toImageCoords(mousePos);
      const shapes = this.viewer.temporaryDrawableLabel.shapes;
      let x1;
      let x2;
      let y1;
      let y2;
      if (this.targetHandleNo % 2 === 0) {
        // move a midpoint
        const v1 = shapes[1];
        const v2 = shapes[5];
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
        if (x === x1) {
          this.targetHandleNo = 8;
        } else if (x === x2) {
          this.targetHandleNo = 4;
        } else if (y === y1) {
          this.targetHandleNo = 2;
        } else if (y === y2) {
          this.targetHandleNo = 6;
        }
      } else {
        // move a vertex
        const oppVertex = shapes[idx(this.targetHandleNo + 4, 8)];
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
      // update drawable label
      this.updateTemporaryLabel(x1, y1, x2 - x1, y2 - y1);
      this.setCursorByHandleNo(this.targetHandleNo);
    } else if (this.controllerState === Box2dController.ControllerStates.MOVE) {
      let dx = mousePos[0] - this.startMoveMousePos[0];
      let dy = mousePos[1] - this.startMoveMousePos[1];
      // make moved box within the image
    } else if (this.controllerState ===
      Box2dController.ControllerStates.SELECTED ||
      this.controllerState === Box2dController.ControllerStates.NULL) {
      if (this.viewer.hoveredLabelId >= 0) {
        this.setCursorByHandleNo(this.viewer.hoveredShapeIndex);
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
}
