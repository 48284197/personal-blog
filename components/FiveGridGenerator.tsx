"use client";

import { useEffect, useMemo, useState } from "react";
import { createSixGrid } from "@/lib/createFiveGrid";

export default function FiveGridGenerator() {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string>();
  const [generatedBlob, setGeneratedBlob] = useState<Blob>();
  const [dragIndex, setDragIndex] = useState<number>();
  const [publishing, setPublishing] = useState(false);

  const thumbs = useMemo(
    () =>
      files.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      thumbs.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [thumbs]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const resetGenerated = () => {
    setPreview(undefined);
    setGeneratedBlob(undefined);
  };

  const handleFiles = (list: FileList | null) => {
    if (!list) return;

    const arr = [...list].slice(0, 6);

    setFiles(arr);
    resetGenerated();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    handleFiles(e.dataTransfer.files);
  };

  const moveFile = (from: number, to: number) => {
    setFiles((current) => {
      const next = [...current];
      const [target] = next.splice(from, 1);

      next.splice(to, 0, target);

      return next;
    });

    resetGenerated();
  };

  const generate = async () => {
    if (files.length !== 6) {
      alert("请上传6张图片");
      return;
    }

    const result = await createSixGrid(files, {
      format: "image/jpeg",
      download: false,
    });

    setPreview(result.url);
    setGeneratedBlob(result.blob);
  };

  const download = async () => {
    if (files.length !== 6) {
      alert("请上传6张图片");
      return;
    }

    await createSixGrid(files, {
      format: "image/jpeg",
      fileName: "xiaohongshu-collage",
      download: true,
    });
  };

  const share = async () => {
    if (!generatedBlob) {
      alert("请先生成预览");
      return;
    }

    setPublishing(true);

    try {
      const file = new File(
        [generatedBlob],
        "xiaohongshu-collage.jpg",
        {
          type: "image/jpeg",
        }
      );

      const formData = new FormData();
      formData.append("files", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("图片上传失败");
      }

      const uploadData = await uploadResponse.json() as {
        files?: Array<{ url: string }>;
      };
      const imageUrl = uploadData.files?.[0]?.url;

      if (!imageUrl) {
        throw new Error("没有获取到图片地址");
      }

      const publishResponse = await fetch("/api/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: "daily",
          content: "分享一张刚生成的九宫格图片",
          mediaType: "image",
          mediaImages: [imageUrl],
          mediaSrc: imageUrl,
          tags: ["九宫格", "图片分享"],
        }),
      });

      if (!publishResponse.ok) {
        throw new Error("发布到社区失败");
      }

      alert("已发布到社区");
    } catch (error) {
      alert(error instanceof Error ? error.message : "发布到社区失败");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div
            className="flex h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 text-center transition hover:border-neutral-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <label className="cursor-pointer space-y-2">
              <input
                hidden
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
              />

              <p className="text-base font-medium">
                上传6张图片
              </p>

              <p className="text-sm text-neutral-500">
                拖拽到这里，或点击选择
              </p>
            </label>
          </div>

          <div className="rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium">
                图片顺序
              </span>

              <span className="text-neutral-500">
                {files.length}/6
              </span>
            </div>

            {files.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {thumbs.map((item, index) => (
                  <div
                    key={`${item.file.name}-${item.file.lastModified}-${index}`}
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(index);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();

                      if (
                        dragIndex !== undefined &&
                        dragIndex !== index
                      ) {
                        moveFile(dragIndex, index);
                      }

                      setDragIndex(undefined);
                    }}
                    onDragEnd={() => setDragIndex(undefined)}
                    className="group relative cursor-move overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                  >
                    <img
                      src={item.url}
                      alt={`第${index + 1}张图片`}
                      className="aspect-square w-full object-cover transition group-hover:scale-105"
                    />

                    <div className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                上传后可拖拽图片调整顺序
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={generate}
              className="rounded-xl bg-black px-4 py-3 text-sm text-white transition hover:bg-neutral-800"
            >
              生成
            </button>

            <button
              onClick={download}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm transition hover:border-neutral-500"
            >
              导出
            </button>

            <button
              onClick={share}
              disabled={publishing}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? "发布中" : "发社区"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium">
                生成结果
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                生成后可下载或发布到社区
              </p>
            </div>
          </div>

          {preview ? (
            <img
              src={preview}
              alt="生成后的九宫格图片"
              className="mx-auto w-full max-w-[560px]"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-neutral-50 text-sm text-neutral-500">
              预览会显示在这里
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
