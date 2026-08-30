"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Star, Trash2, Upload, X, ZoomIn, Plus, Loader2, ImageOff } from "lucide-react";

interface PetPhoto {
  id: string;
  url: string;
  caption?: string | null;
  isPrimary: boolean;
  createdAt: string;
}

interface PhotoTileProps {
  photo: PetPhoto;
  actionId: string | null;
  onView: () => void;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
}

function PhotoTile({ photo, actionId, onView, onSetPrimary, onDelete }: PhotoTileProps) {
  const [imgError, setImgError] = useState(false);
  const busy = actionId === photo.id;

  return (
    <div className="relative group rounded-2xl overflow-hidden bg-slate-100 aspect-square border border-slate-200">
      {imgError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <ImageOff className="w-6 h-6 text-slate-400" />
        </div>
      ) : (
        <img
          src={photo.url}
          alt={photo.caption || "Pet photo"}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
          onError={() => setImgError(true)}
        />
      )}

      {photo.isPrimary && (
        <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow">
          <Star className="w-2.5 h-2.5 fill-current" />
          <span>Primary</span>
        </div>
      )}

      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          title="View full size"
          onClick={onView}
          className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-xl text-white transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        {!photo.isPrimary && (
          <button
            title="Set as primary"
            onClick={() => onSetPrimary(photo.id)}
            disabled={busy}
            className="p-2 bg-white/20 hover:bg-amber-500/80 backdrop-blur-sm rounded-xl text-white transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
          </button>
        )}
        <button
          title="Delete photo"
          onClick={() => onDelete(photo.id)}
          disabled={busy}
          className="p-2 bg-white/20 hover:bg-red-500/80 backdrop-blur-sm rounded-xl text-white transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      {photo.caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2">
          <p className="text-[10px] text-white font-medium truncate">{photo.caption}</p>
        </div>
      )}
    </div>
  );
}

interface PetPhotoGalleryProps {
  petId: string;
  photos: PetPhoto[];
  onUpdate: () => void;
}

export function PetPhotoGallery({ petId, photos, onUpdate }: PetPhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<PetPhoto | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are allowed.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError("Image must be under 8 MB.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "pet-photos");
      formData.append("isPublic", "true");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) throw new Error(uploadData.error || "Upload failed");

      const isFirst = photos.length === 0;
      const photoRes = await fetch(`/api/pets/${petId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: uploadData.url, isPrimary: isFirst }),
      });
      if (!photoRes.ok) throw new Error("Failed to save photo");
      onUpdate();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [petId, photos.length, onUpdate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSetPrimary = async (photoId: string) => {
    setActionId(photoId);
    try {
      await fetch(`/api/pets/${petId}/photos/${photoId}`, { method: "PATCH" });
      onUpdate();
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("Delete this photo permanently?")) return;
    setActionId(photoId);
    try {
      await fetch(`/api/pets/${petId}/photos/${photoId}`, { method: "DELETE" });
      onUpdate();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-600" />
            <span>Photo Gallery</span>
            {photos.length > 0 && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {photos.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            The starred ⭐ photo is your pet&apos;s main avatar. Upload up to 10 photos.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || photos.length >= 10}
          className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{uploading ? "Uploading..." : "Add Photo"}</span>
        </button>
      </div>

      {uploadError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {photos.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            dragOver ? "border-teal-400 bg-teal-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          ) : (
            <Upload className="w-8 h-8 text-slate-400" />
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              {uploading ? "Uploading photo..." : "Drop a photo here or click to browse"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WEBP — max 8 MB</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <PhotoTile
              key={photo.id}
              photo={photo}
              actionId={actionId}
              onView={() => setLightbox(photo)}
              onSetPrimary={handleSetPrimary}
              onDelete={handleDelete}
            />
          ))}

          {photos.length < 10 && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                dragOver ? "border-teal-400 bg-teal-50" : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
              }`}
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
              ) : (
                <>
                  <Plus className="w-6 h-6 text-slate-400" />
                  <span className="text-[11px] text-slate-400 font-medium">Add Photo</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightbox.url}
            alt={lightbox.caption || "Pet photo"}
            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="absolute bottom-6 text-sm text-white/80 font-medium bg-slate-900/60 px-4 py-2 rounded-xl">
              {lightbox.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}