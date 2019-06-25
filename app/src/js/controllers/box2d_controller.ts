import * as types from '../actions/action_types';
import {BaseController} from './base_controller';

// Constants
// const States = Object.freeze({
//   FREE: 0, RESIZE: 1, MOVE: 2,
// });

/**
 * Box2D Controller
 */
export class Box2DController extends BaseController {

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
}
