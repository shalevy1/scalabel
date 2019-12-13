import { withStyles } from '@material-ui/styles'
import React from 'react'
import Session from '../common/session'
import * as types from '../common/types'
import { ImageViewerConfigType, ViewerConfigType } from '../functional/types'
import { viewerStyles } from '../styles/viewer'
import ViewerConfigUpdater from '../view_config/viewer_config'
import { Component } from './component'
import ImageCanvas from './image_canvas'
import Label2dCanvas from './label2d_canvas'
import Label3dCanvas from './label3d_canvas'
import PointCloudCanvas from './point_cloud_canvas'

/** Generate string to use for react component key */
export function viewerReactKey (id: number) {
  return `viewer${id}`
}

interface ClassType {
  /** container */
  viewer_container: string
}

interface Props {
  /** classes */
  classes: ClassType
  /** id of the viewer, for referencing viewer config in state */
  id: number
}

/**
 * Canvas Viewer
 */
class Viewer extends Component<Props> {
  /** Moveable container */
  private _container: HTMLDivElement | null
  /** viewer config */
  private _viewerConfig?: ViewerConfigType
  /** Manage viewer config */
  private _viewerConfigUpdater: ViewerConfigUpdater

  /** UI handler */
  private _keyDownHandler: (e: KeyboardEvent) => void
  /** UI handler */
  private _keyUpHandler: (e: KeyboardEvent) => void

  /**
   * Constructor
   * @param {Object} props: react props
   */
  constructor (props: Props) {
    super(props)
    this._container = null
    this._viewerConfigUpdater = new ViewerConfigUpdater()

    const state = Session.getState()
    if (this.props.id in state.user.viewerConfigs) {
      this._viewerConfig = state.user.viewerConfigs[this.props.id]
    }

    this._keyDownHandler = this.onKeyDown.bind(this)
    this._keyUpHandler = this.onKeyUp.bind(this)
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
    const id = this.props.id
    const viewerConfig = this.state.user.viewerConfigs[this.props.id]
    this._viewerConfig = viewerConfig
    if (viewerConfig && this._container) {
      const viewerType = viewerConfig.type
      if (viewerType === types.ViewerConfigTypeName.IMAGE ||
          types.ViewerConfigTypeName.IMAGE_3D) {
        this._container.scrollTop =
        (viewerConfig as ImageViewerConfigType).displayTop
        this._container.scrollLeft =
          (viewerConfig as ImageViewerConfigType).displayLeft
      }
    }
    this._viewerConfigUpdater.updateState(this.state, this.props.id)

    const views: React.ReactElement[] = []
    if (this._viewerConfig) {
      const config = this._viewerConfig
      switch (config.type) {
        case types.ViewerConfigTypeName.IMAGE:
          views.push(
            <ImageCanvas
              key={`imageView${id}`} display={this._container} id={id}
            />
          )
          views.push(
            <Label2dCanvas
              key={`label2dView${id}`} display={this._container} id={id}
            />
          )
          break
        case types.ViewerConfigTypeName.POINT_CLOUD:
          views.push(
            <PointCloudCanvas
              key={`pointCloudView${id}`} display={this._container} id={id}
            />
          )
          views.push(
            <Label3dCanvas
              key={`label3dView${id}`} display={this._container} id={id}
            />
          )
          break
        case types.ViewerConfigTypeName.IMAGE_3D:
          views.push(
            <ImageCanvas
              key={`imageView${id}`} display={this._container} id={id}
            />
          )
          views.push(
            <Label3dCanvas
              key={`label3dView${id}`} display={this._container} id={id}
            />
          )
          break
      }
    }

    return (
        <div
          ref={(element) => {
            if (element && this._container !== element) {
              this._container = element
              this._viewerConfigUpdater.setContainer(this._container)
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
          {views}
        </div>
    )
  }

  /**
   * Handle mouse down
   * @param e
   */
  private onMouseDown (e: React.MouseEvent) {
    if (e.button === 2) {
      e.preventDefault()
    }
    this._viewerConfigUpdater.onMouseDown(e.clientX, e.clientY, e.button)
  }

  /**
   * Handle mouse up
   * @param e
   */
  private onMouseUp (_e: React.MouseEvent) {
    this._viewerConfigUpdater.onMouseUp()
  }

  /**
   * Handle mouse move
   * @param e
   */
  private onMouseMove (e: React.MouseEvent) {
    this._viewerConfigUpdater.onMouseMove(e.clientX, e.clientY)
  }

  /**
   * Handle double click
   * @param e
   */
  private onDoubleClick (e: React.MouseEvent) {
    this._viewerConfigUpdater.onDoubleClick(e.clientX, e.clientY)
  }

  /**
   * Handle mouse leave
   * @param e
   */
  private onMouseEnter (_e: React.MouseEvent) {
    Session.activeViewerId = this.props.id
  }

  /**
   * Handle mouse leave
   * @param e
   */
  private onMouseLeave (_e: React.MouseEvent) {
    return
  }

  /**
   * Handle mouse wheel
   * @param e
   */
  private onWheel (e: React.WheelEvent) {
    e.preventDefault()
    this._viewerConfigUpdater.onWheel(e.deltaY)
  }

  /**
   * Handle key down
   * @param e
   */
  private onKeyUp (e: KeyboardEvent) {
    if (Session.activeViewerId === this.props.id) {
      this._viewerConfigUpdater.onKeyUp(e.key)
    }
  }

  /**
   * Handle key down
   * @param e
   */
  private onKeyDown (e: KeyboardEvent) {
    if (Session.activeViewerId === this.props.id) {
      this._viewerConfigUpdater.onKeyDown(e.key)
    }
  }
}

export default withStyles(
  viewerStyles, { withTheme: true }
)(Viewer)
