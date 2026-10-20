// Compressão de imagens no navegador antes do envio ao Storage.
// Redimensiona para um lado máximo e converte para WebP (JPEG se o navegador não suportar).

export const SMALL_SUFFIX = "-sm";

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // Respeita a orientação EXIF de fotos de celular
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // cai para <img> abaixo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File, maxSide: number, quality = 0.82): Promise<Blob> {
  const source = await decode(file);
  const w = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  let blob = await toBlob(canvas, "image/webp", quality);
  if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", quality);
  if (!blob) return file;
  // Sem redimensionar e o original já é menor: mantém o original
  return scale === 1 && blob.size >= file.size ? file : blob;
}

export function extensionFor(blob: Blob): string {
  return blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
}

// Fotos de imóveis enviadas com compressão ficam em property/v2/ e têm uma versão pequena
// (cards e miniaturas): <uuid>.webp -> <uuid>-sm.webp. Fotos antigas ou externas são usadas como estão.
export const PROPERTY_FOLDER = "property/v2";
const UPLOADED = /\/storage\/v1\/object\/public\/site-images\/property\/v2\/[0-9a-f-]{36}\.(webp|jpg)$/;

export function smallImage(url: string): string {
  return UPLOADED.test(url) ? url.replace(/\.(webp|jpg)$/, `${SMALL_SUFFIX}.$1`) : url;
}
