import Session from '../common/session';
import {State, StateType} from '../functional/types';

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
    this.viewers = [];
  }

  /**
   * Set the connected viewer
   * @param {BaseViewer} viewer: reference to corresponding viewer
   */
  addViewer(viewer: BaseViewer): void {
    this.viewers.push(viewer);
  }

  /**
   * Callback of redux store
   */
  onStateUpdated(): void {
    for (let viewer of this.viewers) {
      viewer.updateState(this.getState());
    }
  }

  /**
   * Callback of fast store update
   */
  onFastStateUpdated(): void {
    for (let viewer of this.viewers) {
      viewer.updateFastState(this.getFastState());
    }
  }

  /**
   * Dispatch actions from controllers
   * @param {Object} action: action returned by action creator
   */
  dispatch(action: Object): void {
    Session.dispatch(action);
  }

  /**
   * Wrapper function for session getState
   * @return {State}
   */
  getState(): State {
    return Session.getState();
  }

  /**
   * Wrapper function for session getFastState
   * @return {State}
   */
  getFastState(): State {
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
