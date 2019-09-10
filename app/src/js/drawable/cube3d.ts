import * as THREE from 'three'
import { CubeType } from '../functional/types'
import { Vector3D } from '../math/vector3d'
import { getColorById } from './util'

/**
 * Shape for Box3D label
 */
export class Cube3D extends THREE.Group {
  /** Box faces */
  private _box: THREE.Mesh
  /** Outline ThreeJS object */
  private _outline: THREE.LineSegments
  /** Id of corresponding Box3D */
  private _id: number
  /** Color */
  private _color: number[]
  /** Anchor corner index */
  private _anchorIndex: number
  /** ThreeJS Axes for visualization anchor position */
  private _axes: THREE.Group
  /** Redux state */
  private _center: Vector3D
  /** Redux state */
  private _size: Vector3D
  /** Redux state */
  private _orientation: Vector3D

  /**
   * Make box with assigned id
   * @param id
   */
  constructor (id: number) {
    super()
    this._box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: THREE.FaceColors,
        transparent: true,
        opacity: 0.5
      })
    )

    this._outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(this._box.geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    )

    this._id = id

    this._color = []

    this._anchorIndex = 0

    const origin = new THREE.Vector3()
    this._axes = new THREE.Group()
    this._axes.add(new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1), origin, 1.1, 0xffffff
    ))
    this._axes.add(new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0), origin, 1.1, 0xffffff
    ))
    this._axes.add(new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), origin, 1.1, 0xffffff
    ))
    this._axes.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.02),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    ))
    this._axes.position.x = -0.5
    this._axes.position.y = -0.5
    this._axes.position.z = -0.5

    this.add(this._box)
    this.add(this._outline)
    this.add(this._axes)

    this._center = new Vector3D()
    this._size = new Vector3D()
    this._orientation = new Vector3D()
  }

  /**
   * Set size
   * @param size
   */
  public setSize (size: Vector3D): void {
    this.scale.copy(size.toThree())
    this._axes.scale.x = 1. / size[0]
    this._axes.scale.y = 1. / size[1]
    this._axes.scale.z = 1. / size[2]
    this._size.copy(size)
  }

  /**
   * Get size
   */
  public getSize (): Vector3D {
    return (new Vector3D()).fromThree(this.scale)
  }

  /**
   * Set center position
   * @param center
   */
  public setCenter (center: Vector3D): void {
    this.position.copy(center.toThree())
    this._center.copy(center)
  }

  /**
   * Get center position
   */
  public getCenter (): Vector3D {
    return (new Vector3D()).fromThree(this.position)
  }

  /**
   * Set orientation as euler
   * @param orientation
   */
  public setOrientation (orientation: Vector3D): void {
    this.rotation.setFromVector3(orientation.toThree())
    this._orientation.copy(orientation)
  }

  /**
   * Get orientation as euler
   */
  public getOrientation (): Vector3D {
    return (new Vector3D()).fromThree(this.rotation.toVector3())
  }

  /**
   * set id of associated label
   * @param id
   */
  public setId (id: number): void {
    this._id = id
    this._color = getColorById(id)
    this._color = this._color.map((v) => v / 255.)
  }

  /**
   * Get index
   */
  public getId (): number {
    return this._id
  }

  /**
   * Get ThreeJS box
   */
  public getBox (): THREE.Mesh {
    return this._box
  }

  /**
   * Convert to state representation
   */
  public toCube (): CubeType {
    return {
      center: this.getCenter(),
      size: this.getSize(),
      orientation: this.getOrientation(),
      anchorIndex: this._anchorIndex
    }
  }

  /**
   * move anchor to next corner
   */
  public incrementAnchorIndex (): void {
    this._anchorIndex = (this._anchorIndex + 1) % 8
  }

  /**
   * Add to scene for rendering
   * @param scene
   */
  public render (scene: THREE.Scene,
                 highlighted: boolean,
                 selected: boolean): void {
    if (highlighted) {
      (this._outline.material as THREE.LineBasicMaterial).color.set(0xff0000)
    } else {
      (this._outline.material as THREE.LineBasicMaterial).color.set(0xffffff)
    }

    if (selected) {
      this.setColor(0xff0000)
    } else {
      this.setColorFromRGB(this._color)
    }

    this._axes.position.z = Math.floor(this._anchorIndex / 4) - 0.5
    this._axes.position.y = Math.floor(this._anchorIndex / 2) % 2 - 0.5
    this._axes.position.x = this._anchorIndex % 2 - 0.5

    // Check if shape already in scene
    for (const child of scene.children) {
      if (child === this) {
        return
      }
    }

    scene.add(this)
  }

  /**
   * Set bbox face colors
   * @param color
   * @param faces
   */
  private setColor (
    color: number,
    faces: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  ) {
    const geometry = this._box.geometry as THREE.BoxGeometry
    for (const i of faces) {
      geometry.faces[i].color.set(color)
    }

    geometry.colorsNeedUpdate = true
  }

  /**
   * Set bbox face colors from RGB array
   * @param color
   * @param faces
   */
  private setColorFromRGB (
    color: number[],
    faces: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  ) {
    const geometry = this._box.geometry as THREE.BoxGeometry
    for (const i of faces) {
      geometry.faces[i].color.setRGB(color[0], color[1], color[2])
    }

    geometry.colorsNeedUpdate = true
  }
}
