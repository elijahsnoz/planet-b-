import "server-only";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

/**
 * Image ingest pipeline. Uploaded pictures are EXIF-rotated, capped to a sane
 * archival size, and re-encoded as high-quality progressive JPEG (mozjpeg) so the
 * stored asset is small and consistent — next/image still serves AVIF/WebP
 * derivatives on the wire. Returns the web path plus the metadata the media
 * record needs (dimensions, bytes, mime, sha256).
 *
 * Files land in /public/media/uploads (served statically). This requires a
 * writable disk — fine on a Node host; a serverless target would swap this for
 * an object-storage put without changing callers.
 */
const UPLOAD_DIR = path.join(process.cwd(), "public", "media", "uploads");
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB ceiling on the original upload
const MAX_DIM = 2400; // longest edge — generous for a museum plate, small on the wire

export type ProcessedImage = {
  storagePath: string;
  bytes: number;
  width: number;
  height: number;
  mime: string;
  sha256: string;
};

export async function processImageUpload(file: File, id: string): Promise<ProcessedImage> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new Error("Please choose an image to upload.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("That image is larger than the 25 MB limit. Please use a smaller file.");
  }
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Only image files (JPEG, PNG, WebP, AVIF) are accepted.");
  }

  const input = Buffer.from(await file.arrayBuffer());

  let pipeline;
  try {
    pipeline = sharp(input, { failOn: "error" }).rotate(); // honour EXIF orientation
    const meta = await pipeline.metadata();
    if (!meta.width || !meta.height) throw new Error("unreadable");
  } catch {
    throw new Error("That file could not be read as an image. Please try another.");
  }

  const out = await pipeline
    .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true, progressive: true })
    .toBuffer({ resolveWithObject: true });

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${id}.jpg`;
  await writeFile(path.join(UPLOAD_DIR, filename), out.data);

  return {
    storagePath: `/media/uploads/${filename}`,
    bytes: out.data.length,
    width: out.info.width,
    height: out.info.height,
    mime: "image/jpeg",
    sha256: createHash("sha256").update(out.data).digest("hex"),
  };
}

/** Remove an uploaded derivative from disk (used when an upload row is hard-deleted). */
export async function removeUpload(storagePath: string | null): Promise<void> {
  if (!storagePath || !storagePath.startsWith("/media/uploads/")) return;
  const abs = path.join(process.cwd(), "public", storagePath);
  await rm(abs, { force: true });
}
