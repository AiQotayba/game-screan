import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import multer from "multer";

const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${randomUUID()}${safe}`);
  },
});

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
  upload.single("file")(req, res, (err) => {
    if (err) return handleUploadError(err, res, next);
    if (!req.file) {
      return res.status(400).json({ error: "لم يُرفع ملف" });
    }
    return res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});
