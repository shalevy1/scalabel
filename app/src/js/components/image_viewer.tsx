import { withStyles } from '@material-ui/styles'
import React from 'react'
import { ImageViewerConfigType } from '../functional/types'
import { viewerStyles } from '../styles/viewer'
import { DrawableViewer, ViewerProps } from './drawable_viewer'
import ImageCanvas from './image_canvas'
import Label2dCanvas from './label2d_canvas'

/**
 * Viewer for images and 2d labels
 */
class ImageViewer extends DrawableViewer {
  /**
   * Constructor
   * @param {Object} props: react props
   */
  constructor (props: ViewerProps) {
    super(props)
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
  protected getDrawableComponents () {
    if (this._container && this._viewerConfig) {
      this._container.scrollTop =
        (this._viewerConfig as ImageViewerConfigType).displayTop
      this._container.scrollLeft =
        (this._viewerConfig as ImageViewerConfigType).displayLeft
    }

    const views: React.ReactElement[] = []
    if (this._viewerConfig) {
      views.push(
        <ImageCanvas
          key={`imageView${this.props.id}`}
          display={this._container}
          id={this.props.id}
        />
      )
      views.push(
        <Label2dCanvas
          key={`imageView${this.props.id}`}
          display={this._container}
          id={this.props.id}
        />
      )
    }

    return views
  }

  /**
   * Handle mouse down
   * @param e
   */
  protected onMouseDown (e: React.MouseEvent) {
    if (e.button === 2) {
      e.preventDefault()
    }
    this._viewerConfigUpdater.onMouseDown(e.clientX, e.clientY, e.button)
  }

  /**
   * Handle mouse up
   * @param e
   */
  protected onMouseUp (_e: React.MouseEvent) {
    this._viewerConfigUpdater.onMouseUp()
  }

  /**
   * Handle mouse move
   * @param e
   */
  protected onMouseMove (e: React.MouseEvent) {
    this._viewerConfigUpdater.onMouseMove(e.clientX, e.clientY)
  }

  /**
   * Handle double click
   * @param e
   */
  protected onDoubleClick (e: React.MouseEvent) {
    this._viewerConfigUpdater.onDoubleClick(e.clientX, e.clientY)
  }

  /**
   * Handle mouse leave
   * @param e
   */
  protected onMouseEnter (_e: React.MouseEvent) {
    Session.activeViewerId = this.props.id
  }

  /**
   * Handle mouse leave
   * @param e
   */
  protected onMouseLeave (_e: React.MouseEvent) {
    return
  }

  /**
   * Handle mouse wheel
   * @param e
   */
  protected onWheel (e: React.WheelEvent) {
    e.preventDefault()
    this._viewerConfigUpdater.onWheel(e.deltaY)
  }

  /**
   * Handle key down
   * @param e
   */
  protected onKeyUp (e: KeyboardEvent) {
    if (Session.activeViewerId === this.props.id) {
      this._viewerConfigUpdater.onKeyUp(e.key)
    }
  }

  /**
   * Handle key down
   * @param e
   */
  protected onKeyDown (e: KeyboardEvent) {
    if (Session.activeViewerId === this.props.id) {
      this._viewerConfigUpdater.onKeyDown(e.key)
    }
  }

}

export default withStyles(viewerStyles)(ImageViewer)
