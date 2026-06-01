export async function createSixGrid(files, options = {}) {
  const {
    size = 1080,

    // 白边宽度
    gap = 12,

    background = "#ffffff",

    format = "image/jpeg",
    quality = 0.95,

    download = true,
    fileName = "collage"
  } = options;

  if (!files || files.length !== 6) {
    throw new Error("必须上传6张图片");
  }

  const loadImage = file =>
    new Promise((resolve, reject) => {
      const url =
        file instanceof File
          ? URL.createObjectURL(file)
          : file;

      const img = new Image();

      img.onload = () => {
        if (file instanceof File) {
          URL.revokeObjectURL(url);
        }

        resolve(img);
      };

      img.onerror = reject;
      img.src = url;
    });

  const imgs = await Promise.all(
    files.map(loadImage)
  );

  const canvas =
    document.createElement("canvas");

  const ctx = canvas.getContext("2d");

  canvas.width = size;
  canvas.height = size;

  // 背景白色
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size, size);

  // 九宫格单元格尺寸
  const cell = (size - gap * 2) / 3;

  const x0 = 0;
  const x1 = cell + gap;
  const x2 = (cell + gap) * 2;

  const y0 = 0;
  const y1 = cell + gap;
  const y2 = (cell + gap) * 2;

  function drawCover(img, x, y, w, h) {
    const imgRatio =
      img.width / img.height;

    const boxRatio = w / h;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (imgRatio > boxRatio) {
      sw = img.height * boxRatio;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / boxRatio;
      sy = (img.height - sh) / 2;
    }

    ctx.save();

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      x,
      y,
      w,
      h
    );

    ctx.restore();
  }

  function drawMainGridGap() {
    ctx.save();

    ctx.fillStyle = background;
    ctx.fillRect(x2 - gap, y0, gap, cell * 2 + gap);
    ctx.fillRect(x1, y1 - gap, cell * 2 + gap, gap);

    ctx.restore();
  }

  const pos = {
    // 左侧三张
    img2: {
      x: x0,
      y: y0,
      w: cell,
      h: cell
    },

    img3: {
      x: x0,
      y: y1,
      w: cell,
      h: cell
    },

    img4: {
      x: x0,
      y: y2,
      w: cell,
      h: cell
    },

    // 主图
    img1: {
      x: x1,
      y: y0,
      w: cell * 2 + gap,
      h: cell * 2 + gap
    },

    // 底部两张
    img5: {
      x: x1,
      y: y2,
      w: cell,
      h: cell
    },

    img6: {
      x: x2,
      y: y2,
      w: cell,
      h: cell
    }
  };

  // 绘制顺序
  drawCover(
    imgs[1],
    pos.img2.x,
    pos.img2.y,
    pos.img2.w,
    pos.img2.h
  );

  drawCover(
    imgs[2],
    pos.img3.x,
    pos.img3.y,
    pos.img3.w,
    pos.img3.h
  );

  drawCover(
    imgs[3],
    pos.img4.x,
    pos.img4.y,
    pos.img4.w,
    pos.img4.h
  );

  drawCover(
    imgs[0],
    pos.img1.x,
    pos.img1.y,
    pos.img1.w,
    pos.img1.h
  );

  drawMainGridGap();

  drawCover(
    imgs[4],
    pos.img5.x,
    pos.img5.y,
    pos.img5.w,
    pos.img5.h
  );

  drawCover(
    imgs[5],
    pos.img6.x,
    pos.img6.y,
    pos.img6.w,
    pos.img6.h
  );

  const blob = await new Promise(resolve => {
    canvas.toBlob(
      resolve,
      format,
      quality
    );
  });

  if (download) {
    const ext =
      format === "image/webp"
        ? "webp"
        : "jpg";

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = `${fileName}.${ext}`;

    a.click();

    URL.revokeObjectURL(url);
  }

  return {
    blob,
    canvas,
    url: URL.createObjectURL(blob)
  };
}