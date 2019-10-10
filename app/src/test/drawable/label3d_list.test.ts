import _ from 'lodash'
// import * as THREE from 'three'
import * as action from '../../js/action/common'
import { moveCameraAndTarget, moveCamera } from '../../js/action/point_cloud'
import Session from '../../js/common/session'
import { initStore } from '../../js/common/session_init'
import { Label3DList } from '../../js/drawable/3d/label3d_list'
import { getCurrentPointCloudViewerConfig, getShape } from '../../js/functional/state_util'
import { CubeType, Vector3Type } from '../../js/functional/types'
import { Vector3D } from '../../js/math/vector3d'
import { testJson } from '../test_point_cloud_objects'
import * as THREE from 'three'
import { updateThreeCameraAndRenderer } from '../../js/view_config/point_cloud'

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

test('Move axis aligned 3d bbox along z axis', () => {
  Session.devMode = false
  initStore(testJson)
  const itemIndex = 0
  Session.dispatch(action.goToItem(itemIndex))

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
  camera.aspect = 1

  const label3dList = new Label3DList()
  Session.subscribe(() => {
    label3dList.updateState(
      Session.getState(),
      Session.getState().user.select.item
    )
  })

  let state = Session.getState()

  Session.dispatch(moveCameraAndTarget(
    new Vector3D(), new Vector3D()
  ))

  const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })
  label3dList.onKeyDown(spaceEvent)

  state = Session.getState()
  expect(_.size(state.task.items[0].labels)).toEqual(1)

  const labelId = Number(Object.keys(state.task.items[0].labels)[0])
  Session.dispatch(action.selectLabel(labelId))

  const tEvent = new KeyboardEvent('keydown', { key: 't' })
  label3dList.onKeyDown(tEvent)

  const position = new Vector3D()
  position[1] = 10
  Session.dispatch(moveCamera(
    position
  ))

  state = Session.getState()
  const viewerConfig = getCurrentPointCloudViewerConfig(state)
  updateThreeCameraAndRenderer(viewerConfig, camera)
  camera.updateMatrixWorld(true)

  const raycastableShapes = label3dList.getRaycastableShapes()

  const raycaster = new THREE.Raycaster()
  raycaster.near = 1.0
  raycaster.far = 100.0
  raycaster.linePrecision = 0.02

  raycaster.setFromCamera(new THREE.Vector2(0, 0.1), camera)
  let intersections = 
    raycaster.intersectObjects(raycastableShapes as unknown as THREE.Object3D[])
  expect(intersections.length).toBeGreaterThan(0)

  label3dList.onMouseMove(0, 0.1, camera, intersections[0])
  label3dList.onMouseDown(0, 0.1, camera)
  label3dList.onMouseMove(0, 0.5, camera)
  label3dList.onMouseUp()

  state = Session.getState()
  let cube = getShape(state, 0, 0, 0) as CubeType

  expect((new Vector3D()).fromObject(cube.center)[2]).toBeGreaterThan(0)

  raycaster.setFromCamera(new THREE.Vector2(0, 0.5), camera)
  intersections =
    raycaster.intersectObjects(raycastableShapes as unknown as THREE.Object3D[])
  expect(intersections.length).toBeGreaterThan(0)

  label3dList.onMouseMove(0, 0.5, camera, intersections[0])
  label3dList.onMouseDown(0, 0.5, camera)
  label3dList.onMouseMove(0, 0.1, camera)
  label3dList.onMouseUp()

  state = Session.getState()
  cube = getShape(state, 0, 0, 0) as CubeType
  expect((new Vector3D()).fromObject(cube.center)[2]).toBeCloseTo(0)
})
