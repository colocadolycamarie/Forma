import { Link } from 'wouter';

export function FormaMark({ size = 'default', asLink = true }: { size?: 'default' | 'lg'; asLink?: boolean }) {
  const iconSize = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg';

  const content = (
    <>
      <img
        src="/forma-mark.png"
        alt=""
        className={`${iconSize} transition-transform duration-200 ${asLink ? 'group-hover:-translate-y-0.5' : ''}`}
      />
      <span className={`forma-display ${textSize} font-bold tracking-[-0.05em]`}>
        forma<span className="text-[hsl(var(--accent))]">.</span>
      </span>
    </>
  );

  if (!asLink) {
    return <div className="inline-flex items-center gap-2.5">{content}</div>;
  }

  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" data-testid="link-forma-logo">
      {content}
    </Link>
  );
}
