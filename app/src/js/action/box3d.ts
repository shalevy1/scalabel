import Session from '../common/session'
import { LabelTypes, ShapeTypes } from '../common/types'
import { makeCube, makeLabel } from '../functional/states'
import { CubeType, ItemType, Vector3Type } from '../functional/types'
import { Vector3D } from '../math/vector3d'
import * as actions from './common'
import { addDuplicatedTrack } from './track'
import { AddLabelsAction, AddTrackAction, CHANGE_SHAPES, ChangeShapesAction } from './types'

/**
 * Create AddLabelAction to create a box3d label
 * @param {number} itemIndex
 * @param {number[]} category: list of category ids
 * @param {number} center
 * @param {number} size
 * @param {number} orientation
 * @return {AddLabelAction}
 */
export function addBox3dLabel (
  itemIndex: number, category: number[],
  center: Vector3Type, size: Vector3Type,
  orientation: Vector3Type, surfaceId: number = -1): AddLabelsAction {
  // create the rect object
  const cube = makeCube({ center, size, orientation, surfaceId })
  const label = makeLabel({ type: LabelTypes.BOX_3D, category })
  return actions.addLabel(itemIndex, label, [ShapeTypes.CUBE], [cube])
}

/**
 * Add track by duplicating label starting from itemIndex
 * @param itemIndex
 * @param category
 * @param center
 * @param size
 * @param orientation
 */
export function addBox3dDuplicatedTrack (
  itemIndex: number, category: number[],
  center: Vector3Type, size: Vector3Type,
  orientation: Vector3Type): AddTrackAction {
  // create the rect object
  const cube = makeCube({ center, size, orientation })
  const label = makeLabel({ type: LabelTypes.BOX_3D, category })
  return addDuplicatedTrack(label, [ShapeTypes.CUBE], [cube], itemIndex)
}

/**
 * interpolation
 * @param state
 * @param labels
 * @param firstItemIndex
 * @param lastItemIndex
 * @param updatedIndices
 * @param updatedShapeIds
 * @param updatedShapes
 */
function interpolateCubes (
  items: ItemType[],
  labels: {[index: number]: number},
  firstItemIndex: number,
  lastItemIndex: number,
  firstCube: CubeType,
  lastCube: CubeType,
  updatedIndices: number[],
  updatedShapeIds: number[][],
  updatedShapes: Array<Array<Partial<CubeType>>>
) {
  const firstCenter = (new Vector3D()).fromObject(firstCube.center)
  const firstOrientation =
      (new Vector3D()).fromObject(firstCube.orientation)
  const firstSize = (new Vector3D()).fromObject(firstCube.size)

  const lastCenter = (new Vector3D()).fromObject(lastCube.center)
  const lastOrientation =
      (new Vector3D()).fromObject(lastCube.orientation)
  const lastSize = (new Vector3D()).fromObject(lastCube.size)

  const numItems = lastItemIndex - firstItemIndex

  const positionDelta = new Vector3D()
  positionDelta.fromObject(lastCenter)
  positionDelta.subtract(firstCenter)
  positionDelta.scale(1. / numItems)

  const rotationDelta = new Vector3D()
  rotationDelta.fromObject(lastOrientation)
  rotationDelta.subtract(firstOrientation)
  rotationDelta.scale(1. / numItems)

  const scaleDelta = new Vector3D()
  scaleDelta.fromObject(lastSize)
  scaleDelta.subtract(firstSize)
  scaleDelta.scale(1. / numItems)

  for (let i = firstItemIndex + 1; i < lastItemIndex; i += 1) {
    if (i in labels) {
      const indexDelta = i - firstItemIndex
      const labelId = labels[i]
      const label = items[i].labels[labelId]

      const newCenter = (new Vector3D()).fromObject(positionDelta)
      newCenter.multiplyScalar(indexDelta)
      newCenter.add((new Vector3D()).fromObject(firstCenter))

      const newOrientation = (new Vector3D()).fromObject(rotationDelta)
      newOrientation.multiplyScalar(indexDelta)
      newOrientation.add((new Vector3D().fromObject(firstOrientation)))

      const newSize = (new Vector3D()).fromObject(scaleDelta)
      newSize.multiplyScalar(indexDelta)
      newSize.add((new Vector3D().fromObject(firstSize)))

      updatedIndices.push(i)
      updatedShapeIds.push([label.shapes[0]])
      updatedShapes.push([{
        center: newCenter.toObject(),
        orientation: newOrientation.toObject(),
        size: newSize.toObject()
      }])
    }
  }
}

/**
 * Commit label to store, interpolate if needed
 * @param itemIndex
 * @param shapeId
 * @param cube
 */
export function commitCube (
  itemIndex: number,
  trackId: number,
  shapeId: number,
  cube: CubeType
): ChangeShapesAction {
  const state = Session.getState()
  const track = state.task.tracks[trackId]
  const items = state.task.items

  const updatedIndices = [itemIndex]
  const updatedShapeIds = [[shapeId]]
  const updatedShapes: Array<Array<Partial<CubeType>>> = [[cube]]

  // Go backward
  let lastManualIndex = -1
  let lastLabel
  for (let i = itemIndex - 1; i >= 0; i -= 1) {
    if (i in track.labels) {
      const labelId = track.labels[i]
      const label = items[i].labels[labelId]
      if (label.manual) {
        lastManualIndex = i
        lastLabel = label
        break
      }
    }
  }

  // Go forward
  let nextManualIndex = -1
  let nextLabel
  for (let i = itemIndex + 1; i < items.length; i += 1) {
    if (i in track.labels) {
      const labelId = track.labels[i]
      const label = items[i].labels[labelId]
      if (label.manual) {
        nextManualIndex = i
        nextLabel = label
        break
      }
    }
  }

  if (lastManualIndex >= 0 && lastLabel) {
    interpolateCubes(
      items,
      track.labels,
      lastManualIndex,
      itemIndex,
      items[lastManualIndex].shapes[lastLabel.shapes[0]].shape as CubeType,
      cube,
      updatedIndices,
      updatedShapeIds,
      updatedShapes
    )
  }

  if (nextManualIndex >= 0 && nextLabel) {
    interpolateCubes(
      items,
      track.labels,
      itemIndex,
      nextManualIndex,
      cube,
      items[lastManualIndex].shapes[nextLabel.shapes[0]].shape as CubeType,
      updatedIndices,
      updatedShapeIds,
      updatedShapes
    )
  }

  return {
    type: CHANGE_SHAPES,
    sessionId: Session.id,
    itemIndices: updatedIndices,
    shapeIds: updatedShapeIds,
    shapes: updatedShapes
  }
}
