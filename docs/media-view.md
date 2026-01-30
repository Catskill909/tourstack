# Media Library

The Media Library provides a centralized view of all uploaded media assets (images, audio, video, documents) with powerful search, filtering, AI analysis, and bulk operations.

## Features

### Grid View (`/media`)

- **Responsive Grid**: Displays all media in a 1-5 column grid depending on screen size
- **Thumbnail Previews**: Images show thumbnails; audio/video show type icons
- **Type Badges**: Color-coded badges indicate media type (blue for images, purple for audio, red for video)
- **Quick Info**: Filename, file size, upload date, and tags displayed on cards

### Search & Filtering

- **Smart Search**: Search by filename, alt text, caption, or tags
- **Type Filter**: Filter by All / Images / Audio / Video / Documents
- **Sorting**: Sort by Date Added, Name, or Size (ascending/descending)

### Bulk Operations

1. Click **Select** button to enter selection mode
2. Click cards to select/deselect, or use **Select All**
3. Bulk actions toolbar appears at bottom:
   - **Add Tags**: Add tags to all selected items
   - **Delete**: Delete all selected items (with confirmation)
   - **Clear**: Exit selection mode

### Media Detail Modal

Click any media item to open the detail modal:

#### Preview Area (Left Column)
- **Images**: Full preview with click-to-expand fullscreen mode
- **Audio**: Waveform visualization with play/pause controls (uses wavesurfer.js)
- **Video**: HTML5 video player with native controls
- **Documents**: Download link

#### Metadata Display
- File size, upload date
- Dimensions (images)
- Duration (audio/video)

#### Editable Fields
- **Alt Text**: Accessibility description
- **Caption**: Descriptive caption
- **Tags**: Add/remove tags with pill display

#### Where Used Section
Shows all Tours and Stops that reference this media:
- Tours using it as hero image
- Stops using it as image or in content blocks
- Clickable links to navigate to the tour/stop

#### AI Analysis (Images Only)
Powered by Gemini API, provides:
- **Suggested Title**: Auto-generated title
- **Description**: Professional catalog description
- **Dominant Colors**: Color palette with hex values
- **Objects Detected**: Identified objects in the image
- **Visual DNA**: Mood, lighting, style, and context
- **Visual Tags**: Relevant tags for cataloging
- **OCR Text**: Any text found in the image

**Apply Buttons**: One-click apply AI-generated tags or description to the metadata form.

---

## API Endpoints

### List Media
```
GET /api/media
```
Returns all media items sorted by creation date (descending).

### Get Single Media
```
GET /api/media/:id
```
Returns a single media item by ID.

### Upload Media
```
POST /api/media
Content-Type: multipart/form-data

file: File (required)
alt: string (optional)
caption: string (optional)
tags: JSON string[] (optional)
width: number (optional)
height: number (optional)
duration: number (optional)
```

### Update Metadata
```
PUT /api/media/:id
Content-Type: application/json

{
  "alt": "string",
  "caption": "string",
  "tags": ["string"]
}
```

### Delete Media
```
DELETE /api/media/:id
```
Deletes both the database record and the physical file.

### Get Usage
```
GET /api/media/:id/usage
```
Returns where the media is used:
```json
{
  "tours": [
    { "id": "...", "title": {...}, "slug": "...", "usageType": "heroImage" }
  ],
  "stops": [
    { "id": "...", "title": {...}, "slug": "...", "tourId": "...", "usageType": "image|content" }
  ]
}
```

### Bulk Delete
```
DELETE /api/media/bulk
Content-Type: application/json

{
  "ids": ["id1", "id2", ...]
}
```

### Bulk Add Tags
```
PUT /api/media/bulk/tags
Content-Type: application/json

{
  "ids": ["id1", "id2", ...],
  "tags": ["tag1", "tag2"],
  "mode": "add" | "replace"
}
```

### Sync Files
```
POST /api/media/sync
```
Scans the uploads folder and adds any files not already in the database. Returns:
```json
{
  "message": "Sync complete: 53 added, 1 already exist, 0 errors",
  "added": 53,
  "skipped": 1,
  "errors": 0
}
```
Use this to populate the Media Library with existing uploads that were made via the quick upload endpoint.

---

## Database Schema

```prisma
model Media {
  id        String   @id @default(cuid())
  filename  String
  mimeType  String
  size      Int      // bytes
  url       String

  // Dimensions & Duration
  width     Int?     // Image width in pixels
  height    Int?     // Image height in pixels
  duration  Float?   // Audio/video duration in seconds

  // Metadata
  alt       String?
  caption   String?
  tags      String?  // JSON: string[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## File Structure

```
app/src/
├── pages/
│   └── Media.tsx                    # Main media library page
├── components/
│   └── media/
│       ├── MediaCard.tsx            # Grid item card
│       ├── MediaDetailModal.tsx     # Full detail modal
│       ├── MediaBulkActions.tsx     # Bulk operations toolbar
│       ├── MediaUsageList.tsx       # Where Used section
│       ├── ImageAnalysisPanel.tsx   # AI analysis integration
│       ├── AudioPreview.tsx         # Audio waveform player
│       └── VideoPreview.tsx         # Video player
├── lib/
│   └── mediaService.ts              # API service layer
└── types/
    └── media.ts                     # TypeScript types

app/server/routes/
└── media.ts                         # API routes
```

---

## Configuration

### Required for AI Analysis
Set the `GEMINI_API_KEY` environment variable to enable image analysis features.

### Storage
Media files are stored in:
- `/uploads/images/` - Image files
- `/uploads/audio/` - Audio files
- `/uploads/documents/` - PDFs and other documents

For Coolify deployments, ensure the `/app/uploads` volume is mounted to persistent storage.

---

## Usage Examples

### Uploading Media
1. Click the **Upload** button
2. Select one or more files
3. Files are automatically categorized by type
4. View in the grid immediately after upload

### Editing Metadata
1. Click any media item to open the detail modal
2. Edit alt text, caption, or tags
3. Click **Save Changes**

### Using AI Analysis
1. Open an image in the detail modal
2. Expand the **AI Analysis** section
3. Click **Analyze Image**
4. Review the results
5. Click **Apply** buttons to use suggested tags/description

### Finding Where Media is Used
1. Open any media item
2. Expand the **Where Used** section
3. Click any tour/stop link to navigate there

### Bulk Tagging
1. Click **Select** to enter selection mode
2. Select multiple items
3. Click **Add Tags** in the toolbar
4. Enter comma-separated tags
5. Click **Add** to apply to all selected items

### Syncing Existing Files
If files were uploaded via tour/stop editors (quick upload), they won't appear in Media Library until synced:
1. Click the **Sync** button in the header
2. All files from `/uploads` will be added to the database
3. Files already in the database are skipped
