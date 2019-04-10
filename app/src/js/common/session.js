// @flow
import {sprintf} from 'sprintf-js';
import * as types from '../actions/action_types';
import type {ImageViewerConfigType, PointCloudViewerConfigType,
  ItemType, StateType} from '../functional/types';
import _ from 'lodash';
import {makeImageViewerConfig,
  makePointCloudViewerConfig} from '../functional/states';
import {configureStore, configureFastStore} from './configure_store';
import type {WindowType} from './window';
import * as THREE from 'three';
import {PLYLoader} from '../thirdparty/PLYLoader';

/**
 * Singleton session class
 */
class Session {
  store: Object;
  fastStore: Object; // This store contains the temporary state
  images: Array<Image>;
  pointClouds: Array<THREE.Points>;
  itemType: string;
  labelType: string;
  window: WindowType;
  devMode: boolean;

  /**
   * no-op for state initialization
   */
  constructor() {
    this.store = {};
    this.fastStore = configureFastStore();
    this.images = [];
    this.pointClouds = [];
    // TODO: make it configurable in the url
    this.devMode = true;
  }

  /**
   * Get current state in store
   * @return {StateType}
   */
  getState(): StateType {
    return this.store.getState().present;
  }

  /**
   * Get the current temporary state. It is for animation rendering.
   * @return {StateType}
   */
  getFastState(): StateType {
    return this.fastStore.getState();
  }

  /**
   * Wrapper for redux store dispatch
   * @param {Object} action: action description
   */
  dispatch(action: Object): void {
    this.store.dispatch(action);
  }

  /**
   * Subscribe all the controllers to the states
   * @param {Object} component: view component
   */
  subscribe(component: Object) {
    if (this.store.subscribe) {
      this.store.subscribe(component.onStateUpdated.bind(component));
    }
    // this.fastStore.subscribe(c.onFastStateUpdated.bind(c));
  }

  /**
   * Initialize state store
   * @param {Object} stateJson: json state from backend
   */
  initStore(stateJson: Object): void {
    this.store = configureStore(stateJson, this.devMode);
    this.store.dispatch({type: types.INIT_SESSION});
    window.store = this.store;
    let state = this.getState();
    this.itemType = state.config.itemType;
    this.labelType = state.config.labelType;
  }

  /**
   * Load all the images in the state
   */
  loadImages(): void {
    let self = this;
    let items = this.getState().items;
    for (let i = 0; i < items.length; i++) {
      let item: ItemType = items[i];
      // Copy item config
      let config: ImageViewerConfigType = {...item.viewerConfig};
      if (_.isEmpty(config)) {
        config = makeImageViewerConfig();
      }
      let url = item.url;
      let image = new Image();
      image.crossOrigin = 'Anonymous';
      self.images.push(image);
      image.onload = function() {
        config.imageHeight = this.height;
        config.imageWidth = this.width;
        self.store.dispatch({type: types.LOAD_ITEM, index: item.index,
          config: config});
      };
      image.onerror = function() {
        alert(sprintf('Image %s was not found.', url));
      };
      image.src = url;
    }
  }

  /**
   * Load all point clouds in state
   */
  loadPointClouds(): void {
    let self = this;
    let loader = new PLYLoader();
    let vertexShader =
      `
        varying float distFromOrigin;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          distFromOrigin = length(position);
          gl_PointSize = 0.1 * ( 300.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;
        }
      `;
    let fragmentShader =
      `
        varying float distFromOrigin;
        uniform vec3 red;
        uniform vec3 yellow;
        uniform vec3 green;
        uniform vec3 teal;
        vec3 getHeatMapColor(float dist) {
          if (dist < 8.0) {
            float val = dist / 8.0;
            return (1.0 - val) * red + val * yellow;
          } else if (dist < 16.0) {
            float val = (dist - 8.0) / 8.0;
            return (1.0 - val) * yellow + val * green;
          } else {
            float val = (dist - 16.0) / 8.0;
            return (1.0 - val) * green + val * teal;
          }
        }
        void main() {
          gl_FragColor = vec4(getHeatMapColor(distFromOrigin), 1.0);
        }
      `;

    let items = this.getState().items;
    for (let i = 0; i < items.length; i++) {
      let item: ItemType = items[i];
      let config: PointCloudViewerConfigType = {...item.viewerConfig};
      if (_.isEmpty(config)) {
        config = makePointCloudViewerConfig();
      }
      loader.load(item.url, function(geometry) {
          let material = new THREE.ShaderMaterial({
            uniforms: {
              red: {
                value: new THREE.Color(0xff0000),
              },
              yellow: {
                value: new THREE.Color(0xffff00),
              },
              green: {
                value: new THREE.Color(0x00ff00),
              },
              teal: {
                value: new THREE.Color(0x00ffff),
              },
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            alphaTest: 1.0,
          });

          let particles = new THREE.Points(geometry, material);
          self.pointClouds.push(particles);

          self.store.dispatch({type: types.LOAD_ITEM, index: item.index,
            config: config});
        },

        function() {
        },

        function() {
          alert('Point cloud at ' + item.url + ' was not found.');
        },
      );
    }
  }

  /**
   * Load labeling data initialization function
   */
  loadData(): void {
    if (this.itemType === 'image') {
      this.loadImages();
    } else if (this.itemType === 'pointcloud') {
      this.loadPointClouds();
    }
  }
}

export default new Session();
