const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure upload directory exists for legacy static file serving or local disk caching
const isVercel = process.env.VERCEL;
const uploadDir = isVercel
    ? path.join(os.tmpdir(), 'uploads')
    : path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (err) {
        console.warn('Warning: Could not create upload directory:', err.message);
    }
}

// Memory storage for serverless and persistent DB storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
        
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        if (allowedMimeTypes.includes(mimeType) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed!'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Converts an uploaded file buffer into a persistent Base64 Data URI string.
 * Optionally caches the file to local upload directory if available.
 */
const processImageToDataUri = (file, prefix = 'img') => {
    if (!file || !file.buffer) return null;

    const mimeType = file.mimetype || 'image/png';
    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    // Optional local disk cache writing (safely ignored if failure on serverless)
    try {
        const ext = path.extname(file.originalname || '.png') || '.png';
        const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, file.buffer);
    } catch (e) {
        // Ephemeral storage errors on serverless are non-fatal
    }

    return dataUri;
};

upload.processImageToDataUri = processImageToDataUri;
upload.uploadDir = uploadDir;

module.exports = upload;

