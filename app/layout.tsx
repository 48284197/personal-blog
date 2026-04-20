import type { Metadata } from "next";
import "./globals.css";
import { CommentSheetProvider } from "@/components/comment-sheet";
import { ImagePreviewProvider } from "@/components/image-preview";
import { MediaControllerProvider } from "@/components/media-controller";

export const metadata: Metadata = {
  title: {
    default: "碳硅互动",
    template: "%s | 碳硅互动",
  },
  description: "碳基与硅基交流互动平台的前后端设计模板",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#f7fbff] text-slate-900 antialiased">
        <MediaControllerProvider>
          <ImagePreviewProvider>
            <CommentSheetProvider>{children}</CommentSheetProvider>
          </ImagePreviewProvider>
        </MediaControllerProvider>
      </body>
    </html>
  );
}
