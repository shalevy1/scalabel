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
    this.ZOOM_RATIO = 1.05;
    this.UP_RES_RATIO = 2;
    this.upRes = true;
    this._keyDownMap = {};

    // this.setupController();

    // set keyboard listeners
    document.onkeydown = (e) => this.onKeyDown(e);
    document.onkeyup = (e) => this.onKeyUp(e);
  }

  setupController() {
    if (this.props.labelType === 'box') {
      // this.controller =
    } else if (this.props.labelType === 'seg') {

    } else if (this.props.labelType === 'tag') {

    }
  }

  /**
   * Get the mouse position on the canvas in the image coordinates.
   * @param {object} e: mouse event
   * @return {object}: mouse position (x,y) on the canvas
   */
  getMousePos(e) {
    const padding = this._getPadding();
    let x = e.clientX - this.maskRect.x - padding.x;
    let y = e.clientY - this.maskRect.y - padding.y;

    // limit the mouse within the image
    x = Math.max(0, Math.min(x, this.canvasWidth));
    y = Math.max(0, Math.min(y, this.canvasHeight));

    // return in the image coordinates
    return {
      x: x / this.displayToImageRatio,
      y: y / this.displayToImageRatio,
    };
  }

  onMouseDown(e) {
  }
  onMouseUp(e) {
  }
  onMouseMove(e) {
  }

  onWheel(e) {
    if (this.isDown('ctrl')) { // control for zoom
      e.preventDefault();
      let mousePos = this.getMousePos(e);
      if (this.scrollTimer !== null) {
        clearTimeout(this.scrollTimer);
      }
      if (e.deltaY < 0) {
        this.setScale(this.scale * this.SCALE_RATIO, mousePos);
      } else if (e.deltaY > 0) {
        this.setScale(this.scale / this.SCALE_RATIO, mousePos);
      }
      this.redraw();
      // this.redrawImageCanvas();
      // this.redrawLabelCanvas();
      // this.scrollTimer = setTimeout(function() {
      //   this.redrawHiddenCanvas();
      // }, 150);
    }
  }

  onDoubleClick(e) {
  }

  onKeyDown(e) {
    let keyID = e.KeyCode ? e.KeyCode : e.which;
    this._keyDownMap[keyID] = true;
    if (keyID === 187) {
      // + for zooming in
      this.zoomHandler(1);
    } else if (keyID === 189) {
      // - for zooming out
      this.zoomHandler(-1);
    }
  }

  onKeyUp(e) {
    let keyID = e.KeyCode ? e.KeyCode : e.which;
    delete this._keyDownMap[keyID];
  }

  isKeyDown(c) {
    if (c === 'ctrl') {
      // ctrl or command key
      return this._keyDownMap[17] || this._keyDownMap[91];
    }
    return this._keyDownMap[c.charCodeAt()];
  }

  zoomHandler(z) {
    let ratio = this.ZOOM_RATIO; // zoom in is default
    if (z < 0) { // zoom out
      ratio = 1 / ratio;
    }
    Session.dispatch({type: types.IMAGE_ZOOM, ratio: ratio});
  }

  /**
   * Convert image coordinate to canvas coordinate.
   * If affine, assumes values to be [x, y]. Otherwise
   * performs linear transformation.
   * @param {Array<number>} values - the values to convert.
   * @return {Array<number>} - the converted values.
   */
  toCanvasCoords(values: Array<number>) {
    if (values) {
      for (let i = 0; i < values.length; i++) {
        values[i] *= this.displayToImageRatio;
        if (this.upRes) {
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
   */
  updateScale() {
    let config: ImageViewerConfigType = getCurrentViewerConfig();

    // set scale
    if (config.viewScale >= this.MIN_SCALE
      && config.viewScale < this.MAX_SCALE) {
      let ratio = config.viewScale / this.scale;
      this.context.scale(ratio, ratio);
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

    // set canvas resolution
    if (this.upRes) {
      this.canvas.height = this.canvasHeight * this.UP_RES_RATIO;
      this.canvas.width = this.canvasWidth * this.UP_RES_RATIO;
    } else {
      this.canvas.height = this.canvasHeight;
      this.canvas.width = this.canvasWidth;
    }

    // set canvas size
    this.canvas.style.height = this.canvasHeight + 'px';
    this.canvas.style.width = this.canvasWidth + 'px';

    // set padding
    let padding = this._getPadding();
    let padX = padding.x;
    let padY = padding.y;

    this.canvas.style.left = padX + 'px';
    this.canvas.style.top = padY + 'px';
    this.canvas.style.right = 'auto';
    this.canvas.style.bottom = 'auto';

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
                                      this.canvas = canvas;
                                      this.context = canvas.getContext('2d');
                                      if (this.maskRect.width
                                          && this.maskRect.height
                                          && getCurrentItem().loaded) {
                                        this.updateScale();
                                      }
                                    }
                                  }}
                                 style={{
                                   position: 'absolute',
                                 }}
    />);
    const hiddenCanvas = (<canvas className={classes.canvas}
                                  key='hidden-canvas'
                                  style={{
                                    position: 'absolute',
                                  }}
    />);
    const labelCanvas = (<canvas className={classes.canvas}
                                 key='label-canvas'
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
    let state = Session.getState();
    let item = state.current.item;
    let loaded = state.items[item].loaded;
    if (loaded) {
      let image = Session.images[item];
      // draw stuff
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.context.drawImage(image, 0, 0, image.width, image.height,
        0, 0, this.canvas.width, this.canvas.height);
    }
    return true;
  }

  redrawImageCanvas() {

  }

  redrawHiddenCanvas() {

  }

  redrawLabelCanvas() {

  }
}

export default withStyles(styles, {withTheme: true})(ImageView);
