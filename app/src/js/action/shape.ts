import {makeVertex} from '../functional/states';
import {RectType, ShapeType, VertexType} from '../functional/types';
import {AddLabelAction} from './types';
import * as actions from './creators';
import * as labels from '../common/label_types';

/**
 * Create AddLabelAction to create a box2d label
 * @param {number[]} category: list of category ids
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @return {AddLabelAction}
 */
export function addBox2dLabel(
  category: number[],
  x: number, y: number, w: number, h: number): AddLabelAction {
  // create the rect object
  const rect = makeRect({x, y, w, h});
  const label = makeLabel({type: labels.BOX_2D, category});
  return actions.addLabel(label, [rect]);
}

/**
 * Function to redraw shape
 * @param {ShapeType} shape - the shape to redraw
 * @param {HTMLCanvasElement} canvas - the canvas to redraw on
 * @param {any} context - the context to redraw on
 */
export function redrawShape(shape: ShapeType,
                            canvas: HTMLCanvasElement, context: any) {
  if (shape instanceof VertexType) {
    redrawVertex(shape, canvas, context);
  } else if (shape instanceof RectType) {
    redrawRect(shape, canvas, context);
  }
}

/**
 * Function to redraw vertex
 * @param {VertexType} vertex - the vertex to redraw
 * @param {HTMLCanvasElement} canvas - the canvas to redraw on
 * @param {any} context - the context to redraw on
 */
export function redrawVertex(vertex: VertexType,
                             canvas: HTMLCanvasElement, context: any,
                             displayToImageRatio: number,
                             color: [number] = [1, 1, 1],
                             alpha: number = 1,
                             radius: number = 5,
                             ) {

}

/**
 * Function to redraw a rectangle
 * @param {RectType} rect - the rectangle to redraw
 * @param {HTMLCanvasElement} canvas - the canvas to redraw on
 * @param {any} context - the context to redraw on
 */
export function redrawRect(rect: RectType,
                           canvas: HTMLCanvasElement, context: any,
                           displayToImageRatio: number,
                           color: [number] = [1, 1, 1],
                           alpha: number = 1,
                           dashed: boolean = false) {

}
