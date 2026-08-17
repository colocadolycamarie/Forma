import { Link } from 'wouter';

export function FormaMark() {
  return (
    <Link href="/" className="group flex items-center gap-3" data-testid="link-forma-logo">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[4px_4px_0_hsl(var(--accent))] transition-transform duration-200 group-hover:-translate-y-0.5">
        <span className="absolute h-4 w-1 rounded-full bg-current -rotate-45" />
        <span className="absolute h-4 w-1 rounded-full bg-current rotate-45" />
      </span>
      <span className="forma-display text-lg font-bold tracking-[-0.05em]">
        forma<span className="text-[hsl(var(--accent))]">.</span>
      </span>
    </Link>
  );
}
