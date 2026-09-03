/** A real photo, desaturated and tinted with one of Forma's own brand
 * colors via blend modes — so photography reads as "Forma's," not a
 * generic stock-photo drop-in. Used sparingly: the landing hero and the
 * auth-screen photo panel, nowhere else. */
export function DuotonePhoto({
  src,
  alt,
  tint = 'sidebar',
  className = '',
  scrim = 'none',
  focal,
}: {
  src: string;
  alt: string;
  tint?: 'primary' | 'accent' | 'sidebar';
  className?: string;
  scrim?: 'none' | 'bottom' | 'full';
  /** CSS object-position value (e.g. "60% 35%") to control which part of
   * the photo stays in frame when it's cropped tighter than its natural
   * aspect ratio. Defaults to the browser's normal centering. */
  focal?: string;
}) {
  const tintVar = tint === 'primary' ? '--primary' : tint === 'accent' ? '--accent' : '--sidebar';
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover grayscale contrast-[1.1]"
        style={focal ? { objectPosition: focal } : undefined}
        loading="lazy"
      />
      <div className="absolute inset-0 mix-blend-multiply" style={{ backgroundColor: `hsl(var(${tintVar}) / .55)` }} />
      {scrim === 'bottom' && <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--sidebar))] via-[hsl(var(--sidebar)/.3)] to-transparent" />}
      {scrim === 'full' && <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--sidebar)/.15)] to-[hsl(var(--sidebar)/.78)]" />}
    </div>
  );
}
