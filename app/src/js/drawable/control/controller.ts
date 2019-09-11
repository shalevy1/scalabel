import * as THREE from 'three'

export interface ControlUnit extends THREE.Object3D {
  /** get update vectors: [translation, rotation, scale, new intersection] */
  getDelta: (
    oldIntersection: THREE.Vector3,
    newProjection: THREE.Ray,
    dragPlane: THREE.Plane,
    local: boolean
  ) => [THREE.Vector3, THREE.Quaternion, THREE.Vector3, THREE.Vector3]
  /** set highlight */
  setHighlighted: (intersection ?: THREE.Intersection) => boolean
}

/**
 * Super class for all controllers
 */
export abstract class Controller extends THREE.Object3D {
  /** translation axes */
  protected _controlUnits: ControlUnit[]
  /** current axis being dragged */
  protected _highlightedUnit: ControlUnit | null
  /** camera */
  protected _camera: THREE.Camera
  /** Object to modify */
  protected _object: THREE.Object3D | null
  /** local or world */
  protected _local: boolean
  /** original intersection point */
  protected _intersectionPoint: THREE.Vector3
  /** Plane of intersection point w/ camera direction */
  protected _dragPlane: THREE.Plane
  /** previous projection */
  protected _projection: THREE.Ray

  constructor (camera: THREE.Camera) {
    super()
    this._controlUnits = []
    this._camera = camera
    this._object = null
    this._local = true
    this._intersectionPoint = new THREE.Vector3()
    this._highlightedUnit = null
    this._dragPlane = new THREE.Plane()
    this._projection = new THREE.Ray()
  }

  /** highlight function */
  public setHighlighted (intersection?: THREE.Intersection) {
    this._highlightedUnit = null
    for (const axis of this._controlUnits) {
      if (axis.setHighlighted(intersection) && intersection) {
        this._highlightedUnit = axis
        this._intersectionPoint = intersection.point
      }
    }
  }

  /** mouse down */
  public onMouseDown () {
    if (this._highlightedUnit && this._object) {
      const normal = new THREE.Vector3()
      this._camera.getWorldDirection(normal)
      this._dragPlane.setFromNormalAndCoplanarPoint(
        normal,
        this._intersectionPoint
      )
    }
  }

  /** mouse move */
  public onMouseMove (projection: THREE.Ray) {
    if (this._highlightedUnit && this._dragPlane && this._object) {
      const [
        delta,
        quaternion,
        multiplier,
        newIntersection
      ] = this._highlightedUnit.getDelta(
        this._intersectionPoint,
        projection,
        this._dragPlane,
        this._local
      )
      this._object.position.add(delta)
      this._object.applyQuaternion(quaternion)
      this._object.scale.multiply(multiplier)

      this._intersectionPoint.copy(newIntersection)
    }
    this._projection.copy(projection)
  }

  /** mouse up */
  public onMouseUp () {
    return
  }

  /** raycast */
  public raycast (
    raycaster: THREE.Raycaster, intersects: THREE.Intersection[]
  ) {
    for (const unit of this._controlUnits) {
      unit.raycast(raycaster, intersects)
    }
  }

  /** attach to object */
  public attach (object: THREE.Object3D) {
    this._object = object
    if (this._local) {
      this.quaternion.set(0, 0, 0, 1)
      this.rotation.setFromQuaternion(this.quaternion)
    } else if (this.parent) {
      const quaternion = new THREE.Quaternion()
      this.parent.getWorldQuaternion(quaternion)
      this.quaternion.copy(quaternion.inverse())
      this.rotation.setFromQuaternion(this.quaternion)
    }
    this.updateMatrix()
    this.updateMatrixWorld(true)
  }

  /** detach */
  public detach () {
    this._object = null
  }

  /** Toggle local/world */
  public toggleFrame () {
    if (this._object) {
      this._local = !this._local
      this.attach(this._object)
    }
  }
}
