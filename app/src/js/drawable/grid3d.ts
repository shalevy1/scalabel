import * as THREE from 'three'
import { PlaneType } from '../functional/types'
import { Vector3D } from '../math/vector3d'

/**
 * ThreeJS class for rendering grid
 */
export class Grid3D extends THREE.Group {
  /** grid lines */
  private _lines: THREE.GridHelper
  /** label id */
  private _id: number

  constructor (id: number) {
    super()
    this._id = id
    this._lines = new THREE.GridHelper(6, 6, 0xffffff, 0xffffff)
    this._lines.rotation.x = Math.PI / 2
    this.add(this._lines)
  }

  /**
   * Add to scene for rendering
   * @param scene
   */
  public render (scene: THREE.Scene): void {
    scene.add(this)
  }

  /**
   * Get id
   */
  public get labelId (): number {
    return this._id
  }

  /**
   * Set id
   * @param {number} id
   */
  public set labelId (id: number) {
    this._id = id
  }

  /**
   * Object representation
   */
  public toPlane (): PlaneType {
    return {
      offset: (new Vector3D()).fromThree(this.position),
      orientation: (new Vector3D()).fromThree(this.rotation.toVector3())
    }
  }
}
