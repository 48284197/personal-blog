import type { CSSProperties, ImgHTMLAttributes } from 'react'

type AppImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  src: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  unoptimized?: boolean
}

export default function AppImage({
  fill,
  priority,
  unoptimized: _unoptimized,
  style,
  ...props
}: AppImageProps) {
  const fillStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style

  return (
    // eslint-disable-next-line @eslint-react/dom/no-missing-img-attrs
    <img
      {...props}
      style={fillStyle}
      loading={priority ? 'eager' : props.loading}
      fetchPriority={priority ? 'high' : props.fetchPriority}
    />
  )
}
