import { useRef, useState } from "react";
import { useSavetrip } from "@/lib/savetrip";
import { ImagePlus, Pencil, Trash2, UserRound, X } from "lucide-react";

export function UserAvatar({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const { user } = useSavetrip();
  return <span className={`persona-avatar persona-avatar-${size} ${className}`}>
    {user.personaImage ? <img src={user.personaImage} alt={`${user.name} profile`} /> : <><UserRound size={size === "lg" ? 27 : size === "md" ? 19 : 15} /><span>{user.name.slice(0, 1)}</span></>}
  </span>;
}

export function PersonaImagePicker({ compact = false }: { compact?: boolean }) {
  const { user, uploadAvatar, removeAvatar } = useSavetrip();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const selectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file, such as JPG, PNG, or WEBP."); return; }
    if (file.size > 1.5 * 1024 * 1024) { setError("Please choose an image smaller than 1.5 MB."); return; }
    setUploading(true);
    const result = await uploadAvatar(file);
    setUploading(false);
    if (result.error) setError(result.error);
  };
  const remove = async () => { setError(""); const result = await removeAvatar(); if (result.error) setError(result.error); };
  return <div className={`persona-picker ${compact ? "persona-picker-compact" : ""}`}><div className="persona-picker-visual"><UserAvatar size={compact ? "md" : "lg"} /><span className="persona-picker-spark"><ImagePlus size={14} /></span></div><div className="persona-picker-copy"><span className="tiny-label">SAVINGS PERSONA</span><strong>{user.persona}</strong>{!compact && <p>Add a profile image to make your journey feel yours.</p>}<div className="persona-picker-actions"><button disabled={uploading} onClick={() => inputRef.current?.click()} className="persona-image-button"><Pencil size={14} /> {uploading ? "Uploading…" : user.personaImage ? "Replace image" : "Add your image"}</button>{user.personaImage && <button disabled={uploading} onClick={remove} className="persona-remove-button" aria-label="Remove profile image"><Trash2 size={14} /></button>}</div>{error && <span className="persona-image-error"><X size={13} /> {error}</span>}</div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} className="sr-only" /></div>;
}
