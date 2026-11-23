/*
 * Sólo las piezas de three.js que usa `Phone3D`. Importar `three` entero con `import('three')`
 * deja el namespace completo en el bundle (loaders, animación, audio, XR…); con re-exports
 * nombrados el bundler puede descartar el resto. Si el modelo usa una clase nueva, agregala acá.
 */
export {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  RingGeometry,
  Scene,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from 'three'
export { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
export { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
