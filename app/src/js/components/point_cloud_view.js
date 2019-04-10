import React from 'react';
import Session from '../common/session';
import type {PointCloudViewerConfigType} from '../functional/types';
import {withStyles} from '@material-ui/core/styles/index';
import * as THREE from 'three';

const styles = () => ({
  canvas: {
    position: 'relative',
    width: '100%',
    height: '100%',
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
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  target: THREE.Mesh;
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
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  render() {
    const {classes} = this.props;
    return (<canvas className={classes.canvas} ref={(canvas) => {
      if (canvas) {
        this.canvas = canvas;
        if (this.props.width && this.props.height &&
          getCurrentItem().loaded) {
          let rendererParams = {canvas: this.canvas};
          this.renderer = new THREE.WebGLRenderer(rendererParams);
          this.updateRenderer();
        }
      }
    }}/>);
  }

  /**
   * Update rendering constants
   */
  updateRenderer() {
    let config: PointCloudViewerConfigType = getCurrentViewerConfig();
    this.target.position.x = config.target.x;
    this.target.position.y = config.target.y;
    this.target.position.z = config.target.z;

    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();

    this.camera.up.x = config.verticalAxis.x;
    this.camera.up.y = config.verticalAxis.y;
    this.camera.up.z = config.verticalAxis.z;
    this.camera.position.x = config.position.x;
    this.camera.position.y = config.position.y;
    this.camera.position.z = config.position.z;
    this.camera.lookAt(this.target.position);

    this.renderer._width = this.canvas.width;
    this.renderer._height = this.canvas.height;
    this.renderer.setViewport(0, 0, this.canvas.width, this.canvas.height);
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
      let pointCloud = Session.pointClouds[item];
      this.scene.children = [];
      this.scene.add(pointCloud);
      this.renderer.render(this.scene, this.camera);
    }
    return true;
  }
}

export default withStyles(styles, {withTheme: true})(PointCloudView);
