import multer from 'multer';

const storage = multer.memoryStorage(); 

const allowed = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/quicktime', 'video/webm'
]);

function fileFilter(_req, file, cb) {
  if (!allowed.has(file.mimetype)) return cb(new Error('Unsupported file type'), false);
  cb(null, true);
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file (tweak if you like)
  fileFilter
});
