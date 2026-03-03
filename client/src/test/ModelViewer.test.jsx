import { render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ModelViewer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('mounts and disposes the Three.js viewer cleanly', async () => {
    const sceneAdd = vi.fn()
    const rendererDispose = vi.fn()
    const controlsDispose = vi.fn()
    const controlsReset = vi.fn()

    vi.doMock('three', () => {
      class Vector3 {
        constructor(x = 0, y = 0, z = 0) {
          this.x = x
          this.y = y
          this.z = z
        }
      }

      return {
        Scene: class {
          constructor() {
            this.background = null
          }

          add = sceneAdd
        },
        Color: class {
          constructor(value) {
            this.value = value
          }
        },
        PerspectiveCamera: class {
          constructor() {
            this.position = { set: vi.fn() }
            this.near = 0
            this.far = 0
          }

          updateProjectionMatrix = vi.fn()
        },
        WebGLRenderer: class {
          constructor() {
            this.domElement = document.createElement('canvas')
          }

          setPixelRatio = vi.fn()
          setSize = vi.fn()
          setAnimationLoop = vi.fn()
          render = vi.fn()
          dispose = rendererDispose
        },
        PMREMGenerator: class {
          fromScene() {
            return { texture: 'env-texture' }
          }

          dispose = vi.fn()
        },
        DirectionalLight: class {
          constructor() {
            this.position = { set: vi.fn() }
          }
        },
        AmbientLight: class {},
        Box3: class {
          setFromObject() {
            return this
          }

          getSize() {
            return new Vector3(1, 2, 1)
          }

          getCenter() {
            return new Vector3(0, 0, 0)
          }
        },
        Vector3,
        SRGBColorSpace: 'srgb',
        ACESFilmicToneMapping: 'aces',
      }
    })

    vi.doMock('three/examples/jsm/controls/OrbitControls.js', () => ({
      OrbitControls: class {
        constructor() {
          this.target = { set: vi.fn() }
          this.enableDamping = false
          this.autoRotate = false
          this.autoRotateSpeed = 0
          this.minDistance = 0
          this.maxDistance = 0
        }

        update = vi.fn()
        reset = controlsReset
        dispose = controlsDispose
      },
    }))

    vi.doMock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
      GLTFLoader: class {
        load(_url, onLoad) {
          onLoad({
            scene: {
              position: { sub: vi.fn() },
              traverse: vi.fn(),
            },
          })
        }
      },
    }))

    vi.doMock('three/examples/jsm/environments/RoomEnvironment.js', () => ({
      RoomEnvironment: class {},
    }))

    const { ModelViewer } = await import('../components/ModelViewer')
    const { unmount } = render(<ModelViewer modelUrl="/api/tripo/tasks/task-1/model?variant=pbr_model" />)

    await waitFor(() => {
      expect(sceneAdd).toHaveBeenCalled()
    })

    unmount()

    expect(rendererDispose).toHaveBeenCalled()
    expect(controlsDispose).toHaveBeenCalled()
    expect(controlsReset).not.toHaveBeenCalled()
  })
})
