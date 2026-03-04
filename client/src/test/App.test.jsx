import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import {
  createTripoFrontTask,
  createTripoTask,
  generateMultiview,
  generatePortrait,
  getTripoTask,
} from '../api/characterApi'

vi.mock('../api/characterApi', () => ({
  generatePortrait: vi.fn(),
  generateMultiview: vi.fn(),
  createTripoTask: vi.fn(),
  createTripoFrontTask: vi.fn(),
  getTripoTask: vi.fn(),
}))

vi.mock('../components/ModelViewer', () => ({
  ModelViewer: ({ modelUrl }) => <div data-testid="viewer-stub">{modelUrl}</div>,
}))

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    vi.useRealTimers()
    window.localStorage.clear()
  })

  it('keeps Create 3D Model disabled until turnaround exists', () => {
    render(<App />)

    expect(screen.getByRole('button', { name: 'Create 3D Model' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create 3D From Front View' })).toBeDisabled()
  })

  it('supports prompt-only portrait generation', async () => {
    generatePortrait.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
      promptUsed: 'stylized pilot',
      inputMode: 'prompt',
      normalizedReferenceImageDataUrl: null,
    })

    render(<App />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Character prompt'), 'stylized pilot')
    await user.click(screen.getAllByRole('button', { name: 'Generate Portrait' })[0])

    await waitFor(() => {
      expect(generatePortrait).toHaveBeenCalledWith({
        prompt: 'stylized pilot',
        referenceImage: null,
      })
    })
  })

  it('supports image-only portrait generation', async () => {
    generatePortrait.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
      promptUsed: 'fallback',
      inputMode: 'image',
      normalizedReferenceImageDataUrl: 'data:image/png;base64,cmVm',
    })

    const { container } = render(<App />)
    const user = userEvent.setup()
    const file = new File(['abc'], 'reference.png', { type: 'image/png' })

    await user.upload(container.querySelector('input[type="file"]'), file)
    await user.click(screen.getAllByRole('button', { name: 'Generate Portrait' })[0])

    await waitFor(() => {
      expect(generatePortrait).toHaveBeenCalledWith({
        prompt: '',
        referenceImage: file,
      })
    })
  })

  it('supports generating only the front view and enabling front-view 3D creation', async () => {
    generatePortrait.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
      promptUsed: 'pilot',
      inputMode: 'prompt',
      normalizedReferenceImageDataUrl: null,
    })
    generateMultiview.mockResolvedValue({
      mode: 'front-only',
      views: {
        front: { imageDataUrl: 'data:image/png;base64,Zm9v', source: 'gemini' },
        back: { imageDataUrl: '', source: 'front-test' },
        left: { imageDataUrl: '', source: 'front-test' },
        right: { imageDataUrl: '', source: 'front-test' },
      },
    })

    render(<App />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Character prompt'), 'pilot')
    await user.click(screen.getAllByRole('button', { name: 'Generate Portrait' })[0])
    await waitFor(() => expect(generatePortrait).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Generate Only Front View' }))

    await waitFor(() => {
      expect(generateMultiview).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'front-only',
        }),
      )
    })

    expect(screen.getByRole('button', { name: 'Create 3D Model' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create 3D From Front View' })).toBeEnabled()
    expect(screen.getByText(/Front test generated/i)).toBeInTheDocument()
  })

  it('supports creating a Tripo task from the front view only', async () => {
    generatePortrait.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
      promptUsed: 'pilot',
      inputMode: 'prompt',
      normalizedReferenceImageDataUrl: null,
    })
    generateMultiview.mockResolvedValue({
      mode: 'front-only',
      views: {
        front: { imageDataUrl: 'data:image/png;base64,Zm9v', source: 'gemini' },
        back: { imageDataUrl: '', source: 'front-test' },
        left: { imageDataUrl: '', source: 'front-test' },
        right: { imageDataUrl: '', source: 'front-test' },
      },
    })
    createTripoFrontTask.mockResolvedValue({
      taskId: 'task-front-1',
      status: 'queued',
    })

    render(<App />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Character prompt'), 'pilot')
    await user.click(screen.getAllByRole('button', { name: 'Generate Portrait' })[0])
    await waitFor(() => expect(generatePortrait).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Generate Only Front View' }))
    await waitFor(() => expect(generateMultiview).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Create 3D From Front View' }))

    await waitFor(() => {
      expect(createTripoFrontTask).toHaveBeenCalledWith({
        imageDataUrl: 'data:image/png;base64,Zm9v',
      })
    })
  })

  it('supports forcing a Tripo result refresh', async () => {
    createTripoTask.mockResolvedValue({
      taskId: 'task-2',
      status: 'queued',
    })
    getTripoTask.mockResolvedValue({
      taskId: 'task-2',
      status: 'success',
      progress: 100,
      error: '',
      outputs: {
        modelUrl: '/api/tripo/tasks/task-2/model?variant=pbr_model',
        downloadUrl: '/api/tripo/tasks/task-2/model?variant=pbr_model',
      },
    })

    render(<App />)
    const user = userEvent.setup()

    generatePortrait.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
      promptUsed: 'pilot',
      inputMode: 'prompt',
      normalizedReferenceImageDataUrl: null,
    })
    generateMultiview.mockResolvedValue({
      mode: 'full',
      views: {
        front: { imageDataUrl: 'data:image/png;base64,Zm9v', source: 'gemini' },
        back: { imageDataUrl: 'data:image/png;base64,YmFy', source: 'gemini' },
        left: { imageDataUrl: 'data:image/png;base64,YmF6', source: 'gemini' },
        right: { imageDataUrl: 'data:image/png;base64,cXV4', source: 'mirrored-left' },
      },
    })

    await user.type(screen.getByLabelText('Character prompt'), 'pilot')
    await user.click(screen.getAllByRole('button', { name: 'Generate Portrait' })[0])
    await waitFor(() => expect(generatePortrait).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Generate Turnaround' }))
    await waitFor(() => expect(generateMultiview).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Create 3D Model' }))
    await waitFor(() => expect(createTripoTask).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Force Pull Result' }))

    await waitFor(() => {
      expect(getTripoTask).toHaveBeenCalledWith('task-2')
      expect(screen.getByRole('button', { name: 'Download GLB' })).toBeEnabled()
    })
  })

  it('restores persisted Tripo task state after refresh', async () => {
    window.localStorage.setItem(
      'ww-character-session-v1',
      JSON.stringify({
        currentRunId: 'run-1',
        history: [
          {
            id: 'run-1',
            createdAt: '2026-03-04T00:00:00.000Z',
            promptSummary: 'Recovered pilot',
            inputMode: 'prompt',
            tripoTaskId: 'task-restore',
            tripoStatus: 'success',
            modelUrl: '/api/tripo/tasks/task-restore/model?variant=pbr_model',
          },
        ],
        tripoJob: {
          taskId: 'task-restore',
          status: 'success',
          progress: 100,
          error: '',
          outputs: {
            modelUrl: '/api/tripo/tasks/task-restore/model?variant=pbr_model',
            downloadUrl: '/api/tripo/tasks/task-restore/model?variant=pbr_model',
          },
        },
      }),
    )

    render(<App />)

    expect(screen.getByText(/Recovered pilot/i)).toBeInTheDocument()
    expect(screen.getByText(/Task task-restore - 100%/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download GLB' })).toBeEnabled()
      expect(screen.getByTestId('viewer-stub')).toHaveTextContent(
        '/api/tripo/tasks/task-restore/model?variant=pbr_model',
      )
    })
  })

  it('restores rich panel state from local storage immediately on load', async () => {
    window.localStorage.setItem(
      'ww-character-session-v1',
      JSON.stringify({
        prompt: 'sleek android',
        multiviewPrompt: 'orthographic prompt',
        portraitResult: {
          imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
          promptUsed: 'sleek android',
          inputMode: 'prompt',
          originalReferenceImageDataUrl: '',
        },
        multiviewResult: {
          mode: 'full',
          views: {
            front: { imageDataUrl: 'data:image/png;base64,Zm9v', source: 'gemini' },
            back: { imageDataUrl: 'data:image/png;base64,YmFy', source: 'gemini' },
            left: { imageDataUrl: 'data:image/png;base64,YmF6', source: 'gemini' },
            right: { imageDataUrl: 'data:image/png;base64,cXV4', source: 'mirrored-left' },
          },
        },
        currentRunId: 'run-2',
        history: [],
        tripoJob: {
          taskId: 'task-rich',
          status: 'success',
          progress: 100,
          error: '',
          outputs: {
            modelUrl: '/api/tripo/tasks/task-rich/model?variant=pbr_model',
            downloadUrl: '/api/tripo/tasks/task-rich/model?variant=pbr_model',
          },
        },
      }),
    )

    render(<App />)

    expect(screen.getByDisplayValue('sleek android')).toBeInTheDocument()
    expect(screen.getByAltText('Generated character portrait')).toBeInTheDocument()
    expect(screen.getByText('Front')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('viewer-stub')).toHaveTextContent(
        '/api/tripo/tasks/task-rich/model?variant=pbr_model',
      )
    })
  })

  it('polls Tripo task status from queued to success', async () => {
    generatePortrait.mockResolvedValue({
      imageDataUrl: 'data:image/png;base64,cG9ydHJhaXQ=',
      promptUsed: 'pilot',
      inputMode: 'prompt',
      normalizedReferenceImageDataUrl: null,
    })
    generateMultiview.mockResolvedValue({
      mode: 'full',
      views: {
        front: { imageDataUrl: 'data:image/png;base64,Zm9v', source: 'gemini' },
        back: { imageDataUrl: 'data:image/png;base64,YmFy', source: 'gemini' },
        left: { imageDataUrl: 'data:image/png;base64,YmF6', source: 'gemini' },
        right: { imageDataUrl: 'data:image/png;base64,cXV4', source: 'mirrored-left' },
      },
    })
    createTripoTask.mockResolvedValue({
      taskId: 'task-1',
      status: 'queued',
    })
    getTripoTask
      .mockResolvedValueOnce({
        taskId: 'task-1',
        status: 'running',
        progress: 48,
        error: '',
        outputs: null,
      })
      .mockResolvedValueOnce({
        taskId: 'task-1',
        status: 'success',
        progress: 100,
        error: '',
        outputs: {
          modelUrl: '/api/tripo/tasks/task-1/model?variant=pbr_model',
          downloadUrl: '/api/tripo/tasks/task-1/model?variant=pbr_model',
        },
      })

    render(<App />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Character prompt'), 'pilot')
    await user.click(screen.getAllByRole('button', { name: 'Generate Portrait' })[0])
    await waitFor(() => expect(generatePortrait).toHaveBeenCalled())

    const turnaroundButton = screen.getByRole('button', { name: 'Generate Turnaround' })
    await waitFor(() => expect(turnaroundButton).toBeEnabled())
    await user.click(turnaroundButton)
    await waitFor(() => expect(generateMultiview).toHaveBeenCalled())

    const createButton = screen.getByRole('button', { name: 'Create 3D Model' })
    expect(createButton).toBeEnabled()

    await user.click(createButton)
    await waitFor(() => expect(createTripoTask).toHaveBeenCalled())

    await waitFor(() => {
      expect(screen.getByTestId('viewer-stub')).toHaveTextContent(
        '/api/tripo/tasks/task-1/model?variant=pbr_model',
      )
      expect(screen.getByRole('button', { name: 'Download GLB' })).toBeEnabled()
    }, { timeout: 9000 })

    expect(getTripoTask).toHaveBeenCalledTimes(2)
  }, 12000)
})
