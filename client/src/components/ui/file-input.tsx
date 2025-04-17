import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileText } from "lucide-react";

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onChange?: (file: File | null) => void;
  onDataUrlChange?: (dataUrl: string | null) => void;
  acceptedFileTypes?: string[];
  maxSizeInMB?: number;
  showPreview?: boolean;
}

export const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      onChange,
      onDataUrlChange,
      acceptedFileTypes = [],
      maxSizeInMB = 10,
      showPreview = false,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [file, setFile] = React.useState<File | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [preview, setPreview] = React.useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const validateFile = (file: File): string | null => {
      if (maxSizeInMB && file.size > maxSizeInMB * 1024 * 1024) {
        return `File size should not exceed ${maxSizeInMB} MB`;
      }

      if (
        acceptedFileTypes.length > 0 &&
        !acceptedFileTypes.some((type) => {
          if (type.includes("*")) {
            const baseType = type.split("/")[0];
            return file.type.startsWith(baseType + "/");
          }
          return file.type === type;
        })
      ) {
        return `Accepted file types: ${acceptedFileTypes.join(", ")}`;
      }

      return null;
    };

    const processFile = (file: File) => {
      const validationError = validateFile(file);
      setError(validationError);

      if (!validationError) {
        setFile(file);
        onChange?.(file);

        if (showPreview || onDataUrlChange) {
          const reader = new FileReader();
          reader.onprogress = (e) => {
            if (e.lengthComputable) {
              setUploadProgress((e.loaded / e.total) * 100);
            }
          };
          reader.onload = () => {
            setUploadProgress(100);
            const result = reader.result as string;
            setPreview(result);
            onDataUrlChange?.(result);
          };
          reader.readAsDataURL(file);
        }
      } else {
        setFile(null);
        setPreview(null);
        onChange?.(null);
        onDataUrlChange?.(null);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        processFile(file);
      }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        processFile(file);
      }
    };

    const handleRemoveFile = () => {
      setFile(null);
      setPreview(null);
      setError(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onChange?.(null);
      onDataUrlChange?.(null);
    };

    const isImage = file?.type.startsWith("image/");
    const isPdf = file?.type === "application/pdf";

    return (
      <div className="space-y-2">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-md p-4 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50",
            error && "border-destructive hover:border-destructive",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={ref || fileInputRef}
            className="sr-only"
            onChange={handleFileSelect}
            accept={acceptedFileTypes.join(",")}
            {...props}
          />

          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {isImage && showPreview ? (
                    <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                      <img
                        src={preview!}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : isPdf ? (
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  ) : (
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Progress value={uploadProgress} className="h-1" />
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-4 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mb-1 h-8 w-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  {acceptedFileTypes.length > 0
                    ? `Accepts ${acceptedFileTypes.join(", ")}`
                    : "Any file format"}
                  {maxSizeInMB && ` up to ${maxSizeInMB} MB`}
                </p>
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {isImage && preview && showPreview && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-1">Preview</p>
            <div className="rounded-md overflow-hidden border">
              <img
                src={preview}
                alt={file.name}
                className="max-h-[200px] w-auto mx-auto"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";
