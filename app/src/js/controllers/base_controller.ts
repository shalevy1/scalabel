import Session from '../common/session';
import {StateType} from '../functional/types';

/**
 * Basic controller
 * If there is no temporary object or algorithm involved, this is usually enough
 */
export class BaseController {
  /* :: viewers: Array<BaseViewer>; */

  /**
   * initialize internal states
   */
  constructor() {
    // constructor
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
   * @return {StateType}
   */
  protected static getState(): StateType {
    return Session.getState();
  }

  /**
   * Wrapper function for session getFastState
   * @return {StateType}
   */
  protected static getFastState(): StateType {
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
}
