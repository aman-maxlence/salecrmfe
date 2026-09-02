import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Image as ImageIcon, Upload, X, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface LogoUploadProps {
  /** Signed URL of the currently saved logo, if any. */
  currentLogoUrl: string | null;
  /** Called with the selected file once it passes validation. Parent owns the actual upload (needs the org id). */
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function LogoUpload({ currentLogoUrl, onFileSelected, onRemove, isUploading, disabled }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayUrl = preview ?? currentLogoUrl;

  const validateAndSelect = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please upload PNG, JPG, WebP, GIF, or SVG.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File size must be less than ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    onFileSelected(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onRemove();
  };

  return (
    <div className="flex items-center gap-3">
      <div
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-muted transition-colors ${
          isDragging ? 'border-primary' : 'border-border'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary'}`}
        title="Click or drop an image to upload"
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : displayUrl ? (
          <img src={displayUrl} alt="Workspace logo" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          <Upload className="h-3.5 w-3.5" />
          {displayUrl ? 'Change logo' : 'Upload logo'}
        </Button>
        {displayUrl && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={disabled || isUploading}>
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export default LogoUpload;
