import {getCurrentItemViewerConfig,
  setCurrentItemViewerConfig} from './state_util';
import {updateObject, updateListItem} from './util';
import type {StateType} from './types';
import {makeLabel, makeCube} from './states';

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

/**
 * Create new 3d bbox label
 * @param {StateType} state
 * @param {number} itemId
 * @param {Object} optionalAttributes
 * @return {{items: Array, labels: {}, shapes: {}, current: {}}}
 */
export function newBox3dLabel(
  state: StateType,
  itemId: number,
  optionalAttributes: Object = {}): StateType {
  // get the labelId
  let labelId = state.current.maxObjectId + 1;
  // put the labelId inside item
  let item = updateObject(state.items[itemId],
    {labels: state.items[itemId].labels.concat([labelId])});
  // put updated item inside items
  let items = updateListItem(state.items, itemId, item);
  // get the shape Id
  let shapeId = labelId + 1;
  // create the rect object
  let rect = makeCube({id: shapeId, ...optionalAttributes});
  // put rect inside shapes
  let shapes = updateObject(state.shapes, {[shapeId]: rect});
  // create the actual label with the labelId and shapeId and put inside labels
  let labels = updateObject(state.labels,
    {[labelId]: makeLabel({id: labelId, item: itemId, shapes: [shapeId]})});
  let current = updateObject(state.current,
    {label: labelId, maxObjectId: shapeId});
  return {
    ...state,
    items: items,
    labels: labels,
    shapes: shapes,
    current: current,
  };
}

/**
 * Highlight box that is being hovered over
 * @param {StateType} state
 * @param {number} shapeId
 * @param {number} labelId
 * @param {Object} boxHighlightIntersection
 * @param {Object} boxHighlightCenterOffset
 * @return {StateType}
 */
export function highlightBox(state: StateType, shapeId: number,
                             labelId: number,
                             boxHighlightIntersection: Object,
                             boxHighlightCenterOffset): StateType {
  return updateObject(state, {
    highlightedShapeId: shapeId,
    highlightedLabelId: labelId,
    boxHighlightIntersection: boxHighlightIntersection,
    boxHighlightCenterOffset: boxHighlightCenterOffset,
  });
}

/**
 * Select box that is clicked on
 * @param {StateType} state
 * @return {StateType}
 */
export function selectBox(state: StateType): StateType {
  return updateObject(state, {selectedShapeId: state.highlightedShapeId,
                              selectedLabelId: state.highlightedLabelId});
}

/**
 * Deselect currently selected box
 * @param {StateType} state
 * @return {StateType}
 */
export function deselectBox(state: StateType): StateType {
  return updateObject(state, {selectedShapeId: -1,
                              selectedLabelId: -1});
}

/**
 * Move 3d bbox to new location
 * @param {StateType} state
 * @param {number} shapeId
 * @param {Object} newCenter
 * @return {StateType}
 */
export function moveBox(state: StateType, shapeId: number,
                        newCenter: Object): StateType {
  let shape = state.shapes[shapeId];
  newCenter = updateObject(shape.center, newCenter);
  let newShape = updateObject(shape, {center: newCenter});
  let shapes = updateObject(state.shapes, {[shapeId]: newShape});
  return updateObject(state, {shapes: shapes});
}

/**
 * Update 3d bbox scale
 * @param {StateType} state
 * @param {number} shapeId
 * @param {Object} newScale
 * @return {StateType}
 */
export function scaleBox(state: StateType, shapeId: number,
                         newScale: Object): StateType {
  let shape = state.shapes[shapeId];
  newScale = updateObject(shape.size, newScale);
  let newShape = updateObject(state.shapes[shapeId], {size: newScale});
  let shapes = updateObject(state.shapes, {[shapeId]: newShape});
  return updateObject(state, {shapes: shapes});
}

/**
 * Update 3d bbox rotation
 * @param {StateType} state
 * @param {number} shapeId
 * @param {Object} newOrientation
 * @return {StateType}
 */
export function rotateBox(state: StateType, shapeId: number,
                          newOrientation: Object): StateType {
  let shape = state.shapes[shapeId];
  newOrientation = updateObject(shape.orientation, newOrientation);
  let newShape = updateObject(state.shapes[shapeId],
                              {orientation: newOrientation});
  let shapes = updateObject(state.shapes, {[shapeId]: newShape});
  return updateObject(state, {shapes: shapes});
}
