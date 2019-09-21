import Session from '../common/session'
import { LabelTypes } from '../common/types'
import { makeLabel, makePlane } from '../functional/states'
import { PlaneType, Vector3Type } from '../functional/types'
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
export function addPlaneLabel (
  itemIndex: number,
  offset: Vector3Type,
  orientation: Vector3Type): AddLabelsAction {
  // create the rect object
  const plane = makePlane({ offset, orientation })
  const label = makeLabel({ type: LabelTypes.PLANE_3D })
  return actions.addLabel(itemIndex, label, [LabelTypes.PLANE_3D], [plane])
}

/**
 * Add plane to every frame
 * @param offset
 * @param orientation
 */
export function addPlaneTrack (
  offset: Vector3Type,
  orientation: Vector3Type): AddTrackAction {
  const plane = makePlane({ offset, orientation })
  const label = makeLabel({ type: LabelTypes.PLANE_3D })

  return addDuplicatedTrack(label, [LabelTypes.PLANE_3D], [plane], 0)
}

/**
 * Commit a plane
 * @param trackId
 * @param plane
 */
export function commitPlane (
  trackId: number,
  plane: PlaneType
): ChangeShapesAction {
  const state = Session.getState()
  const track = state.task.tracks[trackId]
  const items = state.task.items
  console.log(track, trackId, state.task.tracks)

  const updatedIndices = []
  const updatedShapeIds = []
  const updatedShapes: Array<Array<Partial<PlaneType>>> = []

  for (const key of Object.keys(track.labels)) {
    const index = Number(key)
    const labelId = track.labels[index]
    const item = items[index]
    const label = item.labels[labelId]
    const shapeId = label.shapes[0]

    updatedIndices.push(index)
    updatedShapeIds.push([shapeId])
    updatedShapes.push([{ ...plane }])
  }

  return {
    type: CHANGE_SHAPES,
    sessionId: Session.id,
    itemIndices: updatedIndices,
    shapeIds: updatedShapeIds,
    shapes: updatedShapes
  }
}
