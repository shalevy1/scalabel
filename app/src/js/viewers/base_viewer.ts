import {DrawableLabel} from '../functional/types';

/**
 * BaseViewer interface
 */
export class BaseViewer {
  /* :: controller: $Subtype<BaseController>; */
  /**
   * General viewer constructor
   */
  constructor() {
  }

  /**
   * Render the view
   * @param {DrawableLabel} _labels
   * @param {any} _context
   * @param {number} _displayToImageRatio
   * @param {number} _selectedLabelId
   * @param {number} _hoveredLabelId
   * @param {number} _hoveredShapeIndex
   * @param {boolean} _controlCanvasMode
   * @return {boolean}: whether redraw is successful
   */
  public redraw(_labels: DrawableLabel[],
                _context: any,
                _displayToImageRatio: number,
                _selectedLabelId: number,
                _hoveredLabelId: number,
                _hoveredShapeIndex: number,
                _controlCanvasMode: boolean = false) {
  }
}
