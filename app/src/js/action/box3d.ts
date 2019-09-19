import { LabelTypes, ShapeTypes } from '../common/types'
import { makeCube, makeLabel } from '../functional/states'
import { Vector3Type } from '../functional/types'
import * as actions from './common'
import { addDuplicatedTrack } from './track'
import { AddLabelsAction, AddTrackAction } from './types'

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
