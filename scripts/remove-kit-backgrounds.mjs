import { createRequire } from "node:module";
import { readdir } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const kitDirectory = path.resolve(process.argv[2] ?? "public/kits");
const requestedFiles = process.argv.slice(3);

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)];
}

function estimateBackground(data, width, height, channels) {
  const red = [];
  const green = [];
  const blue = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 240));

  const sample = (x, y) => {
    const offset = (y * width + x) * channels;
    red.push(data[offset]);
    green.push(data[offset + 1]);
    blue.push(data[offset + 2]);
  };

  for (let x = 0; x < width; x += step) {
    sample(x, 0);
    sample(x, height - 1);
  }

  for (let y = step; y < height - step; y += step) {
    sample(0, y);
    sample(width - 1, y);
  }

  return {
    red: median(red),
    green: median(green),
    blue: median(blue),
  };
}

function removeEdgeConnectedBackground(data, width, height, channels) {
  const background = estimateBackground(data, width, height, channels);
  const backgroundLightness =
    (background.red + background.green + background.blue) / 3;
  const tolerance = backgroundLightness > 240 ? 48 : 34;
  const toleranceSquared = tolerance * tolerance;
  const softStart = 5;
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let queueStart = 0;
  let queueEnd = 0;

  const distanceSquared = (pixelIndex) => {
    const offset = pixelIndex * channels;
    const red = data[offset] - background.red;
    const green = data[offset + 1] - background.green;
    const blue = data[offset + 2] - background.blue;
    return red * red + green * green + blue * blue;
  };

  const enqueue = (pixelIndex) => {
    if (visited[pixelIndex] || distanceSquared(pixelIndex) > toleranceSquared) {
      return;
    }

    visited[pixelIndex] = 1;
    queue[queueEnd] = pixelIndex;
    queueEnd += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }

  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (queueStart < queueEnd) {
    const pixelIndex = queue[queueStart];
    queueStart += 1;
    const x = pixelIndex % width;

    if (x > 0) enqueue(pixelIndex - 1);
    if (x < width - 1) enqueue(pixelIndex + 1);
    if (pixelIndex >= width) enqueue(pixelIndex - width);
    if (pixelIndex < pixelCount - width) enqueue(pixelIndex + width);
  }

  const output = Buffer.allocUnsafe(pixelCount * 4);
  let transparentPixels = 0;

  for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex += 1) {
    const sourceOffset = pixelIndex * channels;
    const outputOffset = pixelIndex * 4;

    output[outputOffset] = data[sourceOffset];
    output[outputOffset + 1] = data[sourceOffset + 1];
    output[outputOffset + 2] = data[sourceOffset + 2];

    if (!visited[pixelIndex]) {
      output[outputOffset + 3] = 255;
      continue;
    }

    const distance = Math.sqrt(distanceSquared(pixelIndex));
    const alpha = Math.round(
      Math.max(0, Math.min(1, (distance - softStart) / (tolerance - softStart))) *
        255,
    );
    output[outputOffset + 3] = alpha;

    if (alpha < 8) transparentPixels += 1;
  }

  return {
    background,
    output,
    tolerance,
    transparentRatio: transparentPixels / pixelCount,
  };
}

async function processKit(filename) {
  const inputPath = path.join(kitDirectory, filename);
  const outputPath = path.join(
    kitDirectory,
    `${path.basename(filename, path.extname(filename))}.webp`,
  );
  const { data, info } = await sharp(inputPath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const result = removeEdgeConnectedBackground(
    data,
    info.width,
    info.height,
    info.channels,
  );

  await sharp(result.output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .webp({ alphaQuality: 100, nearLossless: true, quality: 96 })
    .toFile(outputPath);

  return {
    background: result.background,
    filename,
    output: path.basename(outputPath),
    tolerance: result.tolerance,
    transparent: `${(result.transparentRatio * 100).toFixed(1)}%`,
  };
}

const directoryFiles = await readdir(kitDirectory);
const filenames = (requestedFiles.length > 0 ? requestedFiles : directoryFiles)
  .filter((filename) => /\.jpe?g$/i.test(filename))
  .sort();

for (const filename of filenames) {
  console.log(await processKit(filename));
}
