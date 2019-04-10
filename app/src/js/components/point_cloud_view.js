import React from 'react';
import Session from '../common/session';
import type {PointCloudViewerConfigType} from '../functional/types';
import {withStyles} from '@material-ui/core/styles/index';
import * as THREE from 'three';
import * as types from '../actions/action_types';

const styles = () => ({
  canvas: {
    position: 'relative',
  },
});

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
function getCurrentViewerConfig(): PointCloudViewerConfigType {
  let state = Session.getState();
  return state.items[state.current.item].viewerConfig;
}

/**
 * Canvas Viewer
 */
class PointCloudView extends React.Component<Props> {
  canvas: Object;
  container: Object;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  target: THREE.Mesh;
  mouseDown: boolean;
  mX: number;
  mY: number;
  mouseDownHandler: (e: Event) => void;
  mouseUpHandler: (e: Event) => void;
  mouseMoveHandler: (e: Event) => void;
  MOUSE_CORRECTION_FACTOR: number;
  MOVE_AMOUNT: number;
  UP_KEY: number;
  DOWN_KEY: number;
  LEFT_KEY: number;
  RIGHT_KEY: number;
  PERIOD_KEY: number;
  SLASH_KEY: number;
  /**
   * Constructor, handles subscription to store
   * @param {Object} props: react props
   */
  constructor(props: Object) {
    super(props);
    this.renderer = null;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    this.target = new THREE.Mesh(
      new THREE.SphereGeometry(0.03),
        new THREE.MeshBasicMaterial({
          color:
            0xffffff,
        }));
    this.scene.add(this.target);
    this.mouseDown = false;
    this.container = React.createRef();

    this.mX = 0;
    this.mY = 0;

    this.mouseDownHandler = this.handleMouseDown.bind(this);
    this.mouseUpHandler = this.handleMouseUp.bind(this);
    this.mouseMoveHandler = this.handleMouseMove.bind(this);

    this.MOUSE_CORRECTION_FACTOR = 80.0;
    this.MOVE_AMOUNT = 0.3;

    this.UP_KEY = 38;
    this.DOWN_KEY = 40;
    this.LEFT_KEY = 37;
    this.RIGHT_KEY = 39;
    this.PERIOD_KEY = 190;
    this.SLASH_KEY = 191;
  }

  /**
   * Handle mouse down
   * @param {Event} e
   */
  handleMouseDown(e: Event) {
    e.stopPropagation();
    this.mouseDown = true;
  }

  /**
   * Handle mouse up
   * @param {Event} e
   */
  handleMouseUp(e: Event) {
    e.stopPropagation();
    this.mouseDown = false;
  }

  /**
   * Handle mouse move
   * @param {Event} e
   */
  handleMouseMove(e: Event) {
    e.stopPropagation();
    let newX = e.clientX - this.container.current.getBoundingClientRect().left;
    let newY = e.clientY - this.container.current.getBoundingClientRect().top;

    if (this.mouseDown) {
      let viewerConfig = getCurrentViewerConfig();

      let target = new THREE.Vector3(viewerConfig.target.x,
        viewerConfig.target.y,
        viewerConfig.target.z);
      let offset = new THREE.Vector3(viewerConfig.position.x,
        viewerConfig.position.y,
        viewerConfig.position.z);
      offset.sub(target);

      // Rotate so that positive y-axis is vertical
      let rotVertQuat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(viewerConfig.verticalAxis.x,
          viewerConfig.verticalAxis.y,
          viewerConfig.verticalAxis.z),
        new THREE.Vector3(0, 1, 0));
      offset.applyQuaternion(rotVertQuat);

      // Convert to spherical coordinates
      let spherical = new THREE.Spherical();
      spherical.setFromVector3(offset);

      // Apply rotations
      spherical.theta += (newX - this.mX) / this.MOUSE_CORRECTION_FACTOR;
      spherical.phi += (newY - this.mY) / this.MOUSE_CORRECTION_FACTOR;

      spherical.phi = Math.max(0, Math.min(Math.PI, spherical.phi));

      spherical.makeSafe();

      // Convert to Cartesian
      offset.setFromSpherical(spherical);

      // Rotate back to original coordinate space
      let quatInverse = rotVertQuat.clone().inverse();
      offset.applyQuaternion(quatInverse);

      offset.add(target);

      Session.dispatch({
        type: types.MOVE_CAMERA,
        newPosition: {x: offset.x, y: offset.y, z: offset.z},
      });
    }

    this.mX = newX;
    this.mY = newY;
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  render() {
    const {classes} = this.props;
    return (
      <div ref={this.container} style={{width: '100%', height: '100%'}}>
        <canvas className={classes.canvas} ref={(canvas) => {
            if (canvas) {
              this.canvas = canvas;
              if (this.props.width && this.props.height &&
                getCurrentItem().loaded) {
                let rendererParams = {canvas: this.canvas};
                this.renderer = new THREE.WebGLRenderer(rendererParams);
                this.updateRenderer();
              }
            }
          }}
          onMouseDown={this.mouseDownHandler} onMouseUp={this.mouseUpHandler}
          onMouseMove={this.mouseMoveHandler}
        />
      </div>
    );
  }

  /**
   * Update rendering constants
   */
  updateRenderer() {
    let config: PointCloudViewerConfigType = getCurrentViewerConfig();
    this.target.position.x = config.target.x;
    this.target.position.y = config.target.y;
    this.target.position.z = config.target.z;

    this.camera.aspect = this.container.current.offsetWidth /
      this.container.current.offsetHeight;
    this.camera.updateProjectionMatrix();

    this.camera.up.x = config.verticalAxis.x;
    this.camera.up.y = config.verticalAxis.y;
    this.camera.up.z = config.verticalAxis.z;
    this.camera.position.x = config.position.x;
    this.camera.position.y = config.position.y;
    this.camera.position.z = config.position.z;
    this.camera.lookAt(this.target.position);

    this.renderer.setSize(this.container.current.offsetWidth,
      this.container.current.offsetHeight);
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
    let state = Session.getState();
    let item = state.current.item;
    let loaded = state.items[item].loaded;
    if (loaded) {
      let pointCloud = Session.pointClouds[item];
      if (this.scene.children.length !== 1) {
        this.scene.children = [null];
      }
      if (this.scene.children[0] !== pointCloud) {
        this.scene.children[0] = pointCloud;
      }
      this.updateRenderer();
      this.renderer.render(this.scene, this.camera);
    }
    return true;
  }
}

export default withStyles(styles, {withTheme: true})(PointCloudView);
