# Firebase Storage Setup & Avatar Upload Implementation Guide

**Date**: May 7, 2026  
**Purpose**: Enable live avatar uploads and profile picture functionality  
**Status**: Ready for implementation

## Firebase Storage Setup (One-time)

### 1. Enable Cloud Storage in Firebase Console

```
Firebase Console → Project Settings → Storage Tab
- Enable Cloud Storage for project "lingkod-ani"
- Storage location: us-central1 (or nearest to your users)
- Default bucket: lingkod-ani.appspot.com
```

### 2. Verify Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lingkod-ani.appspot.com
```

### 3. Deploy Storage Rules

The [`storage.rules`](../storage.rules) file is configured and ready to deploy:

```bash
firebase deploy --only storage
```

Current storage rules allow:
- **Barangay staff & developers**: Upload/read/write to all storage paths
- **Farmers**: Read-only access to their own profile pictures
- **Size limits**: 5MB per file (configurable in rules)
- **File types**: Image files only (jpg, jpeg, png, webp)

---

## Avatar Upload Feature

### Backend Implementation

#### 1. API Route: `/api/account/avatar-upload`

```typescript
// src/app/api/account/avatar-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase-admin';
import { authenticateInteractiveRequest } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate with fresh token
    const authResult = await authenticateInteractiveRequest(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Unauthorized: Fresh authentication required' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 5MB' },
        { status: 400 }
      );
    }

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileName = `user-avatars/${authResult.uid}-${Date.now()}`;
    const file_ref = bucket.file(fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    
    await file_ref.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: authResult.uid,
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
        },
      },
    });

    // Get download URL
    await file_ref.makePublic();
    const downloadUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Update user profile with avatar URL
    const { db } = await import('@/lib/firebase-admin');
    await db.collection('users').doc(authResult.uid).update({
      avatarUrl: downloadUrl,
      avatarUpdatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        avatarUrl: downloadUrl,
        fileName: fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Avatar upload failed' },
      { status: 500 }
    );
  }
}
```

#### 2. Client-Side Hook: `useAvatarUpload`

```typescript
// src/hooks/useAvatarUpload.ts
import { useState } from 'react';
import { getAuth } from 'firebase/auth';

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAvatar = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get fresh ID token
      const idToken = await user.getIdToken(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server endpoint
      const response = await fetch('/api/account/avatar-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      return data.avatarUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading, error };
}
```

#### 3. UI Component: `AvatarUpload`

```typescript
// src/components/AvatarUpload.tsx
'use client';

import { useState } from 'react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Button } from '@/components/ui/button';

export function AvatarUpload({ currentAvatarUrl }: { currentAvatarUrl?: string }) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const { uploadAvatar, uploading, error } = useAvatarUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const avatarUrl = await uploadAvatar(file);
    if (!avatarUrl) {
      setPreview(currentAvatarUrl || null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
        {preview && (
          <img src={preview} alt="Avatar preview" className="w-full h-full object-cover" />
        )}
      </div>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

---

## Storage Rules Configuration

The [`storage.rules`](../storage.rules) file includes:

```firestore
// Allow authenticated users to upload their own avatar
match /user-avatars/{userId}/{allPaths=**} {
  // Users can upload to their own folder
  allow create: if isAuthenticated() && 
                   request.auth.uid == extractUserId(path(1));
  // Users can read all avatars (for display)
  allow read: if isAuthenticated();
}

// Allow knowledge base audio uploads by staff only
match /knowledge-base/audio/{allPaths=**} {
  allow read, write: if isAuthorizedStaff();
}

// Allow farmer evidence uploads
match /farmer-evidence/{allPaths=**} {
  allow read, write: if isAuthorizedStaff();
}
```

---

## Testing Avatar Upload

### Local Testing

```bash
# 1. Start development server
npm run dev

# 2. Login as barangay staff or developer

# 3. Navigate to profile settings

# 4. Test avatar upload with:
#    - Valid image (JPEG, PNG, WebP)
#    - Invalid file type (should fail)
#    - File > 5MB (should fail)
```

### Production Testing (lingkod-ani.com)

```bash
# After Firebase Storage is enabled:

# 1. Deploy storage rules
firebase deploy --only storage

# 2. Login to production app

# 3. Test avatar upload on live environment

# 4. Verify avatar URL is accessible and persisted
```

---

## Cleanup & Management

### Delete Old Avatars

```typescript
// src/lib/storage-cleanup.ts
import { storage } from '@/lib/firebase-admin';

export async function deleteOldAvatars(userId: string, keep: number = 3) {
  const bucket = storage.bucket();
  const [files] = await bucket.getFiles({
    prefix: `user-avatars/${userId}-`,
  });

  // Sort by upload time (newest first)
  const sorted = files.sort((a, b) => {
    return new Date(b.metadata.timeCreated).getTime() - 
           new Date(a.metadata.timeCreated).getTime();
  });

  // Delete old files, keep only 'keep' number
  for (let i = keep; i < sorted.length; i++) {
    await sorted[i].delete();
  }
}
```

---

## Troubleshooting

### "Firebase Storage is not initialized"

**Cause**: Cloud Storage not enabled in Firebase Console  
**Fix**: Enable Cloud Storage in Firebase Console → Storage

### "Permission denied" on upload

**Cause**: Storage rules not deployed or user doesn't have permission  
**Fix**:
```bash
firebase deploy --only storage
```

### Avatar not persisting after logout

**Cause**: URL permissions or storage rules issue  
**Fix**: Ensure storage.rules allow read access for authenticated users

---

## Next Steps

1. ✅ Create API endpoint for avatar upload
2. ✅ Create client-side hook and component
3. ⏳ Enable Cloud Storage in Firebase Console
4. ⏳ Deploy storage rules: `firebase deploy --only storage`
5. ⏳ Test avatar upload on production
6. ⏳ Add profile picture to user profile display

---

**Implementation Status**: Ready for Firebase Storage setup
