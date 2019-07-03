import Session from '../common/session';
import {DrawableLabel, RectType, ShapeType, State} from '../functional/types';
import {LabelType} from '../functional/types';
import {Canvas} from '../components/canvas';
import * as types from '../action/types';
import {changeLabelShape} from '../action/creators';
/**
 * Basic controller
 * If there is no temporary object or algorithm involved, this is usually enough
 */
export class BaseController {
  /** controller states of the controller */
  public static ControllerStates = Object.freeze({
    NULL: 0
  });
  /** state of the controller */
  protected controllerState: number;
  /** default cursor style */
  public defaultCursorStyle: string;
  /** viewer */
  protected viewer: Canvas<any>;

  /**
   * initialize internal states
   * @param {Canvas<any>} viewer
   */
  constructor(viewer: Canvas<any>) {
    this.controllerState = BaseController.ControllerStates.NULL;
    this.defaultCursorStyle = 'default';
    this.viewer = viewer;
  }

  /**
   * Callback of redux store
   */
  protected onStateUpdated(): void {
  }

  /**
   * Callback of fast store update
   */
  protected onFastStateUpdated(): void {
  }

  /**
   * Dispatch actions from controllers
   * @param {object} action: action returned by action creator
   */
  protected static dispatch(action: object): void {
    Session.dispatch(action);
  }

  /**
   * Wrapper function for session getState
   * @return {State}
   */
  public static getState(): State {
    return Session.getState();
  }

  /**
   * Wrapper function for session getFastState
   * @return {State}
   */
  public static getFastState(): State {
    return Session.getFastState();
  }

  /**
   * Function to set the controller state
   * @param {number} state - The state to set to
   */
  protected setControllerState(state: number) {
    this.controllerState = state;
  }

  /**
   * Function to select a label
   * @param {number} labelId
   */
  protected selectLabelById(labelId: number) {
    BaseController.dispatch({
      type: types.SELECT_LABEL,
      labelId
    });
  }

  /**
   * Function to update a shape
   * @param {number} shapeId
   * @param {object} props
   */
  protected updateShape(shapeId: number,
                        props: object) {
    BaseController.dispatch(changeLabelShape(shapeId, props));
  }

  /**
   * Function to deselect all labels
   */
  protected deselectAllLabels() {
    this.selectLabelById(-1);
  }

  /**
   * Function to create a new label
   */
  protected createLabel(..._: any) {
    // create a label
  }

  /**
   * function to get DrawableLabel from state label
   * @param {LabelType} _label
   * @param {{ [key: string]: ShapeType }} _shapes
   * @return LabelType | null
   */
  public getDrawableLabelFromStateLabel(
    _label: LabelType,
    _shapes: { [key: string]: ShapeType }): DrawableLabel | null {
    return null;
  }

  /**
   * onMouseUp callback
   * @param {number[]} _: mouse position
   */
  public onMouseUp(_: number[]): void {
    // mouse up
  }

  /**
   * onMouseDown callback
   * @param {number[]} _: mouse position
   */
  public onMouseDown(_: number[]): void {
    // mouse down
  }

  /**
   * onMouseMove callback
   * @param {number[]} _: mouse position
   */
  public onMouseMove(_: number[]): void {
    // mouse move
  }

  /**
   * onDblClick callback
   * @param {number[]} _: mouse position
   */
  public onDblClick(_: number[]): void {
    // double click
  }

  /**
   * onWheel callback
   * @param {number[]} _: mouse position
   */
  public onWheel(_: number[]): void {
    // wheel
  }

  /**
   * onKeyDown callback
   * @param {number} _: key ID
   */
  public onKeyDown(_: number): void {
    // key down
  }

  /**
   * onKeyUp callback
   * @param {number} _: key ID
   */
  public onKeyUp(_: number): void {
    // key up
  }

  /**
   * Redraw a single label
   * @param {LabelType} _label
   * @param {ShapeType[]} _shapes
   * @param _context
   * @param {number} _displayToImageRatio
   * @param {boolean} _selected
   * @param {number} _hoveredShapeId
   */
  public redrawLabel(_label: LabelType,
                     _shapes: ShapeType[], _context: any,
                     _displayToImageRatio: number,
                     _selected: boolean,
                     _hoveredShapeId: number) {
    // redraw a single label
  }
}
