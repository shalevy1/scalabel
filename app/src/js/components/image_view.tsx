import {Canvas2d} from './canvas2d';
import * as React from 'react';
import Session from '../common/session';
import {ImageViewerConfigType, ShapeType, ViewerConfigType} from '../functional/types';
import {withStyles} from '@material-ui/core/styles';
import * as types from '../action/types';
import EventListener, {withOptions} from 'react-event-listener';
import {imageViewStyle} from '../styles/label';
import {BaseController} from '../controllers/base_controller';
import {Box2dController} from '../controllers/box2d_controller';
import {mode, redrawControlShape} from '../functional/draw';

interface ClassType {
  /** canvas */
  canvas: string;
  /** image display area */
  display: string;
  /** background */
  background: string;
}

interface Props {
  /** styles */
  classes: ClassType;
}

/**
 * Get the current item in the state
 * @return {ItemType}
 */
function getCurrentItem() {
  const state = Session.getState();
  return state.items[state.current.item];
}

/**
 * Retrieve the current viewer configuration
 * @return {ViewerConfigType}
 */
function getCurrentViewerConfig() {
  const state = Session.getState();
  return state.items[state.current.item].viewerConfig as ImageViewerConfigType;
}

/**
 * Canvas Viewer
 */
export class ImageView extends Canvas2d<Props> {
  /** The image canvas */
  private imageCanvas: any;
  /** The image context */
  public imageContext: any;
  /** The label canvas */
  private labelCanvas: any;
  /** The label context */
  public labelContext: any;
  /** The control canvas */
  private controlCanvas: any;
  /** The control context */
  public controlContext: any;
  /** The mask to hold the display */
  private display: any;

  // display constants
  /** The maximum scale */
  private readonly MAX_SCALE: number;
  /** The minimum scale */
  private readonly MIN_SCALE: number;
  /** The boosted ratio to draw shapes sharper */
  private readonly UP_RES_RATIO: number;
  /** The zoom ratio */
  private readonly ZOOM_RATIO: number;
  /** The scroll-zoom ratio */
  private readonly SCROLL_ZOOM_RATIO: number;

  // display variables
  /** The current scale */
  private scale: number;
  /** The canvas height */
  private canvasHeight: number;
  /** The canvas width */
  private canvasWidth: number;
  /** The scale between the display and image data */
  private displayToImageRatio: number;

  // keyboard and mouse status
  /** The hashed list of keys currently down */
  private _keyDownMap: { [key: number]: boolean };
  /** Whether or not the mouse is down */
  private _isMouseDown: boolean;

  // scrolling
  /** The timer for scrolling */
  private scrollTimer: number | undefined;

  // grabbing
  /** Whether or not the mouse is currently grabbing the image */
  private _isGrabbingImage: boolean;
  /** The x coordinate when the grab starts */
  private _startGrabX: number;
  /** The y coordinate when the grab starts */
  private _startGrabY: number;
  /** The visible coordinates when the grab starts */
  private _startGrabVisibleCoords: number[];

  // control canvas
  /** The map from the encoding drawn on the control canvas to shape ID */
  private _controlMap: { [key: number]: number };
  /** The control map key of the shape being hovered */
  private hoveredShapeId: number;

  /** controllers */
  private controllers: { [key: string]: BaseController };

  /**
   * Constructor, handles subscription to store
   * @param {Object} props: react props
   */
  constructor(props: Readonly<Props>) {
    super(props);

    // constants
    this.MAX_SCALE = 3.0;
    this.MIN_SCALE = 1.0;
    this.ZOOM_RATIO = 1.05;
    this.SCROLL_ZOOM_RATIO = 1.01;
    this.UP_RES_RATIO = 2;

    // initialization
    this._keyDownMap = {};
    this._isMouseDown = false;
    this._isGrabbingImage = false;
    this._startGrabX = -1;
    this._startGrabY = -1;
    this._startGrabVisibleCoords = [];
    this.scale = 1;
    this.canvasHeight = 0;
    this.canvasWidth = 0;
    this.displayToImageRatio = 1;
    this.scrollTimer = undefined;
    this._controlMap = {};
    this.hoveredShapeId = -1;

    // set keyboard listeners
    document.onkeydown = this.onKeyDown.bind(this);
    document.onkeyup = this.onKeyUp.bind(this);

    // controllers
    this.controllers = {
      box2d: new Box2dController()
    };
  }

  /**
   * Get the current controller
   * @return {BaseController} the current controller
   */
  private getCurrentController() {
    let labelType = Session.getState().config.labelType;
    if (!(labelType in Object.keys(this.controllers))) {
      labelType = 'box2d';
    }
    return this.controllers[labelType];
  }

  /**
   * Get the coordinates of the upper left corner of the image canvas
   * @return {[number]} the x and y coordinates
   */
  private getVisibleCanvasCoords() {
    const displayRect = this.display.getBoundingClientRect();
    const imgRect = this.imageCanvas.getBoundingClientRect();
    return [displayRect.x - imgRect.x, displayRect.y - imgRect.y];
  }

  /**
   * Get the mouse position on the canvas in the image coordinates.
   * @param {MouseEvent | WheelEvent} e: mouse event
   * @return number[]:
   * mouse position (x,y) on the canvas
   */
  private getMousePos(e: MouseEvent | WheelEvent) {
    const [offsetX, offsetY] = this.getVisibleCanvasCoords();
    const displayRect = this.display.getBoundingClientRect();
    let x = e.clientX - displayRect.x + offsetX;
    let y = e.clientY - displayRect.y + offsetY;

    // limit the mouse within the image
    x = Math.max(0, Math.min(x, this.canvasWidth));
    y = Math.max(0, Math.min(y, this.canvasHeight));

    // return in the image coordinates
    return [x / this.displayToImageRatio, y / this.displayToImageRatio];
  }

  /**
   * Set the current cursor
   * @param {string} cursor - cursor type
   */
  private setCursor(cursor: string) {
    this.imageCanvas.style.cursor = cursor;
  }

  // Control map
  /**
   * Get the label under the mouse.
   * @param {number[]} mousePos: position of the mouse
   * @return {int}: the selected label
   */
  private getKeyInControlMap(mousePos: number[]) {
    const [x, y] = this.toCanvasCoords(mousePos,
      true);
    const data = this.controlContext.getImageData(x, y, 4, 4).data;
    const arr = [];
    for (let i = 0; i < 16; i++) {
      const color =
        (data[i * 4] << 16) | (data[i * 4 + 1] << 8) | data[i * 4 + 2];
      arr.push(color);
    }
    // finding the mode of the data array to deal with anti-aliasing
    return mode(arr) - 1;
  }

  /**
   * Get label by label ID
   * @param {number} labelId - ID of the label
   */
  public getLabelById(labelId: number) {
    const state = this.state.session;
    const item = state.current.item;
    const labels = state.items[item].labels;
    return labels[labelId];
  }

  /**
   * Get shape by shape ID
   * @param {number} shapeId - ID of the label
   */
  public getShapeById(shapeId: number): ShapeType {
    const state = this.state.session;
    const item = state.current.item;
    const shapes = state.items[item].shapes;
    return shapes[shapeId];
  }

  /**
   * Get the hovered shape
   * @return {ShapeType | null}
   */
  public getHoveredShape(): ShapeType | null {
    if (this.hoveredShapeId > 0) {
      return this.getShapeById(this.hoveredShapeId);
    }
    return null;
  }
  /**
   * Get the label under the mouse.
   * @param {number[]} mousePos: position of the mouse
   * @return {Shape | null}: the occupied shape
   */
  public getShapeByPosition(mousePos: number[]) {
    const shapeIndex = this.getKeyInControlMap(mousePos);
    if (shapeIndex >= 0) {
      return this._controlMap[shapeIndex];
    }
    return -1;
  }

  /**
   * Callback function when mouse is down
   * @param {MouseEvent} e - event
   */
  private onMouseDown(e: MouseEvent) {
    // get mouse position in image coordinates
    const mousePos = this.getMousePos(e);
    this._isMouseDown = true;
    // ctrl + click for dragging
    if (this.isKeyDown('ctrl')) {
      const display = this.display.getBoundingClientRect();
      if (this.imageCanvas.width > display.width ||
        this.imageCanvas.height > display.height) {
        // if needed, start grabbing
        this.setCursor('grabbing');
        this._isGrabbingImage = true;
        this._startGrabX = e.clientX;
        this._startGrabY = e.clientY;
        this._startGrabVisibleCoords = this.getVisibleCanvasCoords();
      }
    } else {
      // if ctrl not pressed, call label-specific handlers
      this.getCurrentController().onMouseDown(mousePos);
    }
  }

  /**
   * Callback function when mouse is up
   * @param {MouseEvent} e - event
   */
  private onMouseUp(e: MouseEvent) {
    // get mouse position in image coordinates
    const mousePos = this.getMousePos(e);
    this._isMouseDown = false;
    this._isGrabbingImage = false;
    this._startGrabX = -1;
    this._startGrabY = -1;
    this._startGrabVisibleCoords = [];

    // label-specific handling of mouse up
    this.getCurrentController().onMouseUp(mousePos);
  }

  /**
   * Callback function when mouse moves
   * @param {MouseEvent} e - event
   */
  private onMouseMove(e: MouseEvent) {
    // update the currently hovered shape
    const mousePos = this.getMousePos(e);
    this.hoveredShapeId = this.getShapeByPosition(mousePos);
    this.hoveredLabel =

    // grabbing image
    if (this.isKeyDown('ctrl')) {
      if (this._isGrabbingImage) {
        this.setCursor('grabbing');
        const dx = e.clientX - this._startGrabX;
        const dy = e.clientY - this._startGrabY;
        this.display.scrollLeft = this._startGrabVisibleCoords[0] - dx;
        this.display.scrollTop = this._startGrabVisibleCoords[1] - dy;
      } else {
        this.setCursor('grab');
      }
    }

    // label-specific handling of mouse move
    this.getCurrentController().onMouseMove(mousePos);
  }

  /**
   * Callback function for scrolling
   * @param {WheelEvent} e - event
   */
  private onWheel(e: WheelEvent) {
    // get mouse position in image coordinates
    const mousePos = this.getMousePos(e);
    if (this.isKeyDown('ctrl')) { // control for zoom
      e.preventDefault();
      if (this.scrollTimer !== undefined) {
        clearTimeout(this.scrollTimer);
      }
      if (e.deltaY < 0) {
        this.zoomHandler(this.SCROLL_ZOOM_RATIO, mousePos[0], mousePos[1]);
      } else if (e.deltaY > 0) {
        this.zoomHandler(
          1 / this.SCROLL_ZOOM_RATIO, mousePos[0], mousePos[1]);
      }
      this.redraw();
    }
  }

  /**
   * Callback function when double click occurs
   * @param {MouseEvent} e - event
   */
  private onDblClick(e: MouseEvent) {
    // get mouse position in image coordinates
    const mousePos = this.getMousePos(e);
    // label-specific handling of double click
    this.getCurrentController().onDblClick(mousePos);
  }

  /**
   * Callback function when key is down
   * @param {KeyboardEvent} e - event
   */
  private onKeyDown(e: KeyboardEvent) {
    const keyId = e.keyCode ? e.keyCode : e.which;
    this._keyDownMap[keyId] = true;
    if (keyId === 187) {
      // + for zooming in
      this.zoomHandler(this.ZOOM_RATIO, -1, -1);
    } else if (keyId === 189) {
      // - for zooming out
      this.zoomHandler(1 / this.ZOOM_RATIO, -1, -1);
    }

    // label-specific handling of key down
    this.getCurrentController().onKeyDown(keyId);
  }

  /**
   * Callback function when key is up
   * @param {KeyboardEvent} e - event
   */
  private onKeyUp(e: KeyboardEvent) {
    const keyId = e.keyCode ? e.keyCode : e.which;
    delete this._keyDownMap[keyId];
    if (keyId === 17 || keyId === 91) {
      // ctrl or command
      this.setCursor(this.getCurrentController().defaultCursorStyle);
    }
    // label-specific handling of key down
    this.getCurrentController().onKeyUp(keyId);
  }

  /**
   * Whether a specific key is pressed down
   * @param {string} c - the key to check
   * @return {*}
   */
  private isKeyDown(c: string) {
    if (c === 'ctrl') {
      // ctrl or command key
      return this._keyDownMap[17] || this._keyDownMap[91];
    }
    return this._keyDownMap[c.charCodeAt(0)];
  }

  /**
   * Handler for zooming
   * @param {number} zoomRatio - the zoom ratio
   * @param {number} offsetX - the offset of x for zooming to cursor
   * @param {number} offsetY - the offset of y for zooming to cursor
   */
  public zoomHandler(zoomRatio: number,
                     offsetX: number, offsetY: number) {
    const newScale = getCurrentViewerConfig().viewScale * zoomRatio;
    if (newScale >= this.MIN_SCALE && newScale <= this.MAX_SCALE) {
      Session.dispatch({
        type: types.IMAGE_ZOOM, ratio: zoomRatio,
        viewOffsetX: offsetX, viewOffsetY: offsetY
      });
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
  public toCanvasCoords(values: number[], upRes: boolean) {
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
  public toImageCoords(values: number[]) {
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
  private _getPadding() {
    const displayRect = this.display.getBoundingClientRect();
    return {
      x: Math.max(0, (displayRect.width - this.canvasWidth) / 2),
      y: Math.max(0, (displayRect.height - this.canvasHeight) / 2)
    };
  }

  /**
   * Set the scale of the image in the display
   * @param {object} canvas
   * @param {boolean} upRes
   */
  private updateScale(canvas: HTMLCanvasElement, upRes: boolean) {
    const displayRect = this.display.getBoundingClientRect();
    const config: ViewerConfigType = getCurrentViewerConfig();
    // mouseOffset
    let mouseOffset;
    let upperLeftCoords;
    if (config.viewScale > 1.0) {
      upperLeftCoords = this.getVisibleCanvasCoords();
      if (config.viewOffsetX < 0 || config.viewOffsetY < 0) {
        mouseOffset = [
          Math.min(displayRect.width, this.imageCanvas.width) / 2,
          Math.min(displayRect.height, this.imageCanvas.height) / 2
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
      this.imageContext.scale(zoomRatio, zoomRatio);
    } else {
      return;
    }

    // resize canvas
    const item = getCurrentItem();
    const image = Session.images[item.index];
    const ratio = image.width / image.height;
    if (displayRect.width / displayRect.height > ratio) {
      this.canvasHeight = displayRect.height * config.viewScale;
      this.canvasWidth = this.canvasHeight * ratio;
      this.displayToImageRatio = this.canvasHeight
        / image.height;
    } else {
      this.canvasWidth = displayRect.width * config.viewScale;
      this.canvasHeight = this.canvasWidth / ratio;
      this.displayToImageRatio = this.canvasWidth / image.width;
    }

    // translate back to origin
    if (mouseOffset) {
      this.display.scrollTop = this.imageCanvas.offsetTop;
      this.display.scrollLeft = this.imageCanvas.offsetLeft;
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
    const padding = this._getPadding();
    const padX = padding.x;
    const padY = padding.y;

    canvas.style.left = padX + 'px';
    canvas.style.top = padY + 'px';
    canvas.style.right = 'auto';
    canvas.style.bottom = 'auto';

    // zoom to point
    if (mouseOffset && upperLeftCoords) {
      if (this.canvasWidth > displayRect.width) {
        this.display.scrollLeft =
          zoomRatio * (upperLeftCoords[0] + mouseOffset[0])
          - mouseOffset[0];
      }
      if (this.canvasHeight > displayRect.height) {
        this.display.scrollTop =
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
  public render() {
    const {classes} = this.props;
    const imageCanvas = (<canvas
      key='image-canvas'
      className={classes.canvas}
      ref={(canvas) => {
        if (canvas) {
          this.imageCanvas = canvas;
          this.imageContext = canvas.getContext('2d');
          const displayRect =
            this.display.getBoundingClientRect();
          if (displayRect.width
            && displayRect.height
            && getCurrentItem().loaded) {
            this.updateScale(canvas, false);
          }
        }
      }}
    />);
    const controlCanvas = (<canvas
      key='control-canvas'
      className={classes.canvas}
      ref={(canvas) => {
        if (canvas) {
          this.controlCanvas = canvas;
          this.controlContext = canvas.getContext('2d');
          const displayRect =
            this.display.getBoundingClientRect();
          if (displayRect.width
            && displayRect.height
            && getCurrentItem().loaded) {
            this.updateScale(canvas, true);
          }
        }
      }}
    />);
    const labelCanvas = (<canvas
      key='label-canvas'
      className={classes.canvas}
      ref={(canvas) => {
        if (canvas) {
          this.labelCanvas = canvas;
          this.labelContext = canvas.getContext('2d');
          const displayRect =
            this.display.getBoundingClientRect();
          if (displayRect.width
            && displayRect.height
            && getCurrentItem().loaded) {
            this.updateScale(canvas, true);
          }
        }
      }}
    />);

    let canvasesWithProps;
    if (this.display) {
      const displayRect = this.display.getBoundingClientRect();
      canvasesWithProps = React.Children.map(
        [imageCanvas, controlCanvas, labelCanvas], (canvas) => {
          return React.cloneElement(canvas,
            {height: displayRect.height, width: displayRect.width});
        }
      );
    }

    return (
      <div className={classes.background}>
        <EventListener
          target='window'
          onMouseDown={(e) => this.onMouseDown(e)}
          onMouseMove={(e) => this.onMouseMove(e)}
          onMouseUp={(e) => this.onMouseUp(e)}
          onDblClick={(e) => this.onDblClick(e)}
          onWheel={withOptions((e) => this.onWheel(e), {passive: false})}
        />
        <div ref={(element) => {
          if (element) {
            this.display = element;
          }
        }}
             className={classes.display}
        >
          {canvasesWithProps}
        </div>
      </div>
    );
  }

  /**
   * Function to redraw all canvases
   * @return {boolean}
   */
  public redraw(): boolean {
    const state = this.state.session;
    const item = state.current.item;
    const loaded = state.items[item].loaded;
    const labels = state.items[item].labels;
    const shapes = state.items[item].shapes;
    if (loaded) {
      const image = Session.images[item];
      // redraw imageCanvas
      this._redrawImageCanvas(image);
      // redraw labelCanvas
      this._redrawLabelCanvas(labels, shapes);
      // redraw controlCanvas
      this._redrawControlCanvas(shapes);
    }
    return true;
  }

  /**
   * Function to redraw the image canvas
   * @return {boolean}
   */
  public redrawImageCanvas(): boolean {
    const state = this.state.session;
    const item = state.current.item;
    const loaded = state.items[item].loaded;
    if (loaded) {
      const image = Session.images[item];
      // redraw imageCanvas
      this._redrawImageCanvas(image);
    }
    return true;
  }

  /**
   * Function to redraw the label canvas
   * @return {boolean}
   */
  public redrawLabelCanvas(): boolean {
    const state = this.state.session;
    const item = state.current.item;
    const loaded = state.items[item].loaded;
    const labels = state.items[item].labels;
    const shapes = state.items[item].shapes;
    if (loaded) {
      // redraw labelCanvas
      this._redrawLabelCanvas(labels, shapes);
    }
    return true;
  }

  /**
   * Function to redraw the control canvas
   * @return {boolean}
   */
  public redrawControlCanvas(): boolean {
    const state = this.state.session;
    const item = state.current.item;
    const loaded = state.items[item].loaded;
    const shapes = state.items[item].shapes;
    if (loaded) {
      // redraw controlCanvas
      this._redrawControlCanvas(shapes);
    }
    return true;
  }

  /**
   * Clear the canvas
   * @param {HTMLCanvasElement} canvas - the canvas to redraw
   * @param {any} context - the context to redraw
   * @return {boolean}
   */
  protected clearCanvas(canvas: HTMLCanvasElement,
                        context: any): boolean {
    // clear context
    context.clearRect(0, 0, canvas.width, canvas.height);
    return true;
  }

  /**
   * Redraw the image canvas
   * @param {HTMLImageElement} image
   * @return {boolean}
   */
  protected _redrawImageCanvas(image: HTMLImageElement): boolean {
    this.clearCanvas(this.imageCanvas, this.imageContext);
    this.imageContext.drawImage(image, 0, 0, image.width, image.height,
      0, 0, this.imageCanvas.width, this.imageCanvas.height);
    return true;
  }

  /**
   * Redraw the label canvas
   * @param {object} labels - labels to draw
   * @param {any} shapes - shapes to draw
   * @return {boolean}
   */
  protected _redrawLabelCanvas(labels: object, shapes: any): boolean {
    this.clearCanvas(this.labelCanvas, this.labelContext);
    for (const label of Object.values(labels)) {
      this.controllers[label.type].redrawLabel(label, shapes,
        this.labelContext, this.displayToImageRatio * this.UP_RES_RATIO,
        this.hoveredShapeId);
    }
    return true;
  }

  /**
   * Redraw the control canvas
   * @param {any} shapes - shapes to draw
   * @return {boolean}
   */
  protected _redrawControlCanvas(shapes: any): boolean {
    this.clearCanvas(this.controlCanvas, this.controlContext);
    for (const shapeID of Object.values(this._controlMap)) {
      redrawControlShape(shapes[shapeID], this.controlContext,
        this.displayToImageRatio * this.UP_RES_RATIO);
    }
    return true;
  }
}

export default withStyles(imageViewStyle, {withTheme: true})(ImageView);
