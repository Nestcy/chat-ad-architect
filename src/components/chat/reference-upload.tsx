import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { uploadReferenceImage } from "@/lib/api";
import { cn } from "@/lib/utils";

type Props = {
  campaignId: string;
  assetId: string;
  onUploaded: (assetId: string) => void;
};

export function ReferenceUploadCard({ campaignId, assetId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done">("idle");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setState("uploading");
      setError(null);
      const result = await uploadReferenceImage(campaignId, assetId, file);
      if (!result.ok) {
        setState("idle");
        setError(result.error);
        return;
      }
      setState("done");
      onUploaded(assetId);
    },
    [assetId, campaignId, onUploaded],
  );

  return (
    <div className="rounded-lg border border-warning/35 bg-warning/[0.06] p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-warning">
        <ImagePlus className="size-3.5" />
        This asset needs a real photo
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">{assetId}</p>

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
        disabled={state !== "idle"}
        className={cn(
          "mt-3 flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed border-border bg-background/40 px-3 py-4 text-xs text-muted-foreground transition-colors",
          dragging && "border-primary/60 bg-primary/5 text-foreground",
          state === "idle" && "hover:border-primary/50 hover:text-foreground",
        )}
      >
        {state === "uploading" ? (
          <>
            <Loader2 className="size-4 animate-spin text-primary" />
            Uploading and processing…
          </>
        ) : state === "done" ? (
          <>Photo received — regenerating asset</>
        ) : (
          <>
            <Upload className="size-4" />
            Drop an image here or click to choose a file
          </>
        )}
      </button>

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
