import * as THREE from 'three'
import { CubeType } from '../functional/types'
import { Vector3D } from '../math/vector3d'
import { TransformationControl } from './control/transformation_control'
import { getColorById } from './util'

const faceNormals = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(-1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, -1, 0),
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(0, 0, -1)
]

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
  /** Redux state */
  private _center: Vector3D
  /** Redux state */
  private _size: Vector3D
  /** Redux state */
  private _orientation: Vector3D
  /** controls */
  private _control: TransformationControl | null
  /** Normal of the closest face */
  private _closestFaceNormal: THREE.Vector3
  /** Control points */
  private _controlSpheres: THREE.Mesh[]
  /** Highlighted control point */
  private _highlightedSphere: THREE.Mesh | null
  /** whether highlighted */
  private _highlighted: boolean

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

    this.add(this._box)
    this.add(this._outline)

    this._center = new Vector3D()
    this._size = new Vector3D()
    this._orientation = new Vector3D()

    this._control = null

    this._closestFaceNormal = new THREE.Vector3()
    this._controlSpheres = []
    for (let i = 0; i < 4; i += 1) {
      this._controlSpheres.push(new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.3
        })
      ))
      this.add(this._controlSpheres[i])
      this._controlSpheres[i].visible = false
    }
    this._highlightedSphere = this._controlSpheres[0]
    this._highlightedSphere.position.x = 0
    this._highlightedSphere = null

    this._highlighted = false

    this.setHighlighted()
  }

  /**
   * Set size
   * @param size
   */
  public setSize (size: Vector3D): void {
    this.scale.copy(size.toThree())
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
                 camera: THREE.Camera): void {
    if (this._highlighted) {
      (this._outline.material as THREE.LineBasicMaterial).color.set(0xff0000)
      for (const sphere of this._controlSpheres) {
        sphere.visible = true
        sphere.scale.set(
          1. / this.scale.x, 1. / this.scale.y, 1. / this.scale.z
        )
      }

      // Find normal closest to camera
      const worldQuaternion = new THREE.Quaternion()
      this.getWorldQuaternion(worldQuaternion)
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      cameraDirection.applyQuaternion(worldQuaternion.inverse())
      let maxCloseness = 0
      for (const normal of faceNormals) {
        const closeness = -normal.dot(cameraDirection)
        if (closeness > maxCloseness) {
          this._closestFaceNormal.copy(normal)
          maxCloseness = closeness
        }
      }

      for (let i = 0; i < this._controlSpheres.length; i += 1) {
        const firstSign = (i % 2 === 0) ? 1 : -1
        const secondSign = (Math.floor(i / 2) === 0) ? 1 : -1
        if (this._closestFaceNormal.x !== 0) {
          this._controlSpheres[i].position.set(
            this._closestFaceNormal.x, firstSign, secondSign
          )
        } else if (this._closestFaceNormal.y !== 0) {
          this._controlSpheres[i].position.set(
             firstSign, this._closestFaceNormal.y, secondSign
          )
        } else {
          this._controlSpheres[i].position.set(
             firstSign, secondSign, this._closestFaceNormal.z
          )
        }
        this._controlSpheres[i].position.multiplyScalar(0.5)
      }
    } else {
      (this._outline.material as THREE.LineBasicMaterial).color.set(0xffffff)
      for (const sphere of this._controlSpheres) {
        sphere.visible = false
      }
    }

    // if (selected) {
    //   this.setColor(0xff0000)
    // } else {
    //   this.setColorFromRGB(this._color)
    // }

    // Check if shape already in scene
    for (const child of scene.children) {
      if (child === this) {
        return
      }
    }

    scene.add(this)
  }

  /**
   * Add/remove controls
   * @param control
   * @param show
   */
  public setControl (control: TransformationControl, show: boolean) {
    if (show) {
      this.add(control)
      this._control = control
      this._control.attach(this)
    } else if (this._control) {
      this._control.detach()
      this.remove(control)
      this._control = null
    }
  }

  /** Set highlighted */
  public setHighlighted (intersection?: THREE.Intersection) {
    for (const sphere of this._controlSpheres) {
      { (sphere.material as THREE.Material).opacity = 0.3 }
      { (sphere.material as THREE.Material).needsUpdate = true }
    }
    if (intersection) {
      this._highlighted = true
      for (const sphere of this._controlSpheres) {
        if (intersection.object === sphere) {
          this._highlightedSphere = sphere
          { (sphere.material as THREE.Material).opacity = 0.8 }
          break
        }
      }
    } else {
      this._highlighted = false
    }
  }

  /**
   * Override ThreeJS raycast to intersect with box
   * @param raycaster
   * @param intersects
   */
  public raycast (
    raycaster: THREE.Raycaster,
    intersects: THREE.Intersection[]
  ) {
    const newIntersects: THREE.Intersection[] = []
    if (this._control) {
      this._control.raycast(raycaster, newIntersects)
    }

    for (const sphere of this._controlSpheres) {
      sphere.raycast(raycaster, newIntersects)
    }

    if (newIntersects.length === 0) {
      this._box.raycast(raycaster, intersects)
    } else {
      for (const intersect of newIntersects) {
        intersects.push(intersect)
      }
    }
  }

  /**
   * Drag to mouse
   * @param projection
   */
  public drag (_projection: THREE.Ray) {
    if (!this._highlightedSphere) {
      return false
    }
    return false
  }

  /**
   * Returns true if control sphere is highlighted
   */
  public shouldDrag (): boolean {
    return this._highlightedSphere !== null
  }

  // /**
  //  * Set bbox face colors
  //  * @param color
  //  * @param faces
  //  */
  // private setColor (
  //   color: number,
  //   faces: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  // ) {
  //   const geometry = this._box.geometry as THREE.BoxGeometry
  //   for (const i of faces) {
  //     geometry.faces[i].color.set(color)
  //   }

  //   geometry.colorsNeedUpdate = true
  // }

  // /**
  //  * Set bbox face colors from RGB array
  //  * @param color
  //  * @param faces
  //  */
  // private setColorFromRGB (
  //   color: number[],
  //   faces: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  // ) {
  //   const geometry = this._box.geometry as THREE.BoxGeometry
  //   for (const i of faces) {
  //     geometry.faces[i].color.setRGB(color[0], color[1], color[2])
  //   }

  //   geometry.colorsNeedUpdate = true
  // }
}
