import { Link } from 'wouter';

export function FormaMark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" data-testid="link-forma-logo">
      <img
        src="/forma-mark.png"
        alt=""
        className="h-9 w-9 transition-transform duration-200 group-hover:-translate-y-0.5"
      />
      <span className="forma-display text-lg font-bold tracking-[-0.05em]">
        forma<span className="text-[hsl(var(--accent))]">.</span>
      </span>
    </Link>
  );
}
