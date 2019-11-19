import React from 'react';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import { Component } from './component'
import Session from '../common/session'
import * as types from '../action/types'
import {Table, TableCell, TableHead, TableRow, TableBody} from '@material-ui/core';

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
    Session.showShortcuts = (() => {this.open = true; Session.dispatch(this.update())}).bind(this)
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
                <TableRow>
                  <TableCell>
                    {"S"}
                  </TableCell>
                  <TableCell>
                    {"Change transformation control to scale mode"}
                  </TableCell>
                  <TableCell>
                    {"Box 3D"}
                  </TableCell>
                  <TableCell>
                    {"Label 3D Handler"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
      </Dialog>
    );
  }
}
