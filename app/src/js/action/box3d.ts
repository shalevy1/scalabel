import Session from '../common/session'
import { LabelTypes, ShapeTypes } from '../common/types'
import { makeCube, makeLabel } from '../functional/states'
import { CubeType, Vector3Type } from '../functional/types'
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
  let lastManualLabel
  for (let i = itemIndex - 1; i >= 0; i -= 1) {
    if (i in track.labels) {
      const labelId = track.labels[i]
      const label = items[i].labels[labelId]
      if (label.manual) {
        lastManualLabel = label
        lastManualIndex = i
        break
      }
    }
  }

  if (lastManualIndex >= 0 && lastManualLabel) {
    const lastManualCube =
      items[lastManualIndex].shapes[lastManualLabel.shapes[0]].shape as CubeType
    const numItemsBefore = itemIndex - lastManualIndex

    const firstCenter = (new Vector3D()).fromObject(lastManualCube.center)

    const positionDelta = new Vector3D()
    positionDelta.fromObject(cube.center)
    positionDelta.subtract(firstCenter)
    positionDelta.scale(1. / numItemsBefore)
    for (let i = itemIndex - 1; i > lastManualIndex; i -= 1) {
      if (i in track.labels) {
        const labelId = track.labels[i]
        const label = items[i].labels[labelId]

        const newCenter = (new Vector3D()).fromObject(positionDelta)
        newCenter.multiplyScalar(i)
        newCenter.add((new Vector3D()).fromObject(firstCenter))

        updatedIndices.push(i)
        updatedShapeIds.push([label.shapes[0]])
        updatedShapes.push([{
          center: newCenter
        }])
      }
    }
  }

  // Go forward
  let nextManualIndex = -1
  let nextManualLabel
  for (let i = itemIndex + 1; i <= items.length; i += 1) {
    if (i in track.labels) {
      const labelId = track.labels[i]
      const label = items[i].labels[labelId]
      if (label.manual) {
        nextManualLabel = label
        nextManualIndex = i
        break
      }
    }
  }

  if (nextManualIndex >= 0 && nextManualLabel) {
    const nextManualCube =
      items[nextManualIndex].shapes[nextManualLabel.shapes[0]].shape as CubeType
    const numItemsBefore = nextManualIndex - itemIndex

    const firstCenter = (new Vector3D()).fromObject(cube.center)

    const positionDelta = new Vector3D()
    positionDelta.fromObject(nextManualCube.center)
    positionDelta.subtract(firstCenter)
    positionDelta.scale(1. / numItemsBefore)
    for (let i = itemIndex + 1; i < nextManualIndex; i += 1) {
      if (i in track.labels) {
        const labelId = track.labels[i]
        const label = items[i].labels[labelId]

        const newCenter = (new Vector3D()).fromObject(positionDelta)
        newCenter.multiplyScalar(i)
        newCenter.add((new Vector3D()).fromObject(firstCenter))

        updatedIndices.push(i)
        updatedShapeIds.push([label.shapes[0]])
        updatedShapes.push([{
          center: newCenter
        }])
      }
    }
  }

  return {
    type: CHANGE_SHAPES,
    sessionId: Session.id,
    itemIndices: updatedIndices,
    shapeIds: updatedShapeIds,
    shapes: updatedShapes
  }
}
