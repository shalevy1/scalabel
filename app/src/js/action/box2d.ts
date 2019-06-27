import {makeLabel, makeRect, makeVertex, VertexTypes} from '../functional/states';
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
    // rectangle
    const rect = makeRect({x, y, w, h});

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

    const label = makeLabel({type: labels.BOX_2D, category});
    return actions.addLabel(label, [rect, tl, tm, tr, rm, br, bm, bl, lm]);
}
