import React from 'react';
import Session from '../common/session';
import type {ImageViewerConfigType}
from '../functional/types';
import {withStyles} from '@material-ui/core/styles/index';
import * as types from '../actions/action_types';
import {sprintf} from 'sprintf-js';

const styles = () => ({
  canvas: {
    position: 'absolute',
  },
});

const pad = 10;

type Props = {
  classes: Object,
  theme: Object,
  labelType: string,
}

/**
 * Get the current item in the state
 * @return {ItemType}
 */
function getCurrentItem() {
  let state = Session.getState();
  return state.items[state.current.item];
}

/**
 * Retrieve the current viewer configuration
 * @return {ViewerConfigType}
 */
function getCurrentViewerConfig() {
  let state = Session.getState();
  return state.items[state.current.item].viewerConfig;
}

/**
 * Canvas Viewer
 */
class ImageView extends React.Component<Props> {
  canvas: Object;
  context: Object;
  MAX_SCALE: number;
  MIN_SCALE: number;
  SCALE_RATIO: number;
  UP_RES_RATIO: number;
  scale: number;
  // need these two below to prevent jitters caused by round off
  canvasHeight: number;
  canvasWidth: number;
  displayToImageRatio: number;
  // False for image canvas, true for anything else
  upRes: boolean;
  /**
   * Constructor, handles subscription to store
   * @param {Object} props: react props
   */
  constructor(props: Object) {
    super(props);

    this.MAX_SCALE = 3.0;
    this.MIN_SCALE = 1.0;
    this.zoomRatio = 1.05;
    this.scrollZoomRatio = 1.05;
    this.UP_RES_RATIO = 2;
    this._keyDownMap = {};

    // this.setupController();

    // set keyboard listeners
    document.onkeydown = (e) => this.onKeyDown(e);
    document.onkeyup = (e) => this.onKeyUp(e);
  }

  // setupController() {
  //   if (this.props.labelType === 'box') {
  //     // this.controller =
  //   } else if (this.props.labelType === 'seg') {
  //
  //   } else if (this.props.labelType === 'tag') {
  //
  //   }
  // }

  /**
   * Get the coordinates of the upper left corner of the image canvas
   * @return {[number]} the x and y coordinates
   */
  getVisibleCanvasCoords() {
    let imgRect = this.imageCanvas.getBoundingClientRect();
    return [this.maskRect.x - imgRect.x, this.maskRect.y - imgRect.y];
  }

  /**
   * Get the mouse position on the canvas in the image coordinates.
   * @param {object} e: mouse event
   * @return {object}: mouse position (x,y) on the canvas
   */
  getMousePos(e) {
    let [offsetX, offsetY] = this.getVisibleCanvasCoords();
    let x = e.clientX - this.maskRect.x + offsetX;
    let y = e.clientY - this.maskRect.y + offsetY;

    // limit the mouse within the image
    x = Math.max(0, Math.min(x, this.canvasWidth));
    y = Math.max(0, Math.min(y, this.canvasHeight));

    // return in the image coordinates
    return {
      x: x / this.displayToImageRatio,
      y: y / this.displayToImageRatio,
    };
  }

  /**
   * Callback function when mouse is down
   * @param {Object} e - event
   */
  onMouseDown(e) { // eslint-disable-line
  }

  /**
   * Callback function when mouse is up
   * @param {Object} e - event
   */
  onMouseUp(e) { // eslint-disable-line
  }

  /**
   * Callback function when mouse moves
   * @param {Object} e - event
   */
  onMouseMove(e) { // eslint-disable-line
  }

  /**
   * Callback function for scrolling
   * @param {Object} e - event
   */
  onWheel(e) {
    if (this.isKeyDown('ctrl')) { // control for zoom
      e.preventDefault();
      let mousePos = this.getMousePos(e);
      if (this.scrollTimer !== null) {
        clearTimeout(this.scrollTimer);
      }
      if (e.deltaY < 0) {
        this.zoomHandler(this.scrollZoomRatio, mousePos.x, mousePos.y);
      } else if (e.deltaY > 0) {
        this.zoomHandler(1 / this.scrollZoomRatio, mousePos.x, mousePos.y);
      }
      this.redraw();
      // this.redrawImageCanvas();
      // this.redrawLabelCanvas();
      // this.scrollTimer = setTimeout(function() {
      //   this.redrawHiddenCanvas();
      // }, 150);
    }
  }

  /**
   * Callback function when double click occurs
   * @param {Object} e - event
   */
  onDoubleClick(e) { // eslint-disable-line
  }

  /**
   * Callback function when key is down
   * @param {Object} e - event
   */
  onKeyDown(e) {
    let keyID = e.KeyCode ? e.KeyCode : e.which;
    this._keyDownMap[keyID] = true;
    if (keyID === 187) {
      // + for zooming in
      this.zoomHandler(this.zoomRatio);
    } else if (keyID === 189) {
      // - for zooming out
      this.zoomHandler(1 / this.zoomRatio);
    }
  }

  /**
   * Callback function when key is up
   * @param {Object} e - event
   */
  onKeyUp(e) {
    let keyID = e.KeyCode ? e.KeyCode : e.which;
    delete this._keyDownMap[keyID];
  }

  /**
   * Whether a specific key is pressed down
   * @param {string} c - the key to check
   * @return {*}
   */
  isKeyDown(c) {
    if (c === 'ctrl') {
      // ctrl or command key
      return this._keyDownMap[17] || this._keyDownMap[91];
    }
    return this._keyDownMap[c.charCodeAt()];
  }

  /**
   * Handler for zooming
   * @param {number} ratio - the zoom ratio
   * @param {number} offsetX - the offset of x for zooming to cursor
   * @param {number} offsetY - the offset of y for zooming to cursor
   */
  zoomHandler(ratio, offsetX, offsetY) {
    let newScale = getCurrentViewerConfig().viewScale * ratio;
    if (newScale >= this.MIN_SCALE && newScale <= this.MAX_SCALE) {
      Session.dispatch({type: types.IMAGE_ZOOM, ratio: ratio,
        viewOffsetX: offsetX, viewOffsetY: offsetY});
    }
  }

  /**
   * Convert image coordinate to canvas coordinate.
   * If affine, assumes values to be [x, y]. Otherwise
   * performs linear transformation.
   * @param {Array<number>} values - the values to convert.
   * @param {boolean} upRes
   * @return {Array<number>} - the converted values.
   */
  toCanvasCoords(values: Array<number>, upRes: boolean) {
    if (values) {
      for (let i = 0; i < values.length; i++) {
        values[i] *= this.displayToImageRatio;
        if (upRes) {
          values[i] *= this.UP_RES_RATIO;
        }
      }
    }
    return values;
  }

  /**
   * Convert canvas coordinate to image coordinate.
   * If affine, assumes values to be [x, y]. Otherwise
   * performs linear transformation.
   * @param {Array<number>} values - the values to convert.
   * @return {Array<number>} - the converted values.
   */
  toImageCoords(values: Array<number>) {
    if (values) {
      for (let i = 0; i < values.length; i++) {
        values[i] /= this.displayToImageRatio;
      }
    }
    return values;
  }

  /**
   * Get the padding for the image given its size and canvas size.
   * @return {object} padding
   */
  _getPadding() {
    return {
      x: Math.max(0, (this.maskRect.width - this.canvasWidth) / 2),
      y: Math.max(0, (this.maskRect.height - this.canvasHeight) / 2),
    };
  }

  /**
   * Set the scale of the image in the display
   * @param {Object} canvas
   * @param {boolean} upRes
   */
  updateScale(canvas: Object, upRes: boolean) {
    let config: ImageViewerConfigType = getCurrentViewerConfig();
    // mouseOffset
    let mouseOffset;
    let upperLeftCoords;
    if (config.viewScale > 1.0) {
      upperLeftCoords = this.getVisibleCanvasCoords();
      if (config.viewOffsetX === undefined) {
        mouseOffset = [
          Math.min(this.maskRect.width, this.imageCanvas.width) / 2,
          Math.min(this.maskRect.height, this.imageCanvas.height) / 2,
        ];
      } else {
        mouseOffset = this.toCanvasCoords(
            [config.viewOffsetX, config.viewOffsetY], false);
        mouseOffset[0] -= upperLeftCoords[0];
        mouseOffset[1] -= upperLeftCoords[1];
      }
    }

    // set scale
    let zoomRatio;
    if (config.viewScale >= this.MIN_SCALE
      && config.viewScale < this.MAX_SCALE) {
      zoomRatio = config.viewScale / this.scale;
      this.context.scale(zoomRatio, zoomRatio);
    } else {
      return;
    }

    // resize canvas
    let item = getCurrentItem();
    let image = Session.images[item.index];
    let ratio = (image.width) / (image.height);

    if (this.maskRect.width / this.maskRect.height > ratio) {
      this.canvasHeight = this.maskRect.height * config.viewScale;
      this.canvasWidth = this.canvasHeight * ratio;
      this.displayToImageRatio = this.canvasHeight / image.height;
    } else {
      this.canvasWidth = this.maskRect.width * config.viewScale;
      this.canvasHeight = this.canvasWidth / ratio;
      this.displayToImageRatio = this.canvasWidth / image.width;
    }

    // translate back to origin
    if (mouseOffset) {
      this.maskDiv.scrollTop = this.imageCanvas.offsetTop;
      this.maskDiv.scrollLeft = this.imageCanvas.offsetLeft;
    }

    // set canvas resolution
    if (upRes) {
      canvas.height = this.canvasHeight * this.UP_RES_RATIO;
      canvas.width = this.canvasWidth * this.UP_RES_RATIO;
    } else {
      canvas.height = this.canvasHeight;
      canvas.width = this.canvasWidth;
    }

    // set canvas size
    canvas.style.height = this.canvasHeight + 'px';
    canvas.style.width = this.canvasWidth + 'px';

    // set padding
    let padding = this._getPadding();
    let padX = padding.x;
    let padY = padding.y;

    canvas.style.left = padX + 'px';
    canvas.style.top = padY + 'px';
    canvas.style.right = 'auto';
    canvas.style.bottom = 'auto';

    // zoom to point
    if (mouseOffset) {
      if (this.canvasWidth > this.maskRect.width) {
        this.maskDiv.scrollLeft =
            zoomRatio * (upperLeftCoords[0] + mouseOffset[0])
            - mouseOffset[0];
      }
      if (this.canvasHeight > this.maskRect.height) {
        this.maskDiv.scrollTop =
            zoomRatio * (upperLeftCoords[1] + mouseOffset[1])
            - mouseOffset[1];
      }
    }

    this.scale = config.viewScale;
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  render() {
    const {classes} = this.props;
    const imageCanvas = (<canvas className={classes.canvas}
                                  key='image-canvas'
                                  ref={(canvas) => {
                                    if (canvas) {
                                      this.imageCanvas = canvas;
                                      this.context = canvas.getContext('2d');
                                      if (this.maskRect.width
                                          && this.maskRect.height
                                          && getCurrentItem().loaded) {
                                        this.updateScale(canvas, false);
                                      }
                                    }
                                  }}
                                 style={{
                                   position: 'absolute',
                                 }}
    />);
    const hiddenCanvas = (<canvas className={classes.canvas}
                                  key='hidden-canvas'
                                  ref={(canvas) => {
                                    if (canvas) {
                                      if (this.maskRect.width
                                          && this.maskRect.height
                                          && getCurrentItem().loaded) {
                                        this.updateScale(canvas, true);
                                      }
                                    }
                                  }}
                                  style={{
                                    position: 'absolute',
                                  }}
    />);
    const labelCanvas = (<canvas className={classes.canvas}
                                 key='label-canvas'
                                 ref={(canvas) => {
                                   if (canvas) {
                                     if (this.maskRect.width
                                         && this.maskRect.height
                                         && getCurrentItem().loaded) {
                                       this.updateScale(canvas, true);
                                     }
                                   }
                                 }}
                                 style={{
                                   position: 'absolute',
                                 }}
    />);

    let canvasesWithProps;
    if (this.maskDiv) {
      this.maskRect = this.maskDiv.getBoundingClientRect();
      canvasesWithProps = React.Children.map(
          [imageCanvas, hiddenCanvas, labelCanvas], (canvas) => {
            return React.cloneElement(canvas,
                {height: this.maskRect.height, width: this.maskRect.width});
          }
      );
    }

    return (
        <div style={{
               display: 'block', height: 'calc(100% - 50px)',
               position: 'absolute',
               outline: 'none', width: '100%', background: '#222222',
             }}
             onMouseDown={(e) => this.onMouseDown(e)}
             onMouseMove={(e) => this.onMouseMove(e)}
             onMouseUp={(e) => this.onMouseUp(e)}
             onDoubleClick={(e) => this.onDoubleClick(e)}
             onWheel={(e) => this.onWheel(e)}
        >
          <div ref={(element) => {
            if (element) {
              this.maskDiv = element;
            }
          }}
               style={{
                 display: 'block',
                 height: sprintf('calc(100%% - %spx)', 2 * pad),
                 top: sprintf('%spx', pad), left: sprintf('%spx', pad),
                 position: 'absolute', overflow: 'scroll',
                 outline: 'none',
                 width: sprintf('calc(100%% - %spx)', 2 * pad),
               }}
          >
            {canvasesWithProps}
          </div>
        </div>
    );
  }

  /**
   * Execute when component state is updated
   */
  componentDidUpdate() {
    this.redraw();
  }

  /**
   * Handles canvas redraw
   * @return {boolean}
   */
  redraw(): boolean {
    // TODO: should support lazy drawing
    // TODO: draw each canvas separately for optimization
    let state = Session.getState();
    let item = state.current.item;
    let loaded = state.items[item].loaded;
    if (loaded) {
      let image = Session.images[item];
      // draw stuff
      this.context.clearRect(
          0, 0, this.imageCanvas.width, this.imageCanvas.height);
      this.context.drawImage(image, 0, 0, image.width, image.height,
        0, 0, this.imageCanvas.width, this.imageCanvas.height);
    }
    return true;
  }
}

export default withStyles(styles, {withTheme: true})(ImageView);
