import { canAddFrame, createFrame } from '../core/frameFactory'
import { canAddLayer, createLayer } from '../core/layerFactory'
import { resizeGrid } from '../core/pixelGrid'
import type { CanvasSize, PixelProject } from '../core/types'

export function withCanvasSize(project: PixelProject, size: CanvasSize): PixelProject {
  return {
    ...project,
    canvasSize: size,
    frames: project.frames.map((f) => ({
      ...f,
      layers: f.layers.map((l) => ({
        ...l,
        pixels: resizeGrid(l.pixels, project.canvasSize, size),
      })),
    })),
  }
}

export function clampIndex(index: number, count: number): number {
  if (count <= 0) return 0
  const normalized = Number.isFinite(index) ? Math.trunc(index) : 0
  return Math.min(Math.max(normalized, 0), count - 1)
}

export function withActiveLayer(project: PixelProject, index: number): PixelProject {
  const frame = project.frames[project.activeFrameIndex]
  return {
    ...project,
    activeLayerIndex: clampIndex(index, frame?.layers.length ?? 0),
  }
}

export function withActiveFrame(project: PixelProject, frameIndex: number): PixelProject {
  const frame = project.frames[frameIndex]
  if (!frame) return project
  return {
    ...project,
    activeFrameIndex: frameIndex,
    activeLayerIndex: clampIndex(project.activeLayerIndex, frame.layers.length),
  }
}

export function normalizeProjectIndexes(project: PixelProject): PixelProject {
  if (project.frames.length === 0) {
    return { ...project, activeFrameIndex: 0, activeLayerIndex: 0 }
  }
  const activeFrameIndex = clampIndex(project.activeFrameIndex, project.frames.length)
  const frame = project.frames[activeFrameIndex]
  return {
    ...project,
    activeFrameIndex,
    activeLayerIndex: clampIndex(project.activeLayerIndex, frame?.layers.length ?? 0),
  }
}

export function withFrameLayers(
  project: PixelProject,
  frameIndex: number,
  layers: PixelProject['frames'][0]['layers'],
): PixelProject {
  const frames = project.frames.map((f, i) => (i === frameIndex ? { ...f, layers } : f))
  return { ...project, frames }
}

export function addLayerToActiveFrame(project: PixelProject): PixelProject | null {
  const frame = project.frames[project.activeFrameIndex]
  if (!frame || !canAddLayer(frame.layers)) return null
  const layers = [...frame.layers, createLayer(project.canvasSize)]
  return {
    ...withFrameLayers(project, project.activeFrameIndex, layers),
    activeLayerIndex: layers.length - 1,
  }
}

export function toggleLayerVisibility(
  project: PixelProject,
  layerIndex: number,
): PixelProject {
  const frame = project.frames[project.activeFrameIndex]
  if (!frame) return project
  const layers = frame.layers.map((l, i) =>
    i === layerIndex ? { ...l, visible: !l.visible } : l,
  )
  return withFrameLayers(project, project.activeFrameIndex, layers)
}

export function deleteLayerAt(project: PixelProject, layerIndex: number): PixelProject {
  const frame = project.frames[project.activeFrameIndex]
  if (!frame || frame.layers.length <= 1) return project
  const layers = frame.layers.filter((_, i) => i !== layerIndex)
  const activeLayerIndex = clampIndex(project.activeLayerIndex, layers.length)
  return {
    ...withFrameLayers(project, project.activeFrameIndex, layers),
    activeLayerIndex,
  }
}

export function addFrameToProject(project: PixelProject): PixelProject | null {
  if (!canAddFrame(project.frames)) return null
  const frames = [...project.frames, createFrame(project.canvasSize, `帧 ${project.frames.length + 1}`)]
  return withActiveFrame({ ...project, frames }, frames.length - 1)
}

export function deleteFrameAt(project: PixelProject, index: number): PixelProject {
  if (project.frames.length <= 1) return project
  const frames = project.frames.filter((_, i) => i !== index)
  let activeFrameIndex = project.activeFrameIndex
  if (activeFrameIndex === index) {
    activeFrameIndex = Math.min(index, frames.length - 1)
  } else if (activeFrameIndex > index) {
    activeFrameIndex -= 1
  }
  return withActiveFrame({ ...project, frames }, activeFrameIndex)
}
