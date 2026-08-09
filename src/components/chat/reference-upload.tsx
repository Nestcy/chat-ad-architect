import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { uploadReferenceImage } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  /** Calendar date (YYYY-MM-DD) the reference photo belongs to. */
  date: string;
  onUploaded?: (date: string) => void;
  label?: string;
  compact?: boolean;
};

/** Shared drag-and-drop reference photo uploader for a single calendar day. */
export function ReferenceDropZone({
  campaignId,
  date,
  onUploaded,
  label = "Drop an image here or click to choose a file",
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done">("idle");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const submit = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setState("uploading");
      setError(null);
      setPreview(URL.createObjectURL(file));
      const result = await uploadReferenceImage(campaignId, date, file);
      if (!result.ok) {
        setState("idle");
        setError(result.error);
        return;
      }
      setState("done");
      onUploaded?.(date);
    },
    [campaignId, date, onUploaded],
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void submit(event.dataTransfer.files?.[0]);
        }}
        disabled={state === "uploading"}
        className={cn(
          "flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border bg-background/40 text-xs text-muted-foreground transition-colors",
          compact ? "px-2.5 py-3" : "px-3 py-5",
          dragging && "border-primary/60 bg-primary/5 text-foreground",
          state !== "uploading" && "hover:border-primary/50 hover:text-foreground",
        )}
      >
        {state === "uploading" ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary" />
            Uploading…
          </>
        ) : state === "done" ? (
          <>
            <ImagePlus className="size-4 text-success" />
            Photo received
          </>
        ) : (
          <>
            <Upload className="size-4" />
            <span className="text-center leading-snug">{label}</span>
          </>
        )}
      </button>

      {preview ? (
        <img
          src={preview}
          alt={`Reference photo selected for ${date}`}
          className="mt-2 aspect-video w-full rounded-md border border-border object-cover"
        />
      ) : null}

      {error ? <p className="mt-2 text-[11px] text-destructive">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void submit(event.target.files?.[0])}
      />
    </div>
  );
}
