// Media API Routes - File upload and management
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { Media } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Type for route params
interface IdParams {
    id: string;
}

// Ensure upload directories exist
const UPLOAD_BASE = path.join(__dirname, '../../uploads');
const UPLOAD_DIRS = {
    images: path.join(UPLOAD_BASE, 'images'),
    audio: path.join(UPLOAD_BASE, 'audio'),
    documents: path.join(UPLOAD_BASE, 'documents'),
};

// Create directories if they don't exist
Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        // Determine folder based on mimetype
        let folder = UPLOAD_DIRS.documents;
        if (file.mimetype.startsWith('image/')) {
            folder = UPLOAD_DIRS.images;
        } else if (file.mimetype.startsWith('audio/')) {
            folder = UPLOAD_DIRS.audio;
        }
        cb(null, folder);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
    fileFilter: (_req, file, cb) => {
        // Allow images, audio, and common document types
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
            'audio/webm',
            'video/mp4',
            'video/webm',
            'application/pdf',
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    },
});

// Helper to parse media
function parseMedia(m: Media) {
    return {
        ...m,
        tags: m.tags ? JSON.parse(m.tags) : [],
    };
}

// GET /api/media - List all media
router.get('/', async (_req: Request, res: Response) => {
    try {
        const media = await prisma.media.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json(media.map(parseMedia));
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// POST /api/media - Upload file
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Determine URL path based on destination folder
        let urlPath: string;
        if (req.file.destination.includes('images')) {
            urlPath = `/uploads/images/${req.file.filename}`;
        } else if (req.file.destination.includes('audio')) {
            urlPath = `/uploads/audio/${req.file.filename}`;
        } else {
            urlPath = `/uploads/documents/${req.file.filename}`;
        }

        // Save to database
        const media = await prisma.media.create({
            data: {
                filename: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                url: urlPath,
                alt: req.body.alt || null,
                caption: req.body.caption || null,
                tags: req.body.tags ? JSON.stringify(JSON.parse(req.body.tags)) : null,
            },
        });

        res.status(201).json(parseMedia(media));
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// DELETE /api/media/:id - Delete file
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id },
        });

        if (!media) {
            res.status(404).json({ error: 'Media not found' });
            return;
        }

        // Delete physical file
        const filePath = path.join(UPLOAD_BASE, '..', media.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await prisma.media.delete({
            where: { id: req.params.id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

export default router;
