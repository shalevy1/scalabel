import { Dialog, DialogTitle, Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core'
import React from 'react'
import * as types from '../action/types'
import Session from '../common/session'
import { Component } from './component'

const shortcuts: string[][] = [
  ['Key', 'Functionality', 'Label Type', 'Location'],
  ['S', 'Change transformation control to scale mode', 'Box 3D', 'Label 3D Handler'],
  ['T', 'Change transformation control to translation mode', 'Box 3D', 'Label 3D Handler'],
  ['R', 'Change transformation control to rotation mode', 'Box 3D', 'Label 3D Handler'],
  ['Ctrl-dbl click', 'Select multiple labels', '3D', 'Label 3D Handler'],
  ['ESC', 'Deselect', '3D', 'Label 3D Handler'],
  ['Enter', 'Deselect', '3D', 'Label 3D Handler'],
  ['Space', 'Add new label', 'Box 3D', 'Label 3D Handler'],
  ['C', 'Change camera lock mode', '3D', 'Label 3D Handler'],
  ['Ctrl-shift-delete', 'Delete Track', 'All', 'Toolbar'],
  ['Ctrl-delete', 'Terminate track', 'All', 'Toolbar'],
  ['Delete', 'Delete label', 'All', 'Toolbar'],
  ['Arrow Keys', 'Move camera around along XY plane', '3D', 'Viewer Config'],
  ['Period', 'Move Camera up', '3D', 'Viewer Config'],
  ['Slash', 'Move camera down', '3D', 'Viewer Config'],
  ['C', 'convert line to bezier curve', 'Polygon 2D', ''],
  ['D', 'Delete Vertex', 'Polygon 2D', ''], ['L', 'Link Labels', '2D', ''],
  ['capital L', 'Unlink Labels', '2D', ''],
  ['meta/control', 'Select multiple labels', '2D', '']
]

/** keyboard shortcuts list component */
export default class ShortcutList extends Component<{}> {
  /**
   * renders the shortcuts list
   */
  public render () {
    const open = Session.showShortcuts
    const handleClose = () => {
      Session.showShortcuts = false
      Session.dispatch({
        type: types.UPDATE_ALL,
        sessionId: Session.id
      })
    }

    return (
      <Dialog onClose={handleClose}
        aria-labelledby='simple-dialog-title'
        open={open}>
        <DialogTitle id='simple-dialog-title'>Keyboard Shortcuts</DialogTitle>
        <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell align={'center'}>
                    {'Key'}</TableCell>
                  <TableCell align={'center'}>
                    {'Functionality'}</TableCell>
                  <TableCell align={'center'}>
                    {'Label Type'}</TableCell>
                  <TableCell align={'center'}>
                    {'Location'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shortcuts.map((shortcut) => (
                  <TableRow>
                    <TableCell>
                      {shortcut[0]}
                    </TableCell>
                    <TableCell>
                      {shortcut[1]}
                    </TableCell>
                    <TableCell>
                      {shortcut[2]}
                    </TableCell>
                    <TableCell>
                      {shortcut[3]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
      </Dialog>
    )
  }
}
