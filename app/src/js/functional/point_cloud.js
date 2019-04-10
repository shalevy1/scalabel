import {getCurrentItemViewerConfig,
  setCurrentItemViewerConfig} from './state_util';
import {updateObject} from './util';
import type {StateType} from './types';

/**
 * Move camera position to new position
 * @param {StateType} state: Current state
 * @param {Object} newPosition: New camera position (x, y, z)
 * @return {StateType}
 */
export function moveCamera(state: StateType, newPosition: Object): StateType {
  let config = getCurrentItemViewerConfig(state);
  config = updateObject(config, {position: newPosition});
  return setCurrentItemViewerConfig(state, config);
}

/**
 * Move camera and target position
 * @param {StateType} state: Current state
 * @param {Object} newPosition: New camera position (x, y, z)
 * @param {Object} newTarget: New target position (x, y, z)
 * @return {StateType}
 */
export function moveCameraAndTarget(state: StateType, newPosition: Object,
                                    newTarget: Object): StateType {
  let config = getCurrentItemViewerConfig(state);
  config = updateObject(config, {position: newPosition, target: newTarget});
  return setCurrentItemViewerConfig(state, config);
}
