'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

type MediaControllerContextValue = {
  activeMediaId: string | null
  setActiveMediaId: (mediaId: string | null) => void
  playbackPositions: Record<string, number>
  setPlaybackPosition: (mediaId: string, position: number) => void
}

const MediaControllerContext = createContext<MediaControllerContextValue | null>(null)

export function MediaControllerProvider({ children }: { children: ReactNode }) {
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null)
  const [playbackPositions, setPlaybackPositions] = useState<Record<string, number>>({})

  const updatePlaybackPosition = useCallback((mediaId: string, position: number) => {
    setPlaybackPositions((current) => ({
      ...current,
      [mediaId]: position,
    }))
  }, [])

  const value = useMemo(
    () => ({
      activeMediaId,
      setActiveMediaId,
      playbackPositions,
      setPlaybackPosition: updatePlaybackPosition,
    }),
    [activeMediaId, playbackPositions, updatePlaybackPosition]
  )

  return (
    <MediaControllerContext.Provider value={value}>
      {children}
    </MediaControllerContext.Provider>
  )
}

export function useMediaController() {
  const context = useContext(MediaControllerContext)
  if (!context) {
    throw new Error('useMediaController must be used within MediaControllerProvider')
  }

  return context
}

export function useExclusiveMediaPlayback<T extends HTMLMediaElement>(
  mediaId: string,
  ref: RefObject<T | null>
) {
  const { activeMediaId, setActiveMediaId } = useMediaController()

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (activeMediaId && activeMediaId !== mediaId && !element.paused) {
      element.pause()
    }
  }, [activeMediaId, mediaId, ref])

  const pauseMedia = () => {
    const element = ref.current
    if (!element) return

    element.pause()
    if (activeMediaId === mediaId) {
      setActiveMediaId(null)
    }
  }

  const requestToggle = async () => {
    const element = ref.current
    if (!element) return

    if (element.paused) {
      setActiveMediaId(mediaId)
      void element.play().catch(() => {
        setActiveMediaId(null)
      })
      return
    }

    pauseMedia()
  }

  return {
    activeMediaId,
    requestToggle,
  }
}
