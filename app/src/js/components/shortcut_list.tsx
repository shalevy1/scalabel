import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import { Component } from './component'
import Session from '../common/session'
import * as types from '../action/types'
import {Table, TableCell, TableHead, TableRow, TableBody} from '@material-ui/core';

const shortcuts: String[][] = [['Key', 'Functionality', 'Label Type', 'Location'], ['S', 'Change transformation control to scale mode', 'Box 3D', 'Label 3D Handler'], ['T', 'Change transformation control to translation mode', 'Box 3D', 'Label 3D Handler'], ['R', 'Change transformation control to rotation mode', 'Box 3D', 'Label 3D Handler'], ['Ctrl-dbl click', 'Select multiple labels', '3D', 'Label 3D Handler'], ['ESC', 'Deselect', '3D', 'Label 3D Handler'], ['Enter', 'Deselect', '3D', 'Label 3D Handler'], ['Space', 'Add new label', 'Box 3D', 'Label 3D Handler'], ['C', 'Change camera lock mode', '3D', 'Label 3D Handler'], ['Ctrl-shift-delete', 'Delete Track', 'All', 'Toolbar'], ['Ctrl-delete', 'Terminate track', 'All', 'Toolbar'], ['Delete', 'Delete label', 'All', 'Toolbar'], ['Arrow Keys', 'Move camera around along XY plane', '3D', 'Viewer Config'], ['Period', 'Move Camera up', '3D', 'Viewer Config'], ['Slash', 'Move camera down', '3D', 'Viewer Config'], ['C', 'convert line to bezier curve', 'Polygon 2D', ''], ['D', 'Delete Vertex', 'Polygon 2D', ''], ['L', 'Link Labels', '2D', ''], ['capital L', 'Unlink Labels', '2D', ''], ['meta/control', 'Select multiple labels', '2D', '']]
export interface ShortcutListProps {
  open: boolean;
}

export default class ShortcutList extends Component<ShortcutListProps> {
  private open: boolean;
  private update: () => types.UpdateAllAction;

  constructor (props: ShortcutListProps) {
    super(props)
    this.open = this.props.open;
    this.update = () => {return {
      type: types.UPDATE_ALL,
      sessionId: Session.id
    }}
  }

  componentDidMount () {
    Session.showShortcuts = (() => {this.open = true; Session.dispatch(this.update())}).bind(this)
  }

  componentDidUnmount () {
    Session.showShortcuts = () => {}
  }

  public render () {
    const handleClose = () => {
      this.open = false;
      Session.dispatch(this.update());
    };

    return (
      <Dialog onClose={handleClose} aria-labelledby="simple-dialog-title" open={this.open}>
        <DialogTitle id="simple-dialog-title">Keyboard Shortcuts</DialogTitle>
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
                {shortcuts.map(shortcut => (
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
    );
  }
}
