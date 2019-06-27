import Session from '../common/session';
import {ShapeType, State} from '../functional/types';
import {LabelType} from '../functional/types';

/**
 * Basic controller
 * If there is no temporary object or algorithm involved, this is usually enough
 */
export class BaseController {
  /** all possible states of the controller */
  public ControllerStates: any;
  /** state of the controller */
  protected controllerState: number;
  /** default cursor style */
  public defaultCursorStyle: string;
  /** selected label */
  protected selectedLabel: LabelType | null;

  /**
   * initialize internal states
   */
  constructor() {
    this.ControllerStates = Object.freeze({
      NULL: 0
    });
    this.controllerState = this.ControllerStates.NULL;
    this.defaultCursorStyle = 'default';
    this.selectedLabel = null;
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
   * onMouseUp callback
   * @param {MouseEvent} _: mouse event
   */
  public onMouseUp(_: MouseEvent): void {
    // mouse up
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
   * @param {LabelType} _label
   * @param {ShapeType[]} _shapes
   * @param _context
   * @param {number} _displayToImageRatio
   * @param {number} _hoveredShapeId
   */
  public redrawLabel(_label: LabelType,
                     _shapes: ShapeType[], _context: any,
                     _displayToImageRatio: number,
                     _hoveredShapeId: number) {
    // redraw a single label
  }
}
