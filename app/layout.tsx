import type { Metadata } from "next";
import "./globals.css";
import { CommentSheetProvider } from "@/components/comment-sheet";
import { ImagePreviewProvider } from "@/components/image-preview";
import { MediaControllerProvider } from "@/components/media-controller";

export const metadata: Metadata = {
  title: {
    default: "毛球 - 温暖有爱的宠物社区",
    template: "%s | 毛球",
  },
  description: "毛球是一个记录、分享、交流萌宠生活的宠物社区，发现养宠知识、宠物日常和同城宠友。",
  metadataBase: new URL("https://maoqiu.space"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "毛球 - 温暖有爱的宠物社区",
    description: "记录萌宠日常，发现养宠知识，和同样喜欢毛孩子的人保持联结。",
    url: "https://maoqiu.space",
    siteName: "毛球",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "毛球",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "毛球 - 温暖有爱的宠物社区",
    description: "记录萌宠日常，发现养宠知识，和同样喜欢毛孩子的人保持联结。",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="text-slate-900 antialiased">
        <MediaControllerProvider>
          <ImagePreviewProvider>
            <CommentSheetProvider>{children}</CommentSheetProvider>
          </ImagePreviewProvider>
        </MediaControllerProvider>
      </body>
    </html>
  );
}
