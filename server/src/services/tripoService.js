import { normalizeForTripo } from './imageTransformService.js'
import { parseImageDataUrl } from '../utils/dataUrl.js'
import { AppError } from '../utils/errors.js'

export const selectModelVariant = (task) => {
  if (task?.output?.rigged_model) {
    return { variant: 'rigged_model', remoteUrl: task.output.rigged_model }
  }

  if (task?.output?.pbr_model) {
    return { variant: 'pbr_model', remoteUrl: task.output.pbr_model }
  }

  if (task?.output?.model) {
    return { variant: 'model', remoteUrl: task.output.model }
  }

  if (task?.output?.base_model) {
    return { variant: 'base_model', remoteUrl: task.output.base_model }
  }

  return null
}

const buildTaskSummary = ({ taskId, task }) => {
  const selectedOutput = selectModelVariant(task)

  return {
    taskId,
    status: task?.status || 'unknown',
    progress: task?.progress ?? 0,
    error: task?.error_msg || null,
    outputs: selectedOutput
      ? {
          modelUrl: `/api/tripo/tasks/${taskId}/model?variant=${selectedOutput.variant}`,
          downloadUrl: `/api/tripo/tasks/${taskId}/model?variant=${selectedOutput.variant}`,
        }
      : null,
  }
}

export const createTripoService = ({ tripoClient, config }) => {
  const rigTaskBySourceTaskId = new Map()
  const sourceTaskByRigTaskId = new Map()
  const rigTaskStartPromises = new Map()

  const isMixamoRiggingEnabled = Boolean(config.tripoRigMixamo)

  const rememberRigTask = (sourceTaskId, rigTaskId) => {
    rigTaskBySourceTaskId.set(sourceTaskId, rigTaskId)
    sourceTaskByRigTaskId.set(rigTaskId, sourceTaskId)
  }

  const ensureRigTaskForSource = async (sourceTaskId) => {
    const existingRigTaskId = rigTaskBySourceTaskId.get(sourceTaskId)
    if (existingRigTaskId) {
      return existingRigTaskId
    }

    const inFlightPromise = rigTaskStartPromises.get(sourceTaskId)
    if (inFlightPromise) {
      return inFlightPromise
    }

    const startPromise = tripoClient
      .createRigTask({
        originalModelTaskId: sourceTaskId,
        outFormat: config.tripoRigFormat,
        rigType: config.tripoRigType,
        spec: config.tripoRigSpec,
        modelVersion: config.tripoRigModelVersion,
      })
      .then((rigTaskId) => {
        rememberRigTask(sourceTaskId, rigTaskId)
        rigTaskStartPromises.delete(sourceTaskId)
        return rigTaskId
      })
      .catch((error) => {
        rigTaskStartPromises.delete(sourceTaskId)
        throw error
      })

    rigTaskStartPromises.set(sourceTaskId, startPromise)
    return startPromise
  }

  const resolveTaskForOutput = async (taskId) => {
    const task = await tripoClient.getTask(taskId)
    const isRigTask = sourceTaskByRigTaskId.has(taskId) || task?.type === 'animate_rig'

    if (!isMixamoRiggingEnabled || isRigTask) {
      return { taskId, task }
    }

    if (task?.status !== 'success') {
      return { taskId, task }
    }

    const rigTaskId = await ensureRigTaskForSource(taskId)
    const rigTask = await tripoClient.getTask(rigTaskId)
    return { taskId: rigTaskId, task: rigTask }
  }

  return {
    async createTaskFromViews(viewDataUrls) {
      const orderedViewNames = ['front', 'back', 'left', 'right']
      const uploadedFiles = []

    for (const viewName of orderedViewNames) {
      const imageDataUrl = viewDataUrls?.[viewName]
      if (!imageDataUrl) {
        throw new AppError(`Missing ${viewName} image for Tripo generation.`, 400)
      }

      const { buffer } = parseImageDataUrl(imageDataUrl)
      const normalizedBuffer = await normalizeForTripo(buffer)
      const uploadToken = await tripoClient.uploadImageBuffer(normalizedBuffer, 'image/jpeg')
      uploadedFiles.push(uploadToken)
    }

    const taskId = await tripoClient.createMultiviewTask({
      files: uploadedFiles,
      options: {
        model_version: config.tripoModelVersion,
        texture: config.tripoTexture,
        pbr: config.tripoPbr,
        texture_quality: config.tripoTextureQuality,
        texture_alignment: config.tripoTextureAlignment,
        orientation: config.tripoOrientation,
      },
    })

      return {
        taskId,
        status: 'queued',
      }
    },
    async createTaskFromFrontView(imageDataUrl) {
      if (!imageDataUrl) {
        throw new AppError('Missing front image for Tripo generation.', 400)
      }

      const { buffer } = parseImageDataUrl(imageDataUrl)
      const normalizedBuffer = await normalizeForTripo(buffer)
      const uploadToken = await tripoClient.uploadImageBuffer(normalizedBuffer, 'image/jpeg')
      const taskId = await tripoClient.createImageTask({
        file: {
          type: 'image',
          file_token: uploadToken.file_token,
        },
        options: {
          model_version: config.tripoModelVersion,
          texture: config.tripoTexture,
          pbr: config.tripoPbr,
          texture_quality: config.tripoTextureQuality,
          texture_alignment: config.tripoTextureAlignment,
          orientation: config.tripoOrientation,
        },
      })

      return {
        taskId,
        status: 'queued',
      }
    },
    async getTaskSummary(taskId) {
      const resolvedTask = await resolveTaskForOutput(taskId)
      return buildTaskSummary(resolvedTask)
    },
    async getModelAsset(taskId, requestedVariant) {
      const resolvedTask = await resolveTaskForOutput(taskId)
      const selectedOutput = selectModelVariant(resolvedTask.task)

      if (!selectedOutput) {
        throw new AppError('No model file is available for this task yet.', 404)
      }

      const variantToUse =
        requestedVariant && resolvedTask.task?.output?.[requestedVariant]
          ? { variant: requestedVariant, remoteUrl: resolvedTask.task.output[requestedVariant] }
          : selectedOutput

      return {
        ...variantToUse,
        response: await tripoClient.fetchRemoteAsset(variantToUse.remoteUrl),
      }
    },
  }
}
