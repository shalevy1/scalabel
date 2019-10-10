import _ from 'lodash'
// import * as THREE from 'three'
import * as action from '../../js/action/common'
import { moveCameraAndTarget } from '../../js/action/point_cloud'
import Session from '../../js/common/session'
import { initStore } from '../../js/common/session_init'
import { Label3DList } from '../../js/drawable/3d/label3d_list'
import { getCurrentPointCloudViewerConfig, getShape } from '../../js/functional/state_util'
import { CubeType, Vector3Type } from '../../js/functional/types'
import { Vector3D } from '../../js/math/vector3d'
import { testJson } from '../test_point_cloud_objects'

/**
 * Check equality between two Vector3Type objects
 * @param v1
 * @param v2
 */
function expectVector3TypesClose (v1: Vector3Type, v2: Vector3Type) {
  expect(v1.x).toBeCloseTo(v2.x)
  expect(v1.y).toBeCloseTo(v2.y)
  expect(v1.z).toBeCloseTo(v2.z)
}

test('Add 3d bbox', () => {
  Session.devMode = false
  initStore(testJson)
  const itemIndex = 0
  Session.dispatch(action.goToItem(itemIndex))

  const label3dList = new Label3DList()
  Session.subscribe(() => {
    label3dList.updateState(
      Session.getState(),
      Session.getState().user.select.item
    )
  })

  const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })

  label3dList.onKeyDown(spaceEvent)
  let state = Session.getState()
  expect(_.size(state.task.items[0].labels)).toEqual(1)
  let cube = getShape(state, 0, 0, 0) as CubeType
  let viewerConfig = getCurrentPointCloudViewerConfig(state)
  expect(viewerConfig).not.toBeNull()
  expectVector3TypesClose(cube.center, viewerConfig.target)
  expectVector3TypesClose(cube.orientation, { x: 0, y: 0, z: 0 })
  expectVector3TypesClose(cube.size, { x: 1, y: 1, z: 1 })
  expect(cube.anchorIndex).toEqual(0)

  // Move target randomly a few times and
  // make sure that the bounding box is always created at the target
  const maxVal = 100
  const position = new Vector3D()
  position.fromObject(viewerConfig.position)
  const target = new Vector3D()
  for (let i = 1; i <= 10; i += 1) {
    target[0] = Math.random() * 2 - 1
    target[1] = Math.random() * 2 - 1
    target[2] = Math.random() * 2 - 1
    target.multiplyScalar(maxVal)
    Session.dispatch(moveCameraAndTarget(position, target))

    label3dList.onKeyDown(spaceEvent)
    state = Session.getState()
    expect(_.size(state.task.items[0].labels)).toEqual(i + 1)
    cube = getShape(state, 0, i, 0) as CubeType
    viewerConfig = getCurrentPointCloudViewerConfig(state)
    expect(viewerConfig).not.toBeNull()

    expectVector3TypesClose(viewerConfig.position, position)
    expectVector3TypesClose(viewerConfig.target, target)
    expectVector3TypesClose(cube.center, viewerConfig.target)
    expectVector3TypesClose(cube.orientation, { x: 0, y: 0, z: 0 })
    expectVector3TypesClose(cube.size, { x: 1, y: 1, z: 1 })
    expect(cube.anchorIndex).toEqual(0)
  }
})
