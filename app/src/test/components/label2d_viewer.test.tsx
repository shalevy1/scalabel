import { MuiThemeProvider } from '@material-ui/core/styles'
import { render } from '@testing-library/react'
import _ from 'lodash'
import * as React from 'react'
import * as action from '../../js/action/common'
import Session from '../../js/common/session'
import { initStore } from '../../js/common/session_init'
import { Label2dViewer } from '../../js/components/label2d_viewer'
import { getShape } from '../../js/functional/state_util'
import { makeImageViewerConfig } from '../../js/functional/states'
import { RectType } from '../../js/functional/types'
import { myTheme } from '../../js/styles/theme'
import { testJson } from '../test_image_objects'

test('Draw 2d boxes to label2d list', () => {
  Session.devMode = false
  initStore(testJson)
  const itemIndex = 0
  Session.images.push({ [-1]: new Image(100, 100) })
  Session.dispatch(action.addViewerConfig(0, makeImageViewerConfig(-1)))

  const container = document.createElement('div')
  container.getBoundingClientRect = jest.fn(() => {
    return {
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {
        return {
          width: 100,
          height: 100,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          x: 0,
          y: 0
        }
      }
    }
  })

  const viewerRef: React.RefObject<Label2dViewer> = React.createRef()

  render(
    <MuiThemeProvider theme={myTheme} key='muiTheme'>
      <Label2dViewer
        key='label2dviewer'
        id={0}
        display={container}
        classes={{
          label2d_canvas: 'label2dcanvas',
          control_canvas: 'controlcanvas'
        }}
        ref={viewerRef}
      />
    </MuiThemeProvider>
  )

  expect(viewerRef.current).not.toBeUndefined()
  expect(viewerRef.current).not.toBeNull()

  Session.dispatch(action.goToItem(itemIndex))

  // // Draw first box
  if (viewerRef.current) {
    viewerRef.current.onMouseDown(
      new MouseEvent(
        'mouseDown',
        { clientX: 1, clientY: 1 }
      ) as unknown as React.MouseEvent<HTMLCanvasElement>
    )
    viewerRef.current.onMouseMove(
      new MouseEvent(
        'mousemove',
        { clientX: 10, clientY: 10 }
      ) as unknown as React.MouseEvent<HTMLCanvasElement>
    )
    viewerRef.current.onMouseUp(
      new MouseEvent(
        'mouseup',
        { clientX: 10, clientY: 10 }
      ) as unknown as React.MouseEvent<HTMLCanvasElement>
    )
    const state = Session.getState()
    expect(_.size(state.task.items[0].labels)).toEqual(1)
    const rect = getShape(state, 0, 0, 0) as RectType
    expect(rect.x1).toEqual(1)
    expect(rect.y1).toEqual(1)
    expect(rect.x2).toEqual(10)
    expect(rect.y2).toEqual(10)
  }

  // // Second box
  // label2dList.onMouseDown(new Vector2D(19, 20), -1, 0)
  // label2dList.onMouseMove(new Vector2D(25, 25), canvasSize, -1, 0)
  // label2dList.onMouseMove(new Vector2D(30, 29), canvasSize, -1, 0)
  // label2dList.onMouseUp(new Vector2D(30, 29), -1, 0)

  // state = Session.getState()
  // expect(_.size(state.task.items[0].labels)).toEqual(2)
  // rect = getShape(state, 0, 1, 0) as RectType
  // expect(rect.x1).toEqual(19)
  // expect(rect.y1).toEqual(20)
  // expect(rect.x2).toEqual(30)
  // expect(rect.y2).toEqual(29)

  // // third box
  // label2dList.onMouseDown(new Vector2D(4, 5), -1, 0)
  // label2dList.onMouseMove(new Vector2D(15, 15), canvasSize, -1, 0)
  // label2dList.onMouseMove(new Vector2D(23, 24), canvasSize, -1, 0)
  // label2dList.onMouseUp(new Vector2D(23, 24), -1, 0)
  // state = Session.getState()
  // expect(_.size(state.task.items[0].labels)).toEqual(3)
  // rect = getShape(state, 0, 2, 0) as RectType
  // expect(rect.x1).toEqual(4)
  // expect(rect.y1).toEqual(5)
  // expect(rect.x2).toEqual(23)
  // expect(rect.y2).toEqual(24)

  // // resize the second box
  // label2dList.onMouseDown(new Vector2D(19, 20), 1, 1)
  // label2dList.onMouseMove(new Vector2D(15, 18), canvasSize, -1, 0)
  // label2dList.onMouseMove(new Vector2D(16, 17), canvasSize, -1, 0)
  // label2dList.onMouseUp(new Vector2D(16, 17), -1, 0)
  // state = Session.getState()
  // expect(_.size(state.task.items[0].labels)).toEqual(3)
  // rect = getShape(state, 0, 1, 0) as RectType
  // expect(rect.x1).toEqual(16)
  // expect(rect.y1).toEqual(17)

  // // flip top left and bottom right corner
  // label2dList.onMouseDown(new Vector2D(16, 17), 1, 1)
  // label2dList.onMouseMove(new Vector2D(42, 43), canvasSize, -1, 0)
  // label2dList.onMouseUp(new Vector2D(40, 41), -1, 0)
  // state = Session.getState()
  // rect = getShape(state, 0, 1, 0) as RectType
  // expect(rect.x1).toEqual(30)
  // expect(rect.y1).toEqual(29)
  // expect(rect.x2).toEqual(42)
  // expect(rect.y2).toEqual(43)

  // // move
  // label2dList.onMouseDown(new Vector2D(32, 31), 1, 0)
  // label2dList.onMouseMove(new Vector2D(36, 32), canvasSize, -1, 0)
  // label2dList.onMouseUp(new Vector2D(36, 32), -1, 0)
  // state = Session.getState()
  // rect = getShape(state, 0, 1, 0) as RectType
  // expect(rect.x1).toEqual(34)
  // expect(rect.y1).toEqual(30)
  // expect(rect.x2).toEqual(46)
  // expect(rect.y2).toEqual(44)

  // // delete label
  // Session.dispatch(action.deleteLabel(0, 1))
  // expect(label2dList.labelList.length).toEqual(2)
  // expect(label2dList.labelList[0].index).toEqual(0)
  // expect(label2dList.labelList[0].labelId).toEqual(0)
  // expect(label2dList.labelList[1].index).toEqual(1)
  // expect(label2dList.labelList[1].labelId).toEqual(2)
})
