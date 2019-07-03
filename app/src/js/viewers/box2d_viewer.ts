import {
  ALPHA_CONTROL_POINT,
  CONTROL_FILL_COLOR,
  CONTROL_HANDLE_RADIUS,
  CONTROL_LINE_WIDTH,
  getControlColorFromLabelAndShapeId,
  getLabelAndShapeIdFromControlIndex,
  HANDLE_RADIUS,
  HOVERED_HANDLE_RADIUS,
  LINE_WIDTH,
  redrawRect,
  redrawVertex,
} from '../functional/draw';
import {DrawableLabel, RectType, VertexType} from '../functional/types';
import {BaseViewer} from './base_viewer';

/**
 * Box2d viewer class
 */
export class Box2dViewer extends BaseViewer {
  /**
   * Redraw a single label
   * @param {DrawableLabel} labels
   * @param {any} context
   * @param {number} displayToImageRatio
   * @param {number} selectedLabelId
   * @param {number} hoveredIndex
   * @param {boolean} controlCanvasMode
   * @return {boolean}
   */
  public redraw(labels: DrawableLabel[],
                context: any,
                displayToImageRatio: number,
                selectedLabelId: number,
                hoveredIndex: number,
                controlCanvasMode: boolean = false): boolean {
    // find hovered label and shape ID
    const [hoveredLabelId, hoveredShapeId] =
      getLabelAndShapeIdFromControlIndex(hoveredIndex);
    for (const label of labels) {
      // redraw rectangle
      // if (label.id === -1) {
      //   // FIXME: temporary label
      // }
      let color = label.color;
      let lineWidth = LINE_WIDTH;
      if (controlCanvasMode) {
        color = getControlColorFromLabelAndShapeId(label.id, 0);
        lineWidth = CONTROL_LINE_WIDTH;
      }
      redrawRect(label.shapes[0] as RectType, context,
        displayToImageRatio,
        lineWidth, color);

      // Redraw vertices if the label is hovered or selected
      if (label.id === hoveredLabelId || label.id === selectedLabelId) {
        for (let i = 1; i <= 8; i++) {
          // color and alpha
          let color = label.color;
          let alpha = 1;
          let radius = HANDLE_RADIUS;
          if (controlCanvasMode) {
            // control canvas
            color = getControlColorFromLabelAndShapeId(label.id, i);
            radius = CONTROL_HANDLE_RADIUS;
          } else {
            // label canvas
            if (i % 2 === 0) {
              color = CONTROL_FILL_COLOR;
              alpha = ALPHA_CONTROL_POINT;
            }
            // radius
            if (i === hoveredShapeId) {
              radius = HOVERED_HANDLE_RADIUS;
            }
          }
          redrawVertex(label.shapes[i] as VertexType, context,
            displayToImageRatio,
            radius, color, alpha);
        }
      }
    }
    return true;
  }
}
