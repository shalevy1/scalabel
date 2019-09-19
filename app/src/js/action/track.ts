import Session from '../common/session'
import { LabelType, ShapeType } from '../functional/types'
import { addTrack } from './common'
import { AddTrackAction } from './types'

/**
 * Add track by duplicating label from startIndex to stopIndex
 * @param label
 * @param shapeTypes
 * @param shapes
 * @param startIndex
 * @param stopIndex
 */
export function addDuplicatedTrack (
  label: LabelType,
  shapeTypes: string[],
  shapes: ShapeType[],
  startIndex: number,
  stopIndex?: number
): AddTrackAction {
  const trackLabels = []
  const trackShapeTypes = []
  const trackShapes = []
  const itemIndices = []

  const itemLength = (Session.itemType === 'image') ? Session.images.length :
    Session.pointClouds.length
  const state = Session.getState()

  const end = (stopIndex) ? Math.min(stopIndex, itemLength) :
    Math.min(startIndex + state.task.config.maxTrackLength, itemLength)

  for (let index = 0; index < end; index += 1) {
    trackLabels.push(JSON.parse(JSON.stringify(label)))
    trackShapeTypes.push(JSON.parse(JSON.stringify(shapeTypes)))
    trackShapes.push(JSON.parse(JSON.stringify(shapes)))
    itemIndices.push(index)
  }

  return addTrack(itemIndices, trackLabels, trackShapeTypes, trackShapes)
}
