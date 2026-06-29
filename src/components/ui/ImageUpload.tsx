import { useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Product Image" }: ImageUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setError("");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      onChange(e.target?.result as string);
      setUploading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-[#6B6B6B] mb-1">{label}</label>}

      {value ? (
        <div className="relative rounded-md overflow-hidden border border-[#E0E0E0] bg-[#F7F7F7]">
          <img src={value} alt="Product" className="w-full h-36 object-contain" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-white/90 border border-[#E0E0E0] rounded-full p-1 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <X size={13} className="text-[#DC2626]" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-md p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            dragging ? "border-[#1E1B3A] bg-[#1E1B3A]/5" : "border-[#E0E0E0] hover:border-[#1E1B3A] hover:bg-[#F7F7F7]"
          )}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {uploading ? (
            <div className="w-7 h-7 border-2 border-[#1E1B3A] border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-[#F0F0F0] flex items-center justify-center">
                <Upload size={16} className="text-[#1E1B3A]" />
              </div>
              <p className="text-sm font-medium text-[#1E1B3A] text-center">
                {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
              </p>
              <p className="text-sm text-[#9B9B9B]">PNG, JPG, WEBP — max 5MB</p>
            </>
          )}
        </div>
      )}
      {error && <p className="text-sm text-[#DC2626] mt-1">{error}</p>}
    </div>
  );
}
