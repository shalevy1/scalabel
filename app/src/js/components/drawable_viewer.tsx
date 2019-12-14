import React from 'react'
import Session from '../common/session'
import { ViewerConfigType } from '../functional/types'
import { Component } from './component'

/** Generate string to use for react component key */
export function viewerReactKey (id: number) {
  return `viewer${id}`
}

interface ClassType {
  /** container */
  viewer_container: string
}

export interface ViewerProps {
  /** classes */
  classes: ClassType
  /** id of the viewer, for referencing viewer config in state */
  id: number
}

/** Make drawable viewer based on viewer config */
export function viewerFactory (
  viewerConfig: ViewerConfigType
): DrawableViewer | null {
  switch (viewerConfig.type) {

  }
  return null
}

/**
 * Canvas Viewer
 */
export abstract class DrawableViewer extends Component<ViewerProps> {
  /** Moveable container */
  protected _container: HTMLDivElement | null
  /** viewer config */
  protected _viewerConfig?: ViewerConfigType

  /** UI handler */
  protected _keyDownHandler: (e: KeyboardEvent) => void
  /** UI handler */
  protected _keyUpHandler: (e: KeyboardEvent) => void

  /** The hashed list of keys currently down */
  protected _keyDownMap: { [key: string]: boolean }
  /** Mouse x-coord */
  protected _mX: number
  /** Mouse y-coord */
  protected _mY: number
  /** Whether mouse is down */
  protected _mouseDown: boolean
  /** which button is pressed on mouse down */
  protected _mouseButton: number
  /** item number */
  protected _item: number

  /**
   * Constructor
   * @param {Object} props: react props
   */
  constructor (props: ViewerProps) {
    super(props)
    this._container = null

    const state = Session.getState()
    if (this.props.id in state.user.viewerConfigs) {
      this._viewerConfig = state.user.viewerConfigs[this.props.id]
    }

    this._keyDownHandler = this.onKeyDown.bind(this)
    this._keyUpHandler = this.onKeyUp.bind(this)

    this._keyDownMap = {}
    this._mX = 0
    this._mY = 0
    this._mouseDown = false
    this._mouseButton = -1
    this._item = -1
  }

  /**
   * Run when component mounts
   */
  public componentDidMount () {
    super.componentDidMount()
    document.addEventListener('keydown', this._keyDownHandler)
    document.addEventListener('keyup', this._keyUpHandler)
  }

  /**
   * Run when component unmounts
   */
  public componentWillUnmount () {
    super.componentWillUnmount()
    document.removeEventListener('keydown', this._keyDownHandler)
    document.removeEventListener('keyup', this._keyUpHandler)
  }

  /**
   * Render function
   * @return {React.Fragment} React fragment
   */
  public render () {
    const viewerConfig = this.state.user.viewerConfigs[this.props.id]
    this._viewerConfig = viewerConfig

    return (
        <div
          ref={(element) => {
            if (element && this._container !== element) {
              this._container = element
              this.forceUpdate()
            }
          }}
          className={this.props.classes.viewer_container}
          onMouseDown={ (e) => this.onMouseDown(e) }
          onMouseUp={ (e) => this.onMouseUp(e) }
          onMouseMove={ (e) => this.onMouseMove(e) }
          onMouseEnter={ (e) => this.onMouseEnter(e) }
          onMouseLeave={ (e) => this.onMouseLeave(e) }
          onDoubleClick={ (e) => this.onDoubleClick(e) }
          onWheel ={ (e) => this.onWheel(e) }
        >
          {this.getDrawableComponents()}
        </div>
    )
  }

  /** Get child components for rendering */
  protected abstract getDrawableComponents (): React.ReactElement[]

  /**
   * Handle mouse down
   * @param e
   */
  protected abstract onMouseDown (e: React.MouseEvent): void

  /**
   * Handle mouse up
   * @param e
   */
  protected abstract onMouseUp (e: React.MouseEvent): void

  /**
   * Handle mouse move
   * @param e
   */
  protected abstract onMouseMove (e: React.MouseEvent): void

  /**
   * Handle double click
   * @param e
   */
  protected abstract onDoubleClick (e: React.MouseEvent): void

  /**
   * Handle mouse leave
   * @param e
   */
  protected abstract onMouseEnter (_e: React.MouseEvent): void

  /**
   * Handle mouse leave
   * @param e
   */
  protected abstract onMouseLeave (_e: React.MouseEvent): void

  /**
   * Handle mouse wheel
   * @param e
   */
  protected abstract onWheel (e: React.WheelEvent): void

  /**
   * Handle key down
   * @param e
   */
  protected abstract onKeyUp (e: KeyboardEvent): void
  /**
   * Handle key down
   * @param e
   */
  protected abstract onKeyDown (e: KeyboardEvent): void
}
