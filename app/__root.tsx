import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import appCss from './globals.css?url'
import { CommentSheetProvider } from '@/components/comment-sheet'
import { ErrorPage } from '@/components/error-page'
import { ImagePreviewProvider } from '@/components/image-preview'
import { MediaControllerProvider } from '@/components/media-controller'
import { NotFoundPage } from '@/components/not-found-page'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '毛球 - 温暖有爱的宠物社区' },
      {
        name: 'description',
        content: '毛球是一个记录、分享、交流萌宠生活的宠物社区，发现养宠知识、宠物日常和同城宠友。',
      },
      { property: 'og:title', content: '毛球 - 温暖有爱的宠物社区' },
      {
        property: 'og:description',
        content: '记录萌宠日常，发现养宠知识，和同样喜欢毛孩子的人保持联结。',
      },
      { property: 'og:url', content: 'https://maoqiu.space' },
      { property: 'og:site_name', content: '毛球' },
      { property: 'og:locale', content: 'zh_CN' },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: 'https://maoqiu.space/logo.png' },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: '毛球 - 温暖有爱的宠物社区' },
      {
        name: 'twitter:description',
        content: '记录萌宠日常，发现养宠知识，和同样喜欢毛孩子的人保持联结。',
      },
      { name: 'twitter:image', content: 'https://maoqiu.space/logo.png' },
    ],
    links: [
      { rel: 'canonical', href: 'https://maoqiu.space/' },
      { rel: 'stylesheet', href: appCss },
    ],
  }),
  component: RootLayout,
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,
})

function RootLayout() {
  return (
    <html lang="zh-CN">
      <head>
        <HeadContent />
      </head>
      <body className="text-slate-900 antialiased">
        <MediaControllerProvider>
          <ImagePreviewProvider>
            <CommentSheetProvider>
              <Outlet />
            </CommentSheetProvider>
          </ImagePreviewProvider>
        </MediaControllerProvider>
        <Scripts />
      </body>
    </html>
  )
}
