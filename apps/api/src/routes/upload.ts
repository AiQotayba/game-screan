import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";

const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("INVALID_IMAGE"));
      return;
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

function handleUploadError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof Error && err.message === "INVALID_IMAGE") {
    return res.status(400).json({ error: "يُسمح بملفات الصور فقط" });
  }
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "حجم الصورة كبير (الحد 5 ميجا)" });
  }
  return next(err);
}

uploadRouter.post("/player", (req, res, next) => {
  upload.single("file")(req, res, async (err) => {
    if (err) return handleUploadError(err, res, next);
    if (!req.file) {
      return res.status(400).json({ error: "لم يُرفع ملف" });
    }

    const filename = `${randomUUID()}.webp`;
    const outputPath = path.join(uploadDir, filename);

    try {
      // التحقق من صلاحية الصورة وتغيير حجمها وضغطها
      await sharp(req.file.buffer)
        .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      return res.status(201).json({ url: `/uploads/${filename}` });
    } catch (sharpError) {
      // sharp will throw an error if the buffer is not a valid image
      console.error("Image processing error:", sharpError);
      return res.status(400).json({ error: "ملف الصورة غير صالح أو تالف" });
    }
  });
});
