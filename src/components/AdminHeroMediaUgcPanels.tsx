import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Edit3,
  Eye,
  Film,
  Image as ImageIcon,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  createCinematicHeroBackdropSvg,
  createUgcVerticalPosterSvg,
  DEFAULT_CINEMATIC_MP4_URL,
  HERO_CAMPAIGN_MOBILE_SVG,
  HERO_CAMPAIGN_SVG,
} from '../data/initialCatalog';
import {
  HeroButtonStyle,
  HeroConfig,
  HeroHeightPreset,
  HeroSlide,
  HeroTextPosition,
  MediaLibraryItem,
  StorePageId,
  UgcVideoItem,
} from '../types/store';
import {
  FullScreenCinematicHero,
  NewArrivalsShowcaseSection,
  VynooxCommunityUgcSection,
} from './HeroAndUgcSystem';

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0.00 MB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatMegabytesPair(loadedBytes: number, totalBytes: number): string {
  const loadedMb = (Math.max(0, loadedBytes) / (1024 * 1024)).toFixed(2);
  const totalMb = (Math.max(1, totalBytes) / (1024 * 1024)).toFixed(2);
  return `${loadedMb} MB / ${totalMb} MB`;
}

const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const SUPPORTED_VIDEO_EXTENSIONS = ['mp4'];
export const MAX_IMAGE_UPLOAD_MB = 25;
export const MAX_VIDEO_UPLOAD_MB = 120;
const MAX_IMAGE_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_MB * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024;

export interface UploadProgressMetrics {
  percent: number;
  loadedBytes: number;
  totalBytes: number;
}

function validateSelectedMediaFile(
  file: File,
  expectedKind?: 'image' | 'video'
): { mediaType: 'image' | 'video'; mimeType: string; ext: string } {
  const extMatch = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : '';
  const rawType = (file.type || '').toLowerCase();

  const isValidImage =
    SUPPORTED_IMAGE_EXTENSIONS.includes(ext) ||
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(rawType);
  const isValidVideo =
    SUPPORTED_VIDEO_EXTENSIONS.includes(ext) || rawType === 'video/mp4';

  if (expectedKind === 'image' && !isValidImage) {
    throw new Error(
      `Unsupported image format "${file.name}". Please upload JPG, JPEG, PNG, or WEBP.`
    );
  }
  if (expectedKind === 'video' && !isValidVideo) {
    throw new Error(`Unsupported video format "${file.name}". Please upload an MP4 video.`);
  }
  if (!isValidImage && !isValidVideo) {
    throw new Error(
      `Unsupported file "${file.name}". Only JPG, JPEG, PNG, WEBP images and MP4 videos are allowed.`
    );
  }

  if (file.size <= 0) {
    throw new Error(`File "${file.name}" is empty (0 bytes).`);
  }

  if (isValidVideo && file.size > MAX_VIDEO_UPLOAD_BYTES) {
    throw new Error(
      `Video "${file.name}" exceeds the ${MAX_VIDEO_UPLOAD_MB} MB maximum file size limit.`
    );
  }
  if (isValidImage && file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error(
      `Image "${file.name}" exceeds the ${MAX_IMAGE_UPLOAD_MB} MB maximum file size limit.`
    );
  }

  const normalizedMime = isValidVideo
    ? 'video/mp4'
    : ext === 'png'
    ? 'image/png'
    : ext === 'webp'
    ? 'image/webp'
    : 'image/jpeg';

  return {
    mediaType: isValidVideo ? 'video' : 'image',
    mimeType: normalizedMime,
    ext: isValidVideo ? 'mp4' : ext || 'jpg',
  };
}

function inspectImageDimensionsFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1920;
      const h = img.naturalHeight || 1080;
      URL.revokeObjectURL(objectUrl);
      resolve(`${w}x${h}`);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('1920x1080');
    };
    img.src = objectUrl;
  });
}

function inspectVideoDimensionsAndDuration(
  file: File
): Promise<{ dimensions: string; durationSeconds: number }> {
  return new Promise((resolve) => {
    let settled = false;
    const objectUrl = URL.createObjectURL(file);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.muted = true;
    vid.playsInline = true;

    const finish = (dimensions: string, durationSeconds: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
      resolve({ dimensions, durationSeconds });
    };

    const timeoutId = window.setTimeout(() => {
      finish('1920x1080', 10);
    }, 3500);

    vid.onerror = () => {
      finish('1920x1080', 10);
    };
    vid.onloadedmetadata = () => {
      const w = vid.videoWidth || 1920;
      const h = vid.videoHeight || 1080;
      const dur = Math.max(1, Math.round(vid.duration || 10));
      finish(`${w}x${h}`, dur);
    };
    vid.src = objectUrl;
  });
}

interface StorageUploadResponse {
  ok: boolean;
  mediaId: string;
  fileName: string;
  storedFileName: string;
  fileType: string;
  mediaType: 'image' | 'video';
  mediaCategory: 'hero_desktop' | 'hero_mobile' | 'ugc_video' | 'product_media' | 'general';
  storagePath: string;
  url: string;
  downloadUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
  deduplicated?: boolean;
  error?: string;
}

function isDefaultPlaceholderUrl(url?: string): boolean {
  if (!url || !url.trim()) return true;
  return (
    url.startsWith('data:image/svg+xml') ||
    url.includes('assets.mixkit.co')
  );
}

function computeFileFingerprint(file: File, mediaCategory: string): string {
  return `${mediaCategory}:${file.name}:${file.size}:${file.lastModified || 0}`;
}

function ensureVersionedMediaUrl(url: string): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/api/media/files/') && !url.includes('v=')) {
    return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
  }
  return url;
}

async function uploadBinaryFileToStorage(params: {
  file: File;
  mediaCategory: 'hero_desktop' | 'hero_mobile' | 'ugc_video' | 'product_media' | 'general';
  replaceStoragePath?: string;
  onProgress?: (percent: number) => void;
  onDetailedProgress?: (metrics: UploadProgressMetrics) => void;
  onCancelRegister?: (cancelFn: () => void) => void;
}): Promise<StorageUploadResponse> {
  const {
    file,
    mediaCategory,
    replaceStoragePath,
    onProgress,
    onDetailedProgress,
    onCancelRegister,
  } = params;
  const validated = validateSelectedMediaFile(file);
  const fingerprint = computeFileFingerprint(file, mediaCategory);

  onProgress?.(2);
  onDetailedProgress?.({
    percent: 2,
    loadedBytes: 0,
    totalBytes: file.size,
  });

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/storage/upload-stream', true);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name));
    xhr.setRequestHeader('x-file-type', validated.mimeType);
    xhr.setRequestHeader('x-media-category', mediaCategory);
    xhr.setRequestHeader('x-file-fingerprint', encodeURIComponent(fingerprint));
    if (replaceStoragePath) {
      xhr.setRequestHeader(
        'x-replace-storage-path',
        encodeURIComponent(replaceStoragePath)
      );
    }
    xhr.withCredentials = true;

    if (typeof window !== 'undefined') {
      const adminToken = window.sessionStorage.getItem('vynoox_admin_token');
      if (adminToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${adminToken}`);
      }
    }

    onCancelRegister?.(() => {
      xhr.abort();
    });

    xhr.upload.onprogress = (evt) => {
      const loaded = evt.loaded;
      const total = evt.lengthComputable && evt.total > 0 ? evt.total : file.size;
      const pct = Math.max(2, Math.min(98, Math.round((loaded / Math.max(1, total)) * 98)));
      onProgress?.(pct);
      onDetailedProgress?.({
        percent: pct,
        loadedBytes: loaded,
        totalBytes: total,
      });
    };

    xhr.onabort = () => {
      reject(new Error('Upload cancelled by administrator.'));
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload. Please check your connection and retry.'));
    };

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText || '{}') as StorageUploadResponse;
        if (xhr.status === 401 || xhr.status === 403) {
          reject(
            new Error(
              "You don't have permission to upload media. Please verify your admin access."
            )
          );
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300 || !parsed.ok) {
          reject(new Error(parsed.error || 'Upload failed. Please try again.'));
          return;
        }
        const finalResp: StorageUploadResponse = {
          ...parsed,
          url: ensureVersionedMediaUrl(parsed.url),
        };
        onProgress?.(100);
        onDetailedProgress?.({
          percent: 100,
          loadedBytes: file.size,
          totalBytes: file.size,
        });
        resolve(finalResp);
      } catch {
        reject(new Error('Upload failed. Please try again.'));
      }
    };

    // Stream raw binary File directly without Base64 conversion
    xhr.send(file);
  });
}

async function verifyUploadedMediaPlayable(
  url: string,
  expectedKind: 'image' | 'video'
): Promise<void> {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return;
  const res = await fetch(url, {
    method: 'HEAD',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(
      `Uploaded ${expectedKind} URL "${url}" returned HTTP ${res.status}. File is not accessible.`
    );
  }
  const contentLength = Number(res.headers.get('content-length') || '0');
  if (contentLength <= 0) {
    throw new Error(`Uploaded ${expectedKind} at "${url}" has 0 bytes on server.`);
  }
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (expectedKind === 'video' && !contentType.includes('video/mp4')) {
    throw new Error(
      `Expected Content-Type video/mp4 for "${url}", but received "${contentType || 'unknown'}".`
    );
  }
}

async function readImageFileMetadata(
  file: File,
  mediaCategory:
    | 'hero_desktop'
    | 'hero_mobile'
    | 'ugc_video'
    | 'product_media'
    | 'general' = 'general',
  onProgress?: (pct: number) => void,
  replaceStoragePath?: string,
  onDetailedProgress?: (metrics: UploadProgressMetrics) => void,
  onCancelRegister?: (cancelFn: () => void) => void
): Promise<{
  mediaId: string;
  dataUrl: string;
  downloadUrl: string;
  storagePath: string;
  fileType: string;
  mediaCategory: 'hero_desktop' | 'hero_mobile' | 'ugc_video' | 'product_media' | 'general';
  dimensions: string;
  sizeBytes: number;
  uploadedAt: string;
}> {
  validateSelectedMediaFile(file, 'image');
  const [dimensions, uploaded] = await Promise.all([
    inspectImageDimensionsFromFile(file),
    uploadBinaryFileToStorage({
      file,
      mediaCategory,
      replaceStoragePath,
      onProgress,
      onDetailedProgress,
      onCancelRegister,
    }),
  ]);
  await verifyUploadedMediaPlayable(uploaded.url, 'image');
  return {
    mediaId: uploaded.mediaId,
    dataUrl: uploaded.url,
    downloadUrl: uploaded.downloadUrl,
    storagePath: uploaded.storagePath,
    fileType: uploaded.fileType,
    mediaCategory: uploaded.mediaCategory,
    dimensions,
    sizeBytes: uploaded.fileSizeBytes,
    uploadedAt: uploaded.uploadedAt,
  };
}

async function readVideoFileMetadata(
  file: File,
  mediaCategory:
    | 'hero_desktop'
    | 'hero_mobile'
    | 'ugc_video'
    | 'product_media'
    | 'general' = 'general',
  onProgress?: (pct: number) => void,
  replaceStoragePath?: string,
  onDetailedProgress?: (metrics: UploadProgressMetrics) => void,
  onCancelRegister?: (cancelFn: () => void) => void
): Promise<{
  mediaId: string;
  url: string;
  downloadUrl: string;
  storagePath: string;
  fileType: string;
  mediaCategory: 'hero_desktop' | 'hero_mobile' | 'ugc_video' | 'product_media' | 'general';
  dimensions: string;
  durationSeconds: number;
  sizeBytes: number;
  uploadedAt: string;
}> {
  validateSelectedMediaFile(file, 'video');
  // Inspect metadata and stream binary simultaneously for maximum upload speed
  const [videoMeta, uploaded] = await Promise.all([
    inspectVideoDimensionsAndDuration(file),
    uploadBinaryFileToStorage({
      file,
      mediaCategory,
      replaceStoragePath,
      onProgress,
      onDetailedProgress,
      onCancelRegister,
    }),
  ]);
  await verifyUploadedMediaPlayable(uploaded.url, 'video');
  return {
    mediaId: uploaded.mediaId,
    url: uploaded.url,
    downloadUrl: uploaded.downloadUrl,
    storagePath: uploaded.storagePath,
    fileType: uploaded.fileType,
    mediaCategory: uploaded.mediaCategory,
    dimensions: videoMeta.dimensions,
    durationSeconds: videoMeta.durationSeconds,
    sizeBytes: uploaded.fileSizeBytes,
    uploadedAt: uploaded.uploadedAt,
  };
}

function triggerMediaDownload(url: string, fileName: string, downloadUrl?: string) {
  const targetHref =
    downloadUrl ||
    (url.startsWith('/api/media/files/') && !url.includes('download=1')
      ? `${url}${url.includes('?') ? '&' : '?'}download=1`
      : url);
  const a = document.createElement('a');
  a.href = targetHref;
  a.download = fileName || 'vynoox-media';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

type HeroMediaSlotField =
  | 'desktopImageUrl'
  | 'mobileImageUrl'
  | 'desktopVideoUrl'
  | 'mobileVideoUrl';

function configContainsTemporaryBlobUrl(config: HeroConfig): boolean {
  return (config.slides || []).some(
    (s) =>
      (s.desktopImageUrl && s.desktopImageUrl.startsWith('blob:')) ||
      (s.mobileImageUrl && s.mobileImageUrl.startsWith('blob:')) ||
      (s.desktopVideoUrl && s.desktopVideoUrl.startsWith('blob:')) ||
      (s.mobileVideoUrl && s.mobileVideoUrl.startsWith('blob:'))
  );
}

const AdminHeroVideoPreview: React.FC<{
  videoUrl?: string;
  slotLabel: string;
  emptyMessage: string;
  isMobilePortrait?: boolean;
}> = ({ videoUrl, slotLabel, emptyMessage, isMobilePortrait = false }) => {
  const trimmedUrl = (videoUrl || '').trim();
  const hasValidUrl = Boolean(trimmedUrl) && !isDefaultPlaceholderUrl(trimmedUrl);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    hasValidUrl ? 'loading' : 'idle'
  );
  const [metaBadge, setMetaBadge] = useState<string>('');
  const [reloadNonce, setReloadNonce] = useState<number>(0);

  useEffect(() => {
    if (!hasValidUrl) {
      setLoadState('idle');
      setMetaBadge('');
      return;
    }
    setLoadState('loading');
    setMetaBadge('');
  }, [trimmedUrl, hasValidUrl, reloadNonce]);

  const effectiveSrc =
    hasValidUrl && reloadNonce > 0
      ? `${trimmedUrl}${trimmedUrl.includes('?') ? '&' : '?'}r=${reloadNonce}`
      : trimmedUrl;

  return (
    <div
      className={`w-full bg-neutral-950 border border-neutral-200 overflow-hidden relative ${
        isMobilePortrait ? 'aspect-video' : 'aspect-video'
      }`}
    >
      {hasValidUrl ? (
        <>
          <video
            key={`${effectiveSrc}-${reloadNonce}`}
            src={effectiveSrc}
            controls
            muted
            loop
            playsInline
            preload="metadata"
            onLoadStart={() => setLoadState('loading')}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              const w = v.videoWidth || 0;
              const h = v.videoHeight || 0;
              const dur = Math.max(1, Math.round(v.duration || 0));
              if (w > 0 && h > 0) {
                setMetaBadge(`${w}x${h} · ${dur}s`);
              }
              setLoadState('loaded');
              if (v.currentTime === 0) {
                try {
                  v.currentTime = 0.05;
                } catch {
                  // ignore seek error
                }
              }
            }}
            onLoadedData={(e) => {
              setLoadState('loaded');
              const v = e.currentTarget;
              v.muted = true;
              v.play().catch(() => {});
            }}
            onCanPlay={() => setLoadState('loaded')}
            onError={() => setLoadState('error')}
            className={`w-full h-full ${
              isMobilePortrait ? 'object-contain bg-black' : 'object-cover'
            }`}
          />
          {loadState === 'loading' && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center pointer-events-none">
              <span className="px-2.5 py-1 bg-black/80 text-white font-mono text-[10px] uppercase tracking-wider">
                Loading {slotLabel} Stream...
              </span>
            </div>
          )}
          {loadState === 'loaded' && metaBadge && (
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 text-emerald-300 font-mono text-[10px] uppercase pointer-events-none">
              LIVE MP4 · {metaBadge}
            </div>
          )}
          {loadState === 'error' && (
            <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center gap-2 p-3 text-center">
              <span className="text-red-400 font-mono text-[11px]">
                Unable to load {slotLabel} preview from URL.
              </span>
              <button
                type="button"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="px-2.5 py-1 bg-white text-black font-mono text-[10px] uppercase"
              >
                Retry Video Stream
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-[11px] px-4 text-center">
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export const AdminHeroAndShowcaseStudio: React.FC = () => {
  const {
    heroConfig,
    heroDraftConfig,
    updateHeroConfig,
    saveHeroDraft,
    newArrivalsConfig,
    updateNewArrivalsConfig,
    mediaLibrary,
    updateMediaLibrary,
    products,
    notify,
  } = useStore();

  const [localHero, setLocalHero] = useState<HeroConfig>(heroConfig);
  const [hasUnsavedStudioChanges, setHasUnsavedStudioChanges] = useState<boolean>(false);
  const [publicationStatus, setPublicationStatus] = useState<
    'published' | 'draft' | 'unsaved' | 'uploading' | 'publishing'
  >('published');
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    heroConfig.slides[0]?.id || 'hero-slide-1'
  );
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadMetrics, setUploadMetrics] = useState<UploadProgressMetrics | null>(null);
  const [activeUploadLabel, setActiveUploadLabel] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [lastFailedUpload, setLastFailedUpload] = useState<{
    file: File;
    targetField: HeroMediaSlotField;
    slideId: string;
  } | null>(null);
  const [activeStudioTab, setActiveStudioTab] = useState<'slides' | 'display' | 'new-arrivals'>(
    'slides'
  );

  const cancelUploadRef = useRef<(() => void) | null>(null);
  const activeTempObjectUrlsRef = useRef<string[]>([]);
  const localHeroRef = useRef<HeroConfig>(localHero);

  useEffect(() => {
    localHeroRef.current = localHero;
  }, [localHero]);

  // Keep studio synced with external heroConfig updates (e.g. from Media Library panel) when no unsaved edits exist
  useEffect(() => {
    if (!hasUnsavedStudioChanges && publicationStatus !== 'uploading') {
      setLocalHero(heroConfig);
      localHeroRef.current = heroConfig;
      if (
        heroConfig.slides.length > 0 &&
        !heroConfig.slides.some((s) => s.id === selectedSlideId)
      ) {
        setSelectedSlideId(heroConfig.slides[0].id);
      }
    }
  }, [heroConfig, hasUnsavedStudioChanges, publicationStatus, selectedSlideId]);

  // Cleanup any temporary object URLs on unmount
  useEffect(() => {
    return () => {
      activeTempObjectUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const selectedSlide =
    localHero.slides.find((s) => s.id === selectedSlideId) || localHero.slides[0];

  const patchSlideById = (slideId: string, patch: Partial<HeroSlide>, markUnsaved = true) => {
    setLocalHero((prev) => {
      const nextSlides = prev.slides.map((s) =>
        s.id === slideId ? { ...s, ...patch } : s
      );
      const nextConfig: HeroConfig = { ...prev, slides: nextSlides };
      localHeroRef.current = nextConfig;
      if (!configContainsTemporaryBlobUrl(nextConfig)) {
        updateHeroConfig(nextConfig, false).catch(() => {});
      }
      return nextConfig;
    });
    if (markUnsaved) {
      setHasUnsavedStudioChanges(true);
      setPublicationStatus((prev) => (prev === 'uploading' ? 'uploading' : 'unsaved'));
    }
  };

  const patchSlide = (patch: Partial<HeroSlide>) => {
    if (!selectedSlide) return;
    patchSlideById(selectedSlide.id, patch, true);
  };

  const patchHeroGlobal = (patch: Partial<HeroConfig>) => {
    setLocalHero((prev) => {
      const nextConfig: HeroConfig = { ...prev, ...patch };
      localHeroRef.current = nextConfig;
      if (!configContainsTemporaryBlobUrl(nextConfig)) {
        updateHeroConfig(nextConfig, false).catch(() => {});
      }
      return nextConfig;
    });
    setHasUnsavedStudioChanges(true);
    setPublicationStatus((prev) => (prev === 'uploading' ? 'uploading' : 'unsaved'));
  };

  const handleCancelActiveUpload = () => {
    if (cancelUploadRef.current) {
      cancelUploadRef.current();
      cancelUploadRef.current = null;
    }
  };

  const handleSlideMediaUpload = async (
    file: File | undefined,
    targetField: HeroMediaSlotField,
    explicitSlideId?: string
  ) => {
    const currentHeroSnapshot = localHeroRef.current;
    const targetSlideId = explicitSlideId || selectedSlide?.id;
    const targetSlideObj = currentHeroSnapshot.slides.find((s) => s.id === targetSlideId);
    if (!file || !targetSlideId || !targetSlideObj) return;

    setUploadError('');
    setLastFailedUpload(null);

    const isMobileSlot = targetField.includes('mobile');
    const isVideoField = targetField.includes('Video');
    const mediaCategory = isMobileSlot ? 'hero_mobile' : 'hero_desktop';

    // Validate before creating temporary preview URL
    try {
      validateSelectedMediaFile(file, isVideoField ? 'video' : 'image');
    } catch (validationErr) {
      const msg =
        validationErr instanceof Error
          ? validationErr.message
          : 'Invalid file format selected.';
      setUploadError(msg);
      notify('Media Validation Notice', msg, 'error');
      return;
    }

    // Preserve previous permanent URL in case upload is cancelled or fails
    const previousUrlValue = targetSlideObj[targetField];
    const previousFallbackValue = targetSlideObj.fallbackImageUrl;
    const previousMediaMode = targetSlideObj.mediaMode;

    // 1. Create instant temporary blob preview URL so the Admin Live Preview updates immediately
    const tempPreviewUrl = URL.createObjectURL(file);
    activeTempObjectUrlsRef.current.push(tempPreviewUrl);

    // Switch preview viewport & mediaMode automatically so the admin sees the exact uploaded media right away
    setPreviewDevice(isMobileSlot ? 'mobile' : 'desktop');
    patchSlideById(
      targetSlideId,
      isVideoField
        ? {
            [targetField]: tempPreviewUrl,
            mediaMode: 'video',
          }
        : {
            [targetField]: tempPreviewUrl,
            mediaMode: 'image',
            fallbackImageUrl:
              targetField === 'desktopImageUrl'
                ? tempPreviewUrl
                : targetSlideObj.fallbackImageUrl,
          },
      true
    );

    setPublicationStatus('uploading');
    setActiveUploadLabel(
      `${file.name} (${isMobileSlot ? 'Mobile' : 'Desktop'} ${
        isVideoField ? 'MP4 Video' : 'Hero Image'
      })`
    );
    setUploadProgress(2);
    setUploadMetrics({
      percent: 2,
      loadedBytes: 0,
      totalBytes: file.size,
    });

    try {
      if (isVideoField) {
        const meta = await readVideoFileMetadata(
          file,
          mediaCategory,
          setUploadProgress,
          undefined,
          setUploadMetrics,
          (cancelFn) => {
            cancelUploadRef.current = cancelFn;
          }
        );

        // Strictly update ONLY the targeted video slot (Desktop OR Mobile) without overwriting the other slot
        const latestHero = localHeroRef.current;
        const nextSlides = latestHero.slides.map((s) => {
          if (s.id !== targetSlideId) return s;
          return {
            ...s,
            enabled: true,
            mediaMode: 'video' as const,
            desktopVideoUrl:
              targetField === 'desktopVideoUrl'
                ? meta.url
                : isDefaultPlaceholderUrl(s.desktopVideoUrl)
                ? ''
                : s.desktopVideoUrl,
            mobileVideoUrl:
              targetField === 'mobileVideoUrl'
                ? meta.url
                : isDefaultPlaceholderUrl(s.mobileVideoUrl)
                ? ''
                : s.mobileVideoUrl,
          };
        });

        const nextHeroConfig: HeroConfig = {
          ...latestHero,
          slides: nextSlides,
        };
        setLocalHero(nextHeroConfig);
        localHeroRef.current = nextHeroConfig;

        const customThumb = !isDefaultPlaceholderUrl(targetSlideObj.desktopImageUrl)
          ? targetSlideObj.desktopImageUrl
          : undefined;

        const newLibItem: MediaLibraryItem = {
          id: meta.mediaId,
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          fileType: meta.fileType,
          mediaType: 'video',
          mediaCategory: meta.mediaCategory,
          deviceTarget: isMobileSlot ? 'mobile' : 'desktop',
          url: meta.url,
          downloadUrl: meta.downloadUrl,
          storagePath: meta.storagePath,
          thumbnailUrl: customThumb,
          fileSizeBytes: meta.sizeBytes,
          dimensions: meta.dimensions,
          durationSeconds: meta.durationSeconds,
          uploadedAt: meta.uploadedAt,
        };
        await updateMediaLibrary([newLibItem, ...mediaLibrary], true);
        await updateHeroConfig(nextHeroConfig, true);
        setHasUnsavedStudioChanges(false);
        setUploadProgress(100);
        setPublicationStatus('published');
        notify(
          `${isMobileSlot ? 'Mobile' : 'Desktop'} Hero Video Published`,
          `${file.name} (${meta.dimensions}, ${meta.durationSeconds}s) is saved and playing live.`,
          'success'
        );
      } else {
        const meta = await readImageFileMetadata(
          file,
          mediaCategory,
          setUploadProgress,
          undefined,
          setUploadMetrics,
          (cancelFn) => {
            cancelUploadRef.current = cancelFn;
          }
        );

        // Strictly update ONLY the targeted image slot (Desktop OR Mobile)
        const latestHero = localHeroRef.current;
        const nextSlides = latestHero.slides.map((s) => {
          if (s.id !== targetSlideId) return s;
          return {
            ...s,
            enabled: true,
            mediaMode: 'image' as const,
            desktopImageUrl:
              targetField === 'desktopImageUrl' ? meta.dataUrl : s.desktopImageUrl,
            mobileImageUrl:
              targetField === 'mobileImageUrl' ? meta.dataUrl : s.mobileImageUrl,
            fallbackImageUrl:
              targetField === 'desktopImageUrl' || isDefaultPlaceholderUrl(previousFallbackValue)
                ? meta.dataUrl
                : previousFallbackValue,
          };
        });

        const nextHeroConfig: HeroConfig = {
          ...latestHero,
          slides: nextSlides,
        };
        setLocalHero(nextHeroConfig);
        localHeroRef.current = nextHeroConfig;

        const newLibItem: MediaLibraryItem = {
          id: meta.mediaId,
          title: file.name.replace(/\.[^.]+$/, ''),
          fileName: file.name,
          fileType: meta.fileType,
          mediaType: 'image',
          mediaCategory: meta.mediaCategory,
          deviceTarget: isMobileSlot ? 'mobile' : 'desktop',
          url: meta.dataUrl,
          downloadUrl: meta.downloadUrl,
          storagePath: meta.storagePath,
          fileSizeBytes: meta.sizeBytes,
          dimensions: meta.dimensions,
          uploadedAt: meta.uploadedAt,
        };
        await updateMediaLibrary([newLibItem, ...mediaLibrary], true);
        await updateHeroConfig(nextHeroConfig, true);
        setHasUnsavedStudioChanges(false);
        setUploadProgress(100);
        setPublicationStatus('published');
        notify(
          `${isMobileSlot ? 'Mobile' : 'Desktop'} Hero Image Published`,
          `${file.name} (${meta.dimensions}) is now live on the Hero Section.`,
          'success'
        );
      }
    } catch (err) {
      // Revert temporary blob URL back to previous permanent URL on failure or cancel
      patchSlideById(
        targetSlideId,
        {
          [targetField]: previousUrlValue,
          fallbackImageUrl: previousFallbackValue,
          mediaMode: previousMediaMode,
        },
        false
      );
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
      setPublicationStatus(hasUnsavedStudioChanges ? 'unsaved' : 'published');
      if (!msg.toLowerCase().includes('cancelled')) {
        setLastFailedUpload({
          file,
          targetField,
          slideId: targetSlideId,
        });
      }
      notify('Media Upload Notice', msg, 'error');
    } finally {
      cancelUploadRef.current = null;
      // Revoke temporary preview blob URL now that permanent URL or revert is applied
      try {
        URL.revokeObjectURL(tempPreviewUrl);
      } catch {
        // ignore
      }
      activeTempObjectUrlsRef.current = activeTempObjectUrlsRef.current.filter(
        (u) => u !== tempPreviewUrl
      );
      window.setTimeout(() => {
        setUploadProgress(0);
        setUploadMetrics(null);
        setActiveUploadLabel('');
      }, 700);
    }
  };

  const handleSaveHeroAsDraft = async () => {
    if (publicationStatus === 'uploading' || configContainsTemporaryBlobUrl(localHero)) {
      notify(
        'Upload in Progress',
        'Please wait for the media upload to finish before saving a draft.',
        'error'
      );
      return;
    }
    try {
      await saveHeroDraft(localHero);
      setPublicationStatus('draft');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save hero draft.';
      setUploadError(msg);
    }
  };

  const handlePublishHeroToWebsite = async () => {
    if (publicationStatus === 'uploading' || configContainsTemporaryBlobUrl(localHero)) {
      notify(
        'Upload Still in Progress',
        'Please wait for your media upload to complete before publishing to the live website.',
        'error'
      );
      return;
    }
    setUploadError('');
    setPublicationStatus('publishing');
    try {
      // Ensure all permanent media URLs have cache-busting version query parameters
      const sanitizedSlides = localHero.slides.map((slide) => ({
        ...slide,
        desktopImageUrl: ensureVersionedMediaUrl(slide.desktopImageUrl),
        mobileImageUrl: ensureVersionedMediaUrl(slide.mobileImageUrl),
        desktopVideoUrl: isDefaultPlaceholderUrl(slide.desktopVideoUrl)
          ? ''
          : ensureVersionedMediaUrl(slide.desktopVideoUrl),
        mobileVideoUrl: isDefaultPlaceholderUrl(slide.mobileVideoUrl)
          ? ''
          : ensureVersionedMediaUrl(slide.mobileVideoUrl),
        fallbackImageUrl: ensureVersionedMediaUrl(slide.fallbackImageUrl),
      }));
      const configToPublish: HeroConfig = {
        ...localHero,
        slides: sanitizedSlides,
      };
      setLocalHero(configToPublish);
      localHeroRef.current = configToPublish;
      await updateHeroConfig(configToPublish, true);
      await updateNewArrivalsConfig(newArrivalsConfig, true);
      setHasUnsavedStudioChanges(false);
      setPublicationStatus('published');
    } catch (err) {
      setPublicationStatus('unsaved');
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to publish Hero configuration to Firestore.';
      setUploadError(msg);
      notify('Publish Failed', msg, 'error');
    }
  };

  const assignFromMediaLibrary = (
    mediaUrl: string,
    targetField: HeroMediaSlotField
  ) => {
    if (!mediaUrl || !selectedSlide) return;
    const isVideoField = targetField.includes('Video');
    const isMobileSlot = targetField.includes('mobile');
    const versioned = ensureVersionedMediaUrl(mediaUrl);
    setPreviewDevice(isMobileSlot ? 'mobile' : 'desktop');
    if (isVideoField) {
      patchSlide({
        enabled: true,
        [targetField]: versioned,
        mediaMode: 'video',
      });
    } else {
      patchSlide({
        enabled: true,
        [targetField]: versioned,
        mediaMode: 'image',
        fallbackImageUrl:
          targetField === 'desktopImageUrl' ||
          isDefaultPlaceholderUrl(selectedSlide.fallbackImageUrl)
            ? versioned
            : selectedSlide.fallbackImageUrl,
      });
    }
    notify(
      'Assigned from Media Library',
      `Applied asset to ${targetField}. Click "Publish Changes" to update the live website.`,
      'info'
    );
  };

  const addNewSlide = () => {
    const newId = `hero-slide-${Date.now().toString().slice(-5)}`;
    const newSlide: HeroSlide = {
      id: newId,
      enabled: true,
      order: localHero.slides.length + 1,
      mediaMode: 'image',
      desktopImageUrl: createCinematicHeroBackdropSvg({
        bgStart: '#0E0F12',
        bgMid: '#1C1D22',
        bgEnd: '#2A2C32',
        glowColor: '#E5E0D5',
        accentTone: '#A1A1AA',
        editionLabel: `VYNOOX SLIDE 0${localHero.slides.length + 1} · CUSTOM CAMPAIGN`,
        aspect: 'desktop',
      }),
      mobileImageUrl: HERO_CAMPAIGN_MOBILE_SVG,
      desktopVideoUrl: DEFAULT_CINEMATIC_MP4_URL,
      mobileVideoUrl: DEFAULT_CINEMATIC_MP4_URL,
      fallbackImageUrl: HERO_CAMPAIGN_SVG,
      focalPoint: 'center center',
      videoScale: 'cover',
      overlayColor: '#000000',
      overlayOpacity: 44,
      brandLabel: 'VYNOOX LIMITED RELEASE',
      heading: 'New Season Architectural Streetwear.',
      description:
        'Customize this slide with full-screen desktop/mobile photography or MP4 background video.',
      primaryButtonText: 'Shop New Arrivals',
      primaryButtonLink: 'new-arrivals',
      primaryButtonStyle: 'solid-light',
      secondaryButtonText: 'View Collections',
      secondaryButtonLink: 'collections',
      secondaryButtonStyle: 'outline-light',
      fontFamily: 'Cormorant Garamond',
      fontSize: 'display',
      fontWeight: '600',
      textColor: '#FAF9F6',
      textAlign: 'left',
      textPosition: 'bottom-left',
      textSpacing: 'normal',
      durationSeconds: 7,
    };
    const nextSlides = [...localHero.slides, newSlide];
    patchHeroGlobal({ slides: nextSlides });
    setSelectedSlideId(newId);
  };

  const duplicateSlide = (slide: HeroSlide) => {
    const dupId = `${slide.id}-copy-${Date.now().toString().slice(-4)}`;
    const dup: HeroSlide = {
      ...slide,
      id: dupId,
      heading: `${slide.heading} (Copy)`,
      order: localHero.slides.length + 1,
    };
    const nextSlides = [...localHero.slides, dup];
    patchHeroGlobal({ slides: nextSlides });
    setSelectedSlideId(dupId);
  };

  const deleteSlide = (slideId: string) => {
    if (localHero.slides.length <= 1) {
      notify('Cannot Delete Last Slide', 'At least one hero slide is required.', 'error');
      return;
    }
    const nextSlides = localHero.slides
      .filter((s) => s.id !== slideId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));
    patchHeroGlobal({ slides: nextSlides });
    setSelectedSlideId(nextSlides[0].id);
  };

  const moveSlide = (idx: number, direction: -1 | 1) => {
    const sorted = [...localHero.slides].sort((a, b) => a.order - b.order);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const temp = sorted[idx].order;
    sorted[idx].order = sorted[targetIdx].order;
    sorted[targetIdx].order = temp;
    patchHeroGlobal({ slides: [...sorted].sort((a, b) => a.order - b.order) });
  };

  const availableLibraryImages = mediaLibrary.filter((m) => m.mediaType === 'image');
  const availableLibraryVideos = mediaLibrary.filter((m) => m.mediaType === 'video');

  return (
    <div className="space-y-6">
      {/* Top Action Bar: State Indicator + Save Draft / Load Draft / Publish Changes */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 border border-neutral-200 dark:border-neutral-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
              NO-CODE CINEMATIC STOREFRONT STUDIO
            </span>
            {publicationStatus === 'uploading' && (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[10px] uppercase font-semibold">
                STATE: UPLOADING MEDIA ({uploadProgress}%)
              </span>
            )}
            {publicationStatus === 'draft' && (
              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] uppercase font-semibold">
                STATE: SAVED AS DRAFT (NOT LIVE TO CUSTOMERS)
              </span>
            )}
            {publicationStatus === 'unsaved' && (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-mono text-[10px] uppercase font-semibold">
                STATE: UNPUBLISHED PREVIEW CHANGES
              </span>
            )}
            {publicationStatus === 'publishing' && (
              <span className="px-2.5 py-0.5 bg-neutral-900 text-white font-mono text-[10px] uppercase font-semibold">
                STATE: PUBLISHING TO LIVE WEBSITE...
              </span>
            )}
            {publicationStatus === 'published' && (
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] uppercase font-semibold">
                STATE: PUBLISHED ON LIVE WEBSITE
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">
            Full-Screen Hero, Slideshow &amp; New Arrivals Studio
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {heroDraftConfig && (
            <button
              type="button"
              onClick={() => {
                setLocalHero(heroDraftConfig);
                setHasUnsavedStudioChanges(true);
                setPublicationStatus('draft');
                notify(
                  'Draft Loaded into Studio Preview',
                  'Loaded your saved hero draft into the studio preview without affecting live customers.',
                  'info'
                );
              }}
              className="px-3.5 py-2 border border-neutral-300 text-xs font-mono uppercase hover:border-neutral-900"
            >
              Load Saved Draft
            </button>
          )}
          <button
            type="button"
            disabled={publicationStatus === 'uploading' || publicationStatus === 'publishing'}
            onClick={handleSaveHeroAsDraft}
            className="px-4 py-2 border border-neutral-900 text-xs font-mono uppercase font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-100 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save as Draft</span>
          </button>
          <button
            type="button"
            disabled={publicationStatus === 'uploading' || publicationStatus === 'publishing'}
            onClick={handlePublishHeroToWebsite}
            className="px-5 py-2 bg-neutral-900 text-white text-xs font-mono uppercase tracking-wider font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-800 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            <span>
              {publicationStatus === 'publishing'
                ? 'Publishing...'
                : 'Publish Changes to Live Homepage'}
            </span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        {[
          { id: 'slides', label: '1. Hero Slides, Media Mode & Transparent Overlay' },
          { id: 'display', label: '2. Hero Height, Responsive Viewports & Slideshow Timing' },
          { id: 'new-arrivals', label: '3. New Arrivals Product Showcase (Below Hero)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStudioTab(tab.id as typeof activeStudioTab)}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${
              activeStudioTab === tab.id
                ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                : 'bg-white border-neutral-300 hover:border-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SLIDES + MEDIA MODE + TRANSPARENT TEXT OVERLAY */}
      {activeStudioTab === 'slides' && selectedSlide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Slides List */}
          <div className="lg:col-span-4 bg-white border border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5">
              <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">
                HERO SLIDES ({localHero.slides.length})
              </span>
              <button
                type="button"
                onClick={addNewSlide}
                className="px-3 py-1 bg-neutral-900 text-white text-[11px] font-mono uppercase inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Slide</span>
              </button>
            </div>

            <div className="space-y-2">
              {[...localHero.slides]
                .sort((a, b) => a.order - b.order)
                .map((slide, idx, arr) => (
                  <div
                    key={slide.id}
                    onClick={() => setSelectedSlideId(slide.id)}
                    className={`p-3 border cursor-pointer transition-colors text-xs space-y-2 ${
                      selectedSlide.id === slide.id
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-neutral-400">0{idx + 1}</span>
                        <span className="font-semibold truncate">{slide.heading}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-neutral-900 text-white font-mono text-[10px] uppercase shrink-0">
                        {slide.mediaMode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSlide(idx, -1);
                          }}
                          className="p-1 hover:bg-neutral-200 disabled:opacity-30"
                          title="Move Slide Up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveSlide(idx, 1);
                          }}
                          className="p-1 hover:bg-neutral-200 disabled:opacity-30"
                          title="Move Slide Down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(slide);
                          }}
                          className="p-1 hover:bg-neutral-200"
                          title="Duplicate Slide"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSlide(slide.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50"
                          title="Delete Slide"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextSlides = localHero.slides.map((s) =>
                            s.id === slide.id ? { ...s, enabled: !s.enabled } : s
                          );
                          patchHeroGlobal({ slides: nextSlides });
                        }}
                        className={`px-2 py-0.5 font-mono text-[10px] border ${
                          slide.enabled
                            ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                            : 'border-neutral-300 text-neutral-400'
                        }`}
                      >
                        {slide.enabled ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Right Column: Slide Media Mode & Transparent Overlay Editor */}
          <div className="lg:col-span-8 bg-white border border-neutral-200 p-6 space-y-6 text-xs">
            {/* Media Mode Switcher: Full-Screen Image Mode vs Full-Screen Video Mode */}
            <div className="p-4 bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[11px] uppercase text-neutral-500 block">
                  HERO MEDIA ENGINE · ACTIVE MODE: {selectedSlide.mediaMode.toUpperCase()}
                </span>
                <h3 className="font-bold text-sm">
                  Switch Between Full-Screen Image Mode &amp; Full-Screen Video Mode
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => patchSlide({ mediaMode: 'image' })}
                  className={`px-4 py-2 font-mono uppercase inline-flex items-center gap-1.5 border ${
                    selectedSlide.mediaMode === 'image'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                      : 'bg-white border-neutral-300'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Full-Screen Image Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => patchSlide({ mediaMode: 'video' })}
                  className={`px-4 py-2 font-mono uppercase inline-flex items-center gap-1.5 border ${
                    selectedSlide.mediaMode === 'video'
                      ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                      : 'bg-white border-neutral-300'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Full-Screen Video Mode (MP4)</span>
                </button>
              </div>
            </div>

            {(uploadProgress > 0 || publicationStatus === 'uploading') && (
              <div className="p-4 bg-neutral-50 border border-neutral-900 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="font-semibold">
                    Streaming Direct Binary Upload: {activeUploadLabel || 'Media Asset'}
                  </span>
                  <div className="flex items-center gap-3">
                    {uploadMetrics && (
                      <span className="text-neutral-600 tabular-nums">
                        {formatMegabytesPair(
                          uploadMetrics.loadedBytes,
                          uploadMetrics.totalBytes
                        )}
                      </span>
                    )}
                    <span className="font-bold tabular-nums">{uploadProgress}%</span>
                    <button
                      type="button"
                      onClick={handleCancelActiveUpload}
                      className="px-2.5 py-0.5 bg-red-600 text-white uppercase text-[10px] inline-flex items-center gap-1 hover:bg-red-700"
                    >
                      <X className="h-3 w-3" />
                      <span>Cancel Upload</span>
                    </button>
                  </div>
                </div>
                <div className="w-full h-2 bg-neutral-200">
                  <div
                    style={{ width: `${uploadProgress}%` }}
                    className="h-full bg-neutral-900 transition-all"
                  />
                </div>
                <p className="text-[11px] font-mono text-neutral-500">
                  Live preview below is already displaying your selected file while the original uncompressed asset streams to storage.
                </p>
              </div>
            )}

            {uploadError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 font-mono flex flex-wrap items-center justify-between gap-3">
                <span>{uploadError}</span>
                <div className="flex items-center gap-2">
                  {lastFailedUpload && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSlideMediaUpload(
                          lastFailedUpload.file,
                          lastFailedUpload.targetField,
                          lastFailedUpload.slideId
                        )
                      }
                      className="px-3 py-1 bg-neutral-900 text-white uppercase text-[10px] font-semibold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Retry Upload</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setUploadError('')}
                    className="underline text-[10px]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Desktop & Mobile Independent Media Upload / Selection / Mini Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Desktop Hero Image */}
              <div className="p-4 border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold">
                    1. Desktop Hero Image (16:9 Edge-to-Edge)
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    JPG / PNG / WEBP
                  </span>
                </div>
                <div className="aspect-video w-full bg-neutral-900 border border-neutral-200 overflow-hidden relative">
                  {selectedSlide.desktopImageUrl ? (
                    <img
                      src={selectedSlide.desktopImageUrl}
                      alt="Desktop Hero Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-[11px]">
                      No Desktop Image Assigned
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={selectedSlide.desktopImageUrl}
                  onChange={(e) =>
                    patchSlide({
                      desktopImageUrl: e.target.value,
                      fallbackImageUrl: e.target.value || selectedSlide.fallbackImageUrl,
                    })
                  }
                  placeholder="Paste desktop image URL or upload below..."
                  className="w-full px-3 py-1.5 border border-neutral-300 font-mono text-[11px]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-neutral-900 text-white font-mono text-[11px] uppercase cursor-pointer inline-flex items-center gap-1.5 hover:bg-neutral-800">
                    <Upload className="h-3 w-3" />
                    <span>Upload Desktop Image</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        handleSlideMediaUpload(e.target.files?.[0], 'desktopImageUrl');
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {availableLibraryImages.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          assignFromMediaLibrary(e.target.value, 'desktopImageUrl');
                        }
                      }}
                      className="px-2.5 py-1.5 border border-neutral-300 bg-white font-mono text-[10px] uppercase"
                    >
                      <option value="">Select from Media Library...</option>
                      {availableLibraryImages.map((img) => (
                        <option key={img.id} value={img.url}>
                          {img.title} ({img.dimensions})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 2. Mobile Hero Image */}
              <div className="p-4 border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold">
                    2. Mobile Hero Image (9:16 Portrait)
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    JPG / PNG / WEBP
                  </span>
                </div>
                <div className="aspect-video w-full bg-neutral-900 border border-neutral-200 overflow-hidden relative">
                  {selectedSlide.mobileImageUrl ? (
                    <img
                      src={selectedSlide.mobileImageUrl}
                      alt="Mobile Hero Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 font-mono text-[11px]">
                      Falls back to Desktop Hero Image
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={selectedSlide.mobileImageUrl}
                  onChange={(e) => patchSlide({ mobileImageUrl: e.target.value })}
                  placeholder="Paste mobile image URL or upload below..."
                  className="w-full px-3 py-1.5 border border-neutral-300 font-mono text-[11px]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-neutral-900 text-white font-mono text-[11px] uppercase cursor-pointer inline-flex items-center gap-1.5 hover:bg-neutral-800">
                    <Upload className="h-3 w-3" />
                    <span>Upload Mobile Image</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        handleSlideMediaUpload(e.target.files?.[0], 'mobileImageUrl');
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {availableLibraryImages.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          assignFromMediaLibrary(e.target.value, 'mobileImageUrl');
                        }
                      }}
                      className="px-2.5 py-1.5 border border-neutral-300 bg-white font-mono text-[10px] uppercase"
                    >
                      <option value="">Select from Media Library...</option>
                      {availableLibraryImages.map((img) => (
                        <option key={img.id} value={img.url}>
                          {img.title} ({img.dimensions})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 3. Desktop Hero Video (MP4) */}
              <div className="p-4 border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold">
                    3. Desktop Hero Video (MP4 Autoplay Loop)
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    MP4 · UP TO {MAX_VIDEO_UPLOAD_MB} MB
                  </span>
                </div>
                <AdminHeroVideoPreview
                  videoUrl={selectedSlide.desktopVideoUrl}
                  slotLabel="Desktop Hero Video"
                  emptyMessage="No Desktop Video Assigned — Upload an MP4 below"
                  isMobilePortrait={false}
                />
                <input
                  type="text"
                  value={
                    isDefaultPlaceholderUrl(selectedSlide.desktopVideoUrl)
                      ? ''
                      : selectedSlide.desktopVideoUrl
                  }
                  onChange={(e) =>
                    patchSlide({
                      desktopVideoUrl: e.target.value,
                      mediaMode: e.target.value ? 'video' : selectedSlide.mediaMode,
                    })
                  }
                  placeholder="/api/media/files/hero_desktop/your-video.mp4"
                  className="w-full px-3 py-1.5 border border-neutral-300 font-mono text-[11px]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 border border-neutral-900 bg-neutral-900 text-white font-mono text-[11px] uppercase cursor-pointer inline-flex items-center gap-1.5 hover:bg-neutral-800">
                    <Film className="h-3 w-3" />
                    <span>Upload Desktop MP4</span>
                    <input
                      type="file"
                      accept=".mp4,video/mp4"
                      onChange={(e) => {
                        handleSlideMediaUpload(e.target.files?.[0], 'desktopVideoUrl');
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {availableLibraryVideos.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          assignFromMediaLibrary(e.target.value, 'desktopVideoUrl');
                        }
                      }}
                      className="px-2.5 py-1.5 border border-neutral-300 bg-white font-mono text-[10px] uppercase"
                    >
                      <option value="">Select MP4 from Library...</option>
                      {availableLibraryVideos.map((vid) => (
                        <option key={vid.id} value={vid.url}>
                          {vid.title} ({vid.durationSeconds || 10}s)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 4. Mobile Hero Video (MP4) */}
              <div className="p-4 border border-neutral-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold">
                    4. Mobile Hero Video (MP4 Portrait / Autoplay)
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    MP4 · UP TO {MAX_VIDEO_UPLOAD_MB} MB
                  </span>
                </div>
                <AdminHeroVideoPreview
                  videoUrl={selectedSlide.mobileVideoUrl}
                  slotLabel="Mobile Hero Video"
                  emptyMessage="No Dedicated Mobile MP4 Assigned (Storefront falls back to Desktop Hero Video)"
                  isMobilePortrait={true}
                />
                <input
                  type="text"
                  value={
                    isDefaultPlaceholderUrl(selectedSlide.mobileVideoUrl)
                      ? ''
                      : selectedSlide.mobileVideoUrl
                  }
                  onChange={(e) =>
                    patchSlide({
                      mobileVideoUrl: e.target.value,
                      mediaMode: e.target.value ? 'video' : selectedSlide.mediaMode,
                    })
                  }
                  placeholder="/api/media/files/hero_mobile/your-mobile-video.mp4"
                  className="w-full px-3 py-1.5 border border-neutral-300 font-mono text-[11px]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 border border-neutral-900 bg-neutral-900 text-white font-mono text-[11px] uppercase cursor-pointer inline-flex items-center gap-1.5 hover:bg-neutral-800">
                    <Film className="h-3 w-3" />
                    <span>Upload Mobile MP4</span>
                    <input
                      type="file"
                      accept=".mp4,video/mp4"
                      onChange={(e) => {
                        handleSlideMediaUpload(e.target.files?.[0], 'mobileVideoUrl');
                        e.currentTarget.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  {availableLibraryVideos.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          assignFromMediaLibrary(e.target.value, 'mobileVideoUrl');
                        }
                      }}
                      className="px-2.5 py-1.5 border border-neutral-300 bg-white font-mono text-[10px] uppercase"
                    >
                      <option value="">Select MP4 from Library...</option>
                      {availableLibraryVideos.map((vid) => (
                        <option key={vid.id} value={vid.url}>
                          {vid.title} ({vid.durationSeconds || 10}s)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Transparent Text Overlay Content & Positioning */}
            <div className="border-t pt-5 space-y-4">
              <h3 className="font-bold text-sm">
                Transparent Text Overlay &amp; CTA Buttons (No Background Box)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Small Brand Label</label>
                  <input
                    type="text"
                    value={selectedSlide.brandLabel}
                    onChange={(e) => patchSlide({ brandLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Main Headline</label>
                  <input
                    type="text"
                    value={selectedSlide.heading}
                    onChange={(e) => patchSlide({ heading: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 text-sm"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block font-semibold mb-1">Short Description</label>
                  <textarea
                    rows={2}
                    value={selectedSlide.description}
                    onChange={(e) => patchSlide({ description: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>

                {/* Primary & Secondary Buttons */}
                <div>
                  <label className="block font-semibold mb-1">Primary CTA Button Text</label>
                  <input
                    type="text"
                    value={selectedSlide.primaryButtonText}
                    onChange={(e) => patchSlide({ primaryButtonText: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Primary CTA Link</label>
                  <select
                    value={selectedSlide.primaryButtonLink}
                    onChange={(e) =>
                      patchSlide({ primaryButtonLink: e.target.value as StorePageId })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="new-arrivals">New Arrivals</option>
                    <option value="shop-all">Shop All</option>
                    <option value="best-sellers">Best Sellers</option>
                    <option value="collections">Collections</option>
                    <option value="about-us">About Us</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Primary Button Style</label>
                  <select
                    value={selectedSlide.primaryButtonStyle}
                    onChange={(e) =>
                      patchSlide({ primaryButtonStyle: e.target.value as HeroButtonStyle })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="solid-light">Solid Ivory Light</option>
                    <option value="solid-dark">Solid Obsidian Dark</option>
                    <option value="outline-light">Transparent Outline</option>
                    <option value="glass-minimal">Minimal Frosted Glass</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Secondary CTA Button Text</label>
                  <input
                    type="text"
                    value={selectedSlide.secondaryButtonText}
                    onChange={(e) => patchSlide({ secondaryButtonText: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Secondary CTA Link</label>
                  <select
                    value={selectedSlide.secondaryButtonLink}
                    onChange={(e) =>
                      patchSlide({ secondaryButtonLink: e.target.value as StorePageId })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="collections">Collections</option>
                    <option value="shop-all">Shop All</option>
                    <option value="new-arrivals">New Arrivals</option>
                    <option value="best-sellers">Best Sellers</option>
                    <option value="about-us">About Us</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Secondary Button Style</label>
                  <select
                    value={selectedSlide.secondaryButtonStyle}
                    onChange={(e) =>
                      patchSlide({
                        secondaryButtonStyle: e.target.value as HeroButtonStyle,
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="outline-light">Transparent Outline</option>
                    <option value="glass-minimal">Minimal Frosted Glass</option>
                    <option value="solid-light">Solid Ivory Light</option>
                    <option value="solid-dark">Solid Obsidian Dark</option>
                  </select>
                </div>

                {/* Typography, Alignment & 6-Point Positioning */}
                <div>
                  <label className="block font-semibold mb-1">Overlay Position (6 Zones)</label>
                  <select
                    value={selectedSlide.textPosition}
                    onChange={(e) =>
                      patchSlide({ textPosition: e.target.value as HeroTextPosition })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="center">Center</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Text Alignment</label>
                  <select
                    value={selectedSlide.textAlign}
                    onChange={(e) =>
                      patchSlide({
                        textAlign: e.target.value as HeroSlide['textAlign'],
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Headline Font Family</label>
                  <select
                    value={selectedSlide.fontFamily}
                    onChange={(e) =>
                      patchSlide({
                        fontFamily: e.target.value as HeroSlide['fontFamily'],
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="Cormorant Garamond">Cormorant Garamond (Luxury Serif)</option>
                    <option value="Outfit">Outfit (Architectural Sans)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern Geometric)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Technical)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Headline Scale</label>
                  <select
                    value={selectedSlide.fontSize}
                    onChange={(e) =>
                      patchSlide({ fontSize: e.target.value as HeroSlide['fontSize'] })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="display">Display XL (Cinematic)</option>
                    <option value="xl">Extra Large</option>
                    <option value="lg">Large</option>
                    <option value="md">Medium</option>
                    <option value="sm">Compact</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Font Weight</label>
                  <select
                    value={selectedSlide.fontWeight}
                    onChange={(e) =>
                      patchSlide({
                        fontWeight: e.target.value as HeroSlide['fontWeight'],
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="300">300 Light</option>
                    <option value="400">400 Regular</option>
                    <option value="500">500 Medium</option>
                    <option value="600">600 Semi-Bold</option>
                    <option value="700">700 Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Text Spacing</label>
                  <select
                    value={selectedSlide.textSpacing}
                    onChange={(e) =>
                      patchSlide({
                        textSpacing: e.target.value as HeroSlide['textSpacing'],
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="compact">Compact</option>
                    <option value="normal">Standard</option>
                    <option value="relaxed">Relaxed Editorial</option>
                    <option value="expansive">Expansive Luxury</option>
                  </select>
                </div>

                {/* Colors, Overlay Opacity, Focal Point & Slide Duration */}
                <div>
                  <label className="block font-semibold mb-1">Text Color</label>
                  <input
                    type="color"
                    value={selectedSlide.textColor || '#FAF9F6'}
                    onChange={(e) => patchSlide({ textColor: e.target.value })}
                    className="w-full h-9 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Overlay Tint Color</label>
                  <input
                    type="color"
                    value={selectedSlide.overlayColor || '#000000'}
                    onChange={(e) => patchSlide({ overlayColor: e.target.value })}
                    className="w-full h-9 border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Overlay Opacity ({selectedSlide.overlayOpacity}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={85}
                    value={selectedSlide.overlayOpacity}
                    onChange={(e) =>
                      patchSlide({ overlayOpacity: Number(e.target.value) })
                    }
                    className="w-full mt-2"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Background Focal Point / Position
                  </label>
                  <select
                    value={selectedSlide.focalPoint}
                    onChange={(e) => patchSlide({ focalPoint: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="center center">Center (50% 50%)</option>
                    <option value="top center">Top Center (50% 15%)</option>
                    <option value="50% 35%">Upper Editorial (50% 35%)</option>
                    <option value="bottom center">Bottom Center (50% 85%)</option>
                    <option value="left center">Left Focus (25% 50%)</option>
                    <option value="right center">Right Focus (75% 50%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Video Scaling Fit</label>
                  <select
                    value={selectedSlide.videoScale}
                    onChange={(e) =>
                      patchSlide({
                        videoScale: e.target.value as 'cover' | 'contain',
                      })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 bg-white"
                  >
                    <option value="cover">Full-Bleed Cover (Edge-to-Edge)</option>
                    <option value="contain">Letterbox Contain</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Slide Display Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    value={selectedSlide.durationSeconds}
                    onChange={(e) =>
                      patchSlide({ durationSeconds: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HERO HEIGHT & DISPLAY SETTINGS */}
      {activeStudioTab === 'display' && (
        <div className="bg-white border border-neutral-200 p-6 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div>
            <label className="block font-semibold mb-1">Hero Height Preset</label>
            <select
              value={localHero.heightPreset}
              onChange={(e) =>
                patchHeroGlobal({
                  heightPreset: e.target.value as HeroHeightPreset,
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 bg-white"
            >
              <option value="100vh">Full Screen (100vh)</option>
              <option value="85vh">Large (85vh)</option>
              <option value="70vh">Medium (70vh)</option>
              <option value="custom">Custom Responsive Heights</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Desktop Custom Height</label>
            <input
              type="text"
              value={localHero.desktopHeight}
              onChange={(e) => patchHeroGlobal({ desktopHeight: e.target.value })}
              placeholder="e.g. 95vh or 860px"
              className="w-full px-3 py-2 border border-neutral-300 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Tablet Custom Height</label>
            <input
              type="text"
              value={localHero.tabletHeight}
              onChange={(e) => patchHeroGlobal({ tabletHeight: e.target.value })}
              placeholder="e.g. 85vh"
              className="w-full px-3 py-2 border border-neutral-300 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Mobile Custom Height</label>
            <input
              type="text"
              value={localHero.mobileHeight}
              onChange={(e) => patchHeroGlobal({ mobileHeight: e.target.value })}
              placeholder="e.g. 80vh"
              className="w-full px-3 py-2 border border-neutral-300 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Text Content Max Width</label>
            <select
              value={localHero.contentMaxWidth}
              onChange={(e) => patchHeroGlobal({ contentMaxWidth: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 bg-white"
            >
              <option value="640px">Compact Editorial (640px)</option>
              <option value="820px">Standard Cinema (820px)</option>
              <option value="980px">Wide Architectural (980px)</option>
              <option value="1180px">Expansive Full (1180px)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Default Slideshow Interval (Seconds)
            </label>
            <input
              type="number"
              min={2}
              max={60}
              value={localHero.defaultSlideDurationSeconds}
              onChange={(e) =>
                patchHeroGlobal({
                  defaultSlideDurationSeconds: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 font-mono"
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={localHero.autoSlideshow}
              onChange={(e) => patchHeroGlobal({ autoSlideshow: e.target.checked })}
            />
            <span className="font-semibold">Enable Automatic Slideshow Rotation</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={localHero.showManualNav}
              onChange={(e) => patchHeroGlobal({ showManualNav: e.target.checked })}
            />
            <span className="font-semibold">Show Manual Navigation Arrows &amp; Bars</span>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              checked={localHero.enableTextAnimations}
              onChange={(e) =>
                patchHeroGlobal({ enableTextAnimations: e.target.checked })
              }
            />
            <span className="font-semibold">Enable Subtle Text Entrance Animations</span>
          </div>
        </div>
      )}

      {/* TAB 3: NEW ARRIVALS PRODUCT SHOWCASE BELOW HERO */}
      {activeStudioTab === 'new-arrivals' && (
        <div className="bg-white border border-neutral-200 p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Section Heading</label>
              <input
                type="text"
                value={newArrivalsConfig.heading}
                onChange={(e) =>
                  updateNewArrivalsConfig(
                    { ...newArrivalsConfig, heading: e.target.value },
                    false
                  )
                }
                className="w-full px-3 py-2 border border-neutral-300"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Section Subtitle</label>
              <input
                type="text"
                value={newArrivalsConfig.subtitle}
                onChange={(e) =>
                  updateNewArrivalsConfig(
                    { ...newArrivalsConfig, subtitle: e.target.value },
                    false
                  )
                }
                className="w-full px-3 py-2 border border-neutral-300"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Number of Products</label>
              <select
                value={newArrivalsConfig.maxProducts}
                onChange={(e) =>
                  updateNewArrivalsConfig(
                    { ...newArrivalsConfig, maxProducts: Number(e.target.value) },
                    false
                  )
                }
                className="w-full px-3 py-2 border border-neutral-300 bg-white"
              >
                <option value={3}>3 Products</option>
                <option value={4}>4 Products</option>
                <option value={6}>6 Products</option>
                <option value={8}>8 Products</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Grid Columns (Desktop)</label>
              <select
                value={newArrivalsConfig.gridColumns}
                onChange={(e) =>
                  updateNewArrivalsConfig(
                    {
                      ...newArrivalsConfig,
                      gridColumns: Number(e.target.value) as 2 | 3 | 4,
                    },
                    false
                  )
                }
                className="w-full px-3 py-2 border border-neutral-300 bg-white"
              >
                <option value={2}>2 Columns (Editorial Large)</option>
                <option value={3}>3 Columns (Balanced Atelier)</option>
                <option value={4}>4 Columns (High Density)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Product Sort Order</label>
              <select
                value={newArrivalsConfig.productOrder}
                onChange={(e) =>
                  updateNewArrivalsConfig(
                    {
                      ...newArrivalsConfig,
                      productOrder:
                        e.target.value as typeof newArrivalsConfig.productOrder,
                    },
                    false
                  )
                }
                className="w-full px-3 py-2 border border-neutral-300 bg-white"
              >
                <option value="featured">Featured &amp; New Releases First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="manual">Manual Curated Selection</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Section Background Color</label>
              <input
                type="color"
                value={newArrivalsConfig.backgroundColor}
                onChange={(e) =>
                  updateNewArrivalsConfig(
                    { ...newArrivalsConfig, backgroundColor: e.target.value },
                    false
                  )
                }
                className="w-full h-9 border border-neutral-300"
              />
            </div>
          </div>

          {/* Select Specific Products to Feature */}
          <div className="border-t pt-4 space-y-2">
            <label className="block font-semibold">
              Curate Specific Products for New Arrivals Showcase (Leave all unchecked to auto-display New Arrivals)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {products.map((prod) => {
                const checked = newArrivalsConfig.selectedProductIds.includes(prod.id);
                return (
                  <label
                    key={prod.id}
                    className={`p-2.5 border flex items-center gap-3 cursor-pointer ${
                      checked ? 'border-neutral-900 bg-neutral-50 font-semibold' : 'border-neutral-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const nextIds = e.target.checked
                          ? [...newArrivalsConfig.selectedProductIds, prod.id]
                          : newArrivalsConfig.selectedProductIds.filter((id) => id !== prod.id);
                        updateNewArrivalsConfig(
                          { ...newArrivalsConfig, selectedProductIds: nextIds },
                          false
                        );
                      }}
                    />
                    <img
                      src={prod.primaryImage}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover border shrink-0"
                    />
                    <span className="truncate">{prod.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* LIVE INTERACTIVE DESKTOP / TABLET / MOBILE PREVIEW */}
      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 block">
              REAL-TIME INTERACTIVE PREVIEW · EDITING SLIDE: {selectedSlide?.heading || 'SLIDE 1'}
            </span>
            <h2 className="text-base font-bold">
              Live Hero &amp; New Arrivals Preview ({previewDevice.toUpperCase()} ·{' '}
              {selectedSlide?.mediaMode === 'video' ? 'VIDEO MODE' : 'IMAGE MODE'})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { id: 'desktop', label: 'Desktop', icon: Monitor },
                { id: 'tablet', label: 'Tablet', icon: Tablet },
                { id: 'mobile', label: 'Mobile', icon: Smartphone },
              ] as const
            ).map((vp) => {
              const Icon = vp.icon;
              return (
                <button
                  key={vp.id}
                  type="button"
                  onClick={() => setPreviewDevice(vp.id)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase border inline-flex items-center gap-1.5 ${
                    previewDevice === vp.id
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{vp.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-neutral-100 p-4 flex justify-center overflow-x-auto">
          <div
            className={`border border-neutral-300 shadow-lg bg-[#FAF9F6] overflow-hidden transition-all ${
              previewDevice === 'mobile'
                ? 'w-[375px]'
                : previewDevice === 'tablet'
                ? 'w-[768px]'
                : 'w-full'
            }`}
          >
            <FullScreenCinematicHero
              overrideConfig={localHero}
              forcedViewport={previewDevice}
              focusedSlideId={selectedSlide?.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminMediaManagerPanel: React.FC = () => {
  const {
    mediaLibrary,
    updateMediaLibrary,
    heroConfig,
    updateHeroConfig,
    notify,
  } = useStore();

  const [deviceTarget, setDeviceTarget] = useState<'desktop' | 'mobile' | 'universal'>('desktop');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadMetrics, setUploadMetrics] = useState<UploadProgressMetrics | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string>('');
  const [pendingMetadataItems, setPendingMetadataItems] = useState<MediaLibraryItem[]>([]);
  const [lastFailedFiles, setLastFailedFiles] = useState<File[]>([]);
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  const cancelLibraryUploadRef = useRef<(() => void) | null>(null);

  const resolveCategoryFromDeviceTarget = (
    target: 'desktop' | 'mobile' | 'universal'
  ): 'hero_desktop' | 'hero_mobile' | 'general' => {
    if (target === 'mobile') return 'hero_mobile';
    if (target === 'desktop') return 'hero_desktop';
    return 'general';
  };

  const handleUploadNewMedia = async (filesInput: FileList | File[] | null) => {
    if (!filesInput || filesInput.length === 0) return;
    const files = Array.from(filesInput);
    setUploadError('');
    setUploadSuccessMessage('');
    setLastFailedFiles([]);
    setIsUploadingMedia(true);
    setUploadProgress(2);

    const totalBatchBytes = files.reduce((acc, f) => acc + f.size, 0);
    setUploadMetrics({
      percent: 2,
      loadedBytes: 0,
      totalBytes: totalBatchBytes,
    });

    const added: MediaLibraryItem[] = [];
    const category = resolveCategoryFromDeviceTarget(deviceTarget);
    let completedBytesBeforeCurrent = 0;

    try {
      // Steps 1–4: Validate file -> Stream directly to Storage -> Wait for completion -> Retrieve download URL
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validated = validateSelectedMediaFile(file);
        const onItemDetailedProgress = (m: UploadProgressMetrics) => {
          const aggregateLoaded = completedBytesBeforeCurrent + m.loadedBytes;
          const overallPct = Math.max(
            2,
            Math.min(96, Math.round((aggregateLoaded / Math.max(1, totalBatchBytes)) * 96))
          );
          setUploadProgress(overallPct);
          setUploadMetrics({
            percent: overallPct,
            loadedBytes: aggregateLoaded,
            totalBytes: totalBatchBytes,
          });
        };

        if (validated.mediaType === 'image') {
          const meta = await readImageFileMetadata(
            file,
            category,
            undefined,
            undefined,
            onItemDetailedProgress,
            (cancelFn) => {
              cancelLibraryUploadRef.current = cancelFn;
            }
          );
          added.push({
            id: meta.mediaId,
            title: file.name.replace(/\.[^.]+$/, ''),
            fileName: file.name,
            fileType: meta.fileType,
            mediaType: 'image',
            mediaCategory: meta.mediaCategory,
            deviceTarget,
            url: meta.dataUrl,
            downloadUrl: meta.downloadUrl,
            storagePath: meta.storagePath,
            fileSizeBytes: meta.sizeBytes,
            dimensions: meta.dimensions,
            uploadedAt: meta.uploadedAt,
          });
        } else {
          const meta = await readVideoFileMetadata(
            file,
            category,
            undefined,
            undefined,
            onItemDetailedProgress,
            (cancelFn) => {
              cancelLibraryUploadRef.current = cancelFn;
            }
          );
          added.push({
            id: meta.mediaId,
            title: file.name.replace(/\.[^.]+$/, ''),
            fileName: file.name,
            fileType: meta.fileType,
            mediaType: 'video',
            mediaCategory: meta.mediaCategory,
            deviceTarget,
            url: meta.url,
            downloadUrl: meta.downloadUrl,
            storagePath: meta.storagePath,
            fileSizeBytes: meta.sizeBytes,
            dimensions: meta.dimensions,
            durationSeconds: meta.durationSeconds,
            uploadedAt: meta.uploadedAt,
          });
        }
        completedBytesBeforeCurrent += file.size;
      }
    } catch (storageErr) {
      const msg =
        storageErr instanceof Error
          ? storageErr.message
          : 'Upload failed. Please try again.';
      setUploadError(msg);
      if (!msg.toLowerCase().includes('cancelled')) {
        setLastFailedFiles(files);
      }
      notify('Media Upload Error', msg, 'error');
      setIsUploadingMedia(false);
      setUploadProgress(0);
      setUploadMetrics(null);
      cancelLibraryUploadRef.current = null;
      return;
    }

    // Step 5–7: Save media metadata to Firestore (prevent duplicates & provide safe retry if Firestore fails)
    try {
      const filteredExisting = mediaLibrary.filter(
        (existing) =>
          !added.some(
            (n) =>
              n.fileName === existing.fileName &&
              n.fileSizeBytes === existing.fileSizeBytes &&
              n.deviceTarget === existing.deviceTarget
          )
      );
      const nextList = [...added, ...filteredExisting];
      await updateMediaLibrary(nextList, true);
      setPendingMetadataItems([]);
      setUploadProgress(100);
      setUploadSuccessMessage('Media uploaded successfully.');
      notify(
        'Media uploaded successfully.',
        `Uploaded ${added.length} media asset(s) to storage and saved metadata to Firestore.`,
        'success'
      );
    } catch (dbErr) {
      // Storage succeeded, but Firestore metadata write failed -> store for 1-click retry without re-uploading binary
      setPendingMetadataItems(added);
      const msg =
        dbErr instanceof Error && dbErr.message.includes('permission')
          ? dbErr.message
          : 'File uploaded, but media information could not be saved.';
      setUploadError(msg);
      notify('Metadata Save Required', msg, 'error');
    } finally {
      cancelLibraryUploadRef.current = null;
      setIsUploadingMedia(false);
      window.setTimeout(() => {
        setUploadProgress(0);
        setUploadMetrics(null);
      }, 800);
    }
  };

  const handleRetrySavingMetadata = async () => {
    if (pendingMetadataItems.length === 0) return;
    setUploadError('');
    setIsUploadingMedia(true);
    setUploadProgress(60);
    try {
      const filteredExisting = mediaLibrary.filter(
        (existing) => !pendingMetadataItems.some((p) => p.id === existing.id)
      );
      const nextList = [...pendingMetadataItems, ...filteredExisting];
      await updateMediaLibrary(nextList, true);
      setPendingMetadataItems([]);
      setUploadProgress(100);
      setUploadSuccessMessage('Media uploaded successfully.');
      notify(
        'Media uploaded successfully.',
        'Pending media metadata was saved to Firestore.',
        'success'
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'File uploaded, but media information could not be saved.';
      setUploadError(msg);
      notify('Metadata Retry Failed', msg, 'error');
    } finally {
      setIsUploadingMedia(false);
      window.setTimeout(() => setUploadProgress(0), 800);
    }
  };

  const replaceMediaFile = async (item: MediaLibraryItem, file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    setUploadSuccessMessage('');
    setIsUploadingMedia(true);
    setUploadProgress(5);
    setUploadMetrics({
      percent: 5,
      loadedBytes: 0,
      totalBytes: file.size,
    });
    const category =
      item.mediaCategory || resolveCategoryFromDeviceTarget(item.deviceTarget);

    try {
      if (item.mediaType === 'image') {
        const meta = await readImageFileMetadata(
          file,
          category,
          setUploadProgress,
          item.storagePath,
          setUploadMetrics,
          (cancelFn) => {
            cancelLibraryUploadRef.current = cancelFn;
          }
        );
        const updated = mediaLibrary.map((m) =>
          m.id === item.id
            ? {
                ...m,
                fileName: file.name,
                fileType: meta.fileType,
                mediaCategory: meta.mediaCategory,
                url: meta.dataUrl,
                downloadUrl: meta.downloadUrl,
                storagePath: meta.storagePath,
                fileSizeBytes: meta.sizeBytes,
                dimensions: meta.dimensions,
                uploadedAt: meta.uploadedAt,
              }
            : m
        );
        await updateMediaLibrary(updated, true);
        setUploadProgress(100);
        setUploadSuccessMessage('Media uploaded successfully.');
        notify('Media uploaded successfully.', `${item.title} replaced with ${file.name}.`, 'success');
      } else {
        const meta = await readVideoFileMetadata(
          file,
          category,
          setUploadProgress,
          item.storagePath,
          setUploadMetrics,
          (cancelFn) => {
            cancelLibraryUploadRef.current = cancelFn;
          }
        );
        const updated = mediaLibrary.map((m) =>
          m.id === item.id
            ? {
                ...m,
                fileName: file.name,
                fileType: meta.fileType,
                mediaCategory: meta.mediaCategory,
                url: meta.url,
                downloadUrl: meta.downloadUrl,
                storagePath: meta.storagePath,
                fileSizeBytes: meta.sizeBytes,
                dimensions: meta.dimensions,
                durationSeconds: meta.durationSeconds,
                uploadedAt: meta.uploadedAt,
              }
            : m
        );
        await updateMediaLibrary(updated, true);
        setUploadProgress(100);
        setUploadSuccessMessage('Media uploaded successfully.');
        notify(
          'Media uploaded successfully.',
          `${item.title} replaced (${meta.durationSeconds}s).`,
          'success'
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(msg);
      notify('Replace Failed', msg, 'error');
    } finally {
      cancelLibraryUploadRef.current = null;
      setIsUploadingMedia(false);
      window.setTimeout(() => {
        setUploadProgress(0);
        setUploadMetrics(null);
      }, 800);
    }
  };

  const applyToHeroSlide1 = async (
    item: MediaLibraryItem,
    slot: 'desktop' | 'mobile'
  ) => {
    setUploadError('');
    try {
      const versionedUrl = ensureVersionedMediaUrl(item.url);
      const slides = heroConfig.slides.map((s, idx) => {
        if (idx !== 0) {
          // If another slide only has default placeholder media, disable it so the Hero Section stays on the user's uploaded media
          const hasCustomMedia =
            !isDefaultPlaceholderUrl(s.desktopImageUrl) ||
            !isDefaultPlaceholderUrl(s.mobileImageUrl) ||
            !isDefaultPlaceholderUrl(s.desktopVideoUrl) ||
            !isDefaultPlaceholderUrl(s.mobileVideoUrl);
          return hasCustomMedia ? s : { ...s, enabled: false };
        }
        if (item.mediaType === 'video') {
          return {
            ...s,
            enabled: true,
            mediaMode: 'video' as const,
            desktopVideoUrl:
              slot === 'desktop'
                ? versionedUrl
                : isDefaultPlaceholderUrl(s.desktopVideoUrl)
                ? ''
                : s.desktopVideoUrl,
            mobileVideoUrl:
              slot === 'mobile'
                ? versionedUrl
                : isDefaultPlaceholderUrl(s.mobileVideoUrl)
                ? ''
                : s.mobileVideoUrl,
          };
        }
        return {
          ...s,
          enabled: true,
          mediaMode: 'image' as const,
          desktopImageUrl: slot === 'desktop' ? versionedUrl : s.desktopImageUrl,
          mobileImageUrl: slot === 'mobile' ? versionedUrl : s.mobileImageUrl,
          fallbackImageUrl:
            slot === 'desktop' || isDefaultPlaceholderUrl(s.fallbackImageUrl)
              ? versionedUrl
              : s.fallbackImageUrl,
        };
      });
      await updateHeroConfig({ ...heroConfig, slides }, true);
      setUploadSuccessMessage(
        `Applied "${item.title}" to Hero Section (${slot === 'desktop' ? 'Desktop' : 'Mobile'} ${
          item.mediaType === 'video' ? 'Video' : 'Image'
        }).`
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "You don't have permission to upload media. Please verify your admin access.";
      setUploadError(msg);
      notify('Hero Assignment Error', msg, 'error');
    }
  };

  const handleDeleteMediaItem = async (item: MediaLibraryItem) => {
    setUploadError('');
    try {
      await updateMediaLibrary(
        mediaLibrary.filter((m) => m.id !== item.id),
        true
      );
      notify('Media Deleted', `${item.title} removed from media library.`, 'info');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "You don't have permission to upload media. Please verify your admin access.";
      setUploadError(msg);
    }
  };

  const filteredItems = mediaLibrary.filter(
    (m) => filterType === 'all' || m.mediaType === filterType
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 border border-neutral-200">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 block">
            CENTRALIZED STOREFRONT ASSET VAULT
          </span>
          <h1 className="text-2xl font-bold">
            Admin Media Manager ({mediaLibrary.length} Assets)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Upload JPG, JPEG, PNG, WEBP images and MP4 videos, preview, replace, download original files, and assign desktop or mobile hero media.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <select
            value={deviceTarget}
            onChange={(e) => setDeviceTarget(e.target.value as typeof deviceTarget)}
            className="px-3 py-2 border border-neutral-300 bg-white font-mono"
          >
            <option value="desktop">Target: Desktop Media</option>
            <option value="mobile">Target: Mobile Media</option>
            <option value="universal">Target: Universal</option>
          </select>

          <label
            className={`px-4 py-2 bg-neutral-900 text-white font-mono uppercase tracking-wider font-semibold cursor-pointer inline-flex items-center gap-1.5 ${
              isUploadingMedia ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>
              {isUploadingMedia
                ? 'Uploading Media...'
                : 'Upload Images / MP4 Videos'}
            </span>
            <input
              type="file"
              multiple
              disabled={isUploadingMedia}
              accept=".jpg,.jpeg,.png,.webp,.mp4,image/jpeg,image/png,image/webp,video/mp4"
              onChange={(e) => {
                handleUploadNewMedia(e.target.files);
                e.currentTarget.value = '';
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {(uploadProgress > 0 || isUploadingMedia) && (
        <div className="bg-white p-4 border border-neutral-900 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Streaming Original Media to Storage &amp; Syncing Firestore Metadata...
            </span>
            <div className="flex items-center gap-3">
              {uploadMetrics && (
                <span className="text-neutral-600 tabular-nums">
                  {formatMegabytesPair(
                    uploadMetrics.loadedBytes,
                    uploadMetrics.totalBytes
                  )}
                </span>
              )}
              <span className="font-bold tabular-nums">{uploadProgress}%</span>
              {cancelLibraryUploadRef.current && (
                <button
                  type="button"
                  onClick={() => {
                    cancelLibraryUploadRef.current?.();
                    cancelLibraryUploadRef.current = null;
                  }}
                  className="px-2.5 py-0.5 bg-red-600 text-white uppercase text-[10px] inline-flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-neutral-100">
            <div
              style={{ width: `${uploadProgress}%` }}
              className="h-full bg-neutral-900 transition-all"
            />
          </div>
        </div>
      )}

      {uploadSuccessMessage && !uploadError && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between">
          <span>{uploadSuccessMessage}</span>
          <button
            type="button"
            onClick={() => setUploadSuccessMessage('')}
            className="underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex flex-wrap items-center justify-between gap-3">
          <span>{uploadError}</span>
          <div className="flex items-center gap-2">
            {lastFailedFiles.length > 0 && (
              <button
                type="button"
                onClick={() => handleUploadNewMedia(lastFailedFiles)}
                className="px-3 py-1.5 bg-neutral-900 text-white uppercase font-semibold text-[11px] inline-flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry Failed Upload ({lastFailedFiles.length})</span>
              </button>
            )}
            {pendingMetadataItems.length > 0 && (
              <button
                type="button"
                onClick={handleRetrySavingMetadata}
                className="px-3 py-1.5 bg-neutral-900 text-white uppercase font-semibold text-[11px]"
              >
                Retry Saving Metadata ({pendingMetadataItems.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setUploadError('')}
              className="underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {(['all', 'image', 'video'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilterType(t)}
            className={`px-3.5 py-1.5 text-xs font-mono uppercase border ${
              filterType === t
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white border-neutral-300'
            }`}
          >
            {t === 'all' ? 'All Media' : t === 'image' ? 'Images Only' : 'MP4 Videos Only'}
          </button>
        ))}
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-neutral-200 flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                {item.mediaType === 'video' ? (
                  <video
                    src={item.url}
                    poster={
                      item.thumbnailUrl && !isDefaultPlaceholderUrl(item.thumbnailUrl)
                        ? item.thumbnailUrl
                        : undefined
                    }
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      if (v.currentTime === 0) {
                        try {
                          v.currentTime = 0.05;
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                  <span className="px-2 py-0.5 bg-black/75 text-white font-mono text-[10px] uppercase">
                    {item.mediaType}
                  </span>
                  <span className="px-2 py-0.5 bg-white/90 text-black font-mono text-[10px] uppercase">
                    {item.deviceTarget}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2 text-xs">
                <h3 className="font-bold text-sm truncate">{item.title}</h3>
                <div className="grid grid-cols-2 gap-1 font-mono text-[11px] text-neutral-500 tabular-nums">
                  <span>Size: {formatBytes(item.fileSizeBytes)}</span>
                  <span>Dim: {item.dimensions}</span>
                  {item.durationSeconds ? (
                    <span>Duration: {item.durationSeconds}s</span>
                  ) : null}
                  <span>Added: {item.uploadedAt}</span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyToHeroSlide1(item, 'desktop')}
                  className="py-1.5 px-2 bg-neutral-900 text-white font-mono text-[10px] uppercase hover:bg-neutral-800"
                >
                  Set Hero Desktop
                </button>
                <button
                  type="button"
                  onClick={() => applyToHeroSlide1(item, 'mobile')}
                  className="py-1.5 px-2 border border-neutral-900 font-mono text-[10px] uppercase hover:bg-neutral-100"
                >
                  Set Hero Mobile
                </button>
              </div>

              <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="px-2.5 py-1 border border-neutral-300 font-mono text-[10px] uppercase inline-flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>Preview</span>
                </button>

                <label className="px-2.5 py-1 border border-neutral-300 font-mono text-[10px] uppercase cursor-pointer inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  <span>Replace</span>
                  <input
                    type="file"
                    accept={
                      item.mediaType === 'video'
                        ? '.mp4,video/mp4'
                        : '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
                    }
                    onChange={(e) => {
                      replaceMediaFile(item, e.target.files?.[0]);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    triggerMediaDownload(item.url, item.fileName, item.downloadUrl)
                  }
                  className="px-2.5 py-1 border border-neutral-300 font-mono text-[10px] uppercase inline-flex items-center gap-1"
                  title="Download Original Media"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteMediaItem(item)}
                  className="px-2 py-1 border border-red-200 text-red-700 font-mono text-[10px] uppercase"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Media Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-4xl w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base">{previewItem.title}</h3>
                <p className="text-xs font-mono text-neutral-500">
                  {previewItem.fileName} · {previewItem.dimensions} ·{' '}
                  {formatBytes(previewItem.fileSizeBytes)}
                  {previewItem.durationSeconds
                    ? ` · ${previewItem.durationSeconds}s`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-3 py-1 border border-neutral-300 text-xs font-mono uppercase"
              >
                Close
              </button>
            </div>
            <div className="bg-neutral-950 max-h-[70vh] overflow-hidden flex items-center justify-center">
              {previewItem.mediaType === 'video' ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-h-[68vh] w-auto"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.title}
                  className="max-h-[68vh] w-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminUgcVideoManagerPanel: React.FC = () => {
  const { ugcConfig, updateUgcConfig, products, notify } = useStore();

  const [editingVideo, setEditingVideo] = useState<UgcVideoItem | null>(null);
  const [previewVideoModal, setPreviewVideoModal] = useState<UgcVideoItem | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const createBlankUgcVideo = (): UgcVideoItem => {
    const firstProd = products[0];
    return {
      id: `ugc-vid-${Date.now().toString().slice(-5)}`,
      enabled: true,
      featured: true,
      order: ugcConfig.videos.length + 1,
      customerHandle: '@vynoox.creator',
      caption: 'Wearing the 280 GSM Acid Washed Oversized Tee in natural daylight.',
      videoUrl: DEFAULT_CINEMATIC_MP4_URL,
      thumbnailUrl: createUgcVerticalPosterSvg({
        bgTop: '#1F1F23',
        bgBottom: '#0C0C0E',
        garmentTone: '#2E2E33',
        accentColor: '#E4E4E7',
        handle: '@vynoox.creator',
        garmentTag: firstProd?.sku || 'VYN-AW-001',
        locationTag: 'COMMUNITY LOOKBOOK',
      }),
      productId: firstProd?.id || '',
      productTagLabel: firstProd?.name || 'Acid Washed Oversized Tee',
      productSlug: firstProd?.slug || '',
      durationSeconds: 12,
      fileSizeBytes: 2400000,
    };
  };

  const handleSaveUgcItem = async (item: UgcVideoItem) => {
    const exists = ugcConfig.videos.some((v) => v.id === item.id);
    const nextVideos = exists
      ? ugcConfig.videos.map((v) => (v.id === item.id ? item : v))
      : [...ugcConfig.videos, item];
    await updateUgcConfig({ ...ugcConfig, videos: nextVideos }, true);
    setEditingVideo(null);
  };

  const moveUgcItem = (idx: number, dir: -1 | 1) => {
    const sorted = [...ugcConfig.videos].sort((a, b) => a.order - b.order);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const temp = sorted[idx].order;
    sorted[idx].order = sorted[target].order;
    sorted[target].order = temp;
    updateUgcConfig(
      { ...ugcConfig, videos: [...sorted].sort((a, b) => a.order - b.order) },
      false
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 border border-neutral-200">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 block">
            VERTICAL 9:16 COMMUNITY VIDEO SYSTEM
          </span>
          <h1 className="text-2xl font-bold">
            VYNOOX Community UGC Video Management ({ugcConfig.videos.length} Videos)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Upload vertical 9:16 MP4 videos, custom thumbnails, link products, reorder cards, and customize playback.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditingVideo(createBlankUgcVideo())}
            className="px-4 py-2 border border-neutral-900 text-xs font-mono uppercase font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add UGC Video</span>
          </button>
          <button
            type="button"
            onClick={() => updateUgcConfig(ugcConfig, true)}
            className="px-5 py-2 bg-neutral-900 text-white text-xs font-mono uppercase font-semibold"
          >
            Publish UGC Gallery
          </button>
        </div>
      </div>

      {/* Section Display & Playback Settings */}
      <div className="bg-white border border-neutral-200 p-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block font-semibold mb-1">Section Heading</label>
          <input
            type="text"
            value={ugcConfig.heading}
            onChange={(e) =>
              updateUgcConfig({ ...ugcConfig, heading: e.target.value }, false)
            }
            className="w-full px-3 py-2 border border-neutral-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Subtitle / Description</label>
          <input
            type="text"
            value={ugcConfig.subtitle}
            onChange={(e) =>
              updateUgcConfig({ ...ugcConfig, subtitle: e.target.value }, false)
            }
            className="w-full px-3 py-2 border border-neutral-300"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Visible Videos Count</label>
          <select
            value={ugcConfig.maxVisibleVideos}
            onChange={(e) =>
              updateUgcConfig(
                { ...ugcConfig, maxVisibleVideos: Number(e.target.value) },
                false
              )
            }
            className="w-full px-3 py-2 border border-neutral-300 bg-white"
          >
            <option value={3}>3 Videos</option>
            <option value={4}>4 Videos</option>
            <option value={6}>6 Videos</option>
            <option value={8}>8 Videos</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Video Aspect Ratio</label>
          <select
            value={ugcConfig.aspectRatio}
            onChange={(e) =>
              updateUgcConfig(
                {
                  ...ugcConfig,
                  aspectRatio: e.target.value as typeof ugcConfig.aspectRatio,
                },
                false
              )
            }
            className="w-full px-3 py-2 border border-neutral-300 bg-white"
          >
            <option value="9:16">Vertical 9:16 (Reels / Lookbook)</option>
            <option value="4:5">Editorial 4:5 Portrait</option>
            <option value="1:1">Square 1:1</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Video Card Width</label>
          <select
            value={ugcConfig.cardWidth}
            onChange={(e) =>
              updateUgcConfig(
                {
                  ...ugcConfig,
                  cardWidth: e.target.value as typeof ugcConfig.cardWidth,
                },
                false
              )
            }
            className="w-full px-3 py-2 border border-neutral-300 bg-white"
          >
            <option value="compact">Compact</option>
            <option value="standard">Standard Fashion</option>
            <option value="wide">Wide Cinema</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Section Background Color</label>
          <input
            type="color"
            value={ugcConfig.backgroundColor}
            onChange={(e) =>
              updateUgcConfig(
                { ...ugcConfig, backgroundColor: e.target.value },
                false
              )
            }
            className="w-full h-9 border border-neutral-300"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            checked={ugcConfig.hoverAutoplay}
            onChange={(e) =>
              updateUgcConfig(
                { ...ugcConfig, hoverAutoplay: e.target.checked },
                false
              )
            }
          />
          <span className="font-semibold">Hover Autoplay Preview</span>
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            checked={ugcConfig.visible}
            onChange={(e) =>
              updateUgcConfig({ ...ugcConfig, visible: e.target.checked }, false)
            }
          />
          <span className="font-semibold">Show Section on Homepage</span>
        </div>
      </div>

      {/* Add / Edit UGC Video Drawer */}
      {editingVideo && (
        <div className="bg-white border-2 border-neutral-900 p-6 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-base font-bold">
              {ugcConfig.videos.some((v) => v.id === editingVideo.id)
                ? `Edit UGC Video (${editingVideo.customerHandle})`
                : 'Add New UGC Community Video'}
            </h2>
            <button
              type="button"
              onClick={() => setEditingVideo(null)}
              className="font-mono underline"
            >
              Close Editor
            </button>
          </div>

          {uploadStatus && (
            <p className="p-2.5 bg-neutral-100 font-mono text-neutral-700">
              {uploadStatus}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">
                Customer Name / Handle *
              </label>
              <input
                type="text"
                value={editingVideo.customerHandle}
                onChange={(e) =>
                  setEditingVideo({
                    ...editingVideo,
                    customerHandle: e.target.value,
                  })
                }
                placeholder="@username"
                className="w-full px-3 py-2 border border-neutral-300 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Short Styling Caption</label>
              <input
                type="text"
                value={editingVideo.caption}
                onChange={(e) =>
                  setEditingVideo({ ...editingVideo, caption: e.target.value })
                }
                placeholder="Describe the garment fit and styling..."
                className="w-full px-3 py-2 border border-neutral-300"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Link Video to VYNOOX Product
              </label>
              <select
                value={editingVideo.productId || ''}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value);
                  setEditingVideo({
                    ...editingVideo,
                    productId: prod?.id || '',
                    productSlug: prod?.slug || '',
                    productTagLabel: prod ? prod.name : '',
                  });
                }}
                className="w-full px-3 py-2 border border-neutral-300 bg-white"
              >
                <option value="">No Linked Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">MP4 Video URL or Upload</label>
              <input
                type="text"
                value={editingVideo.videoUrl}
                onChange={(e) =>
                  setEditingVideo({ ...editingVideo, videoUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 font-mono text-[11px]"
              />
              <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white font-mono text-[11px] uppercase cursor-pointer">
                <Upload className="h-3 w-3" />
                <span>Upload MP4 Video</span>
                <input
                  type="file"
                  accept=".mp4,video/mp4"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadStatus('Uploading MP4 video to storage...');
                    try {
                      const meta = await readVideoFileMetadata(file, 'ugc_video');
                      setEditingVideo({
                        ...editingVideo,
                        videoUrl: meta.url,
                        durationSeconds: meta.durationSeconds,
                        fileSizeBytes: meta.sizeBytes,
                      });
                      setUploadStatus(
                        `Media uploaded successfully: ${file.name} (${meta.dimensions}, ${meta.durationSeconds}s)`
                      );
                    } catch (err) {
                      setUploadStatus(
                        err instanceof Error ? err.message : 'Upload failed. Please try again.'
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                9:16 Video Thumbnail Image
              </label>
              <input
                type="text"
                value={editingVideo.thumbnailUrl}
                onChange={(e) =>
                  setEditingVideo({ ...editingVideo, thumbnailUrl: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 font-mono text-[11px]"
              />
              <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-900 font-mono text-[11px] uppercase cursor-pointer">
                <ImageIcon className="h-3 w-3" />
                <span>Upload Poster Image</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const meta = await readImageFileMetadata(file, 'ugc_video');
                      setEditingVideo({
                        ...editingVideo,
                        thumbnailUrl: meta.dataUrl,
                      });
                      setUploadStatus(`Media uploaded successfully (${meta.dimensions})`);
                    } catch (err) {
                      setUploadStatus(
                        err instanceof Error ? err.message : 'Upload failed. Please try again.'
                      );
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setEditingVideo(null)}
              className="px-4 py-2 border border-neutral-300 font-mono uppercase"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveUgcItem(editingVideo)}
              className="px-6 py-2 bg-neutral-900 text-white font-mono uppercase font-semibold"
            >
              Save UGC Video Card
            </button>
          </div>
        </div>
      )}

      {/* UGC Video Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...ugcConfig.videos]
          .sort((a, b) => a.order - b.order)
          .map((vid, idx, arr) => (
            <div
              key={vid.id}
              className="bg-white border border-neutral-200 flex flex-col justify-between overflow-hidden text-xs"
            >
              <div>
                <div className="relative aspect-[9/16] max-h-80 w-full bg-neutral-900 overflow-hidden">
                  <img
                    src={vid.thumbnailUrl}
                    alt={vid.customerHandle}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-black/75 text-white font-mono text-[10px]">
                      {vid.customerHandle}
                    </span>
                    <span
                      className={`px-2 py-0.5 font-mono text-[10px] ${
                        vid.enabled
                          ? 'bg-emerald-900 text-white'
                          : 'bg-neutral-700 text-neutral-300'
                      }`}
                    >
                      {vid.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-1.5">
                  <p className="text-neutral-700 line-clamp-2">{vid.caption}</p>
                  {vid.productTagLabel && (
                    <p className="font-mono text-[10px] text-neutral-500 truncate">
                      Linked: {vid.productTagLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center justify-between border-t pt-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveUgcItem(idx, -1)}
                      className="p-1 border border-neutral-200 disabled:opacity-30"
                      title="Move Left / Up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === arr.length - 1}
                      onClick={() => moveUgcItem(idx, 1)}
                      className="p-1 border border-neutral-200 disabled:opacity-30"
                      title="Move Right / Down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewVideoModal(vid)}
                      className="px-2 py-1 border border-neutral-300 font-mono text-[10px] uppercase"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        triggerMediaDownload(
                          vid.videoUrl,
                          `${vid.customerHandle.replace('@', '')}-vynoox.mp4`
                        )
                      }
                      className="p-1 border border-neutral-300"
                      title="Download Original Video"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingVideo(vid)}
                      className="px-2 py-1 bg-neutral-900 text-white font-mono text-[10px] uppercase"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateUgcConfig(
                          {
                            ...ugcConfig,
                            videos: ugcConfig.videos.filter((v) => v.id !== vid.id),
                          },
                          true
                        )
                      }
                      className="px-2 py-1 border border-red-200 text-red-700 font-mono text-[10px] uppercase"
                    >
                      Del
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vid.enabled}
                      onChange={(e) => {
                        const next = ugcConfig.videos.map((v) =>
                          v.id === vid.id ? { ...v, enabled: e.target.checked } : v
                        );
                        updateUgcConfig({ ...ugcConfig, videos: next }, false);
                      }}
                    />
                    <span>Visible</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vid.featured}
                      onChange={(e) => {
                        const next = ugcConfig.videos.map((v) =>
                          v.id === vid.id ? { ...v, featured: e.target.checked } : v
                        );
                        updateUgcConfig({ ...ugcConfig, videos: next }, false);
                      }}
                    />
                    <span>Featured</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Live Preview of VYNOOX Community Section */}
      <div className="bg-white border border-neutral-200 p-4 space-y-3">
        <span className="text-xs font-mono uppercase text-neutral-500 block">
          LIVE VYNOOX COMMUNITY SECTION PREVIEW
        </span>
        <VynooxCommunityUgcSection overrideConfig={ugcConfig} />
      </div>

      {previewVideoModal && (
        <div
          onClick={() => setPreviewVideoModal(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-950 text-white p-4 max-w-md w-full space-y-3 border border-white/20"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">{previewVideoModal.customerHandle}</span>
              <button
                type="button"
                onClick={() => setPreviewVideoModal(null)}
                className="text-xs font-mono underline"
              >
                Close
              </button>
            </div>
            <video
              src={previewVideoModal.videoUrl}
              poster={previewVideoModal.thumbnailUrl}
              controls
              autoPlay
              className="w-full aspect-[9/16] object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};
