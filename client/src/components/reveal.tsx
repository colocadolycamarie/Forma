import type { ReactNode } from 'react';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`${className} ${visible ? 'stagger-in' : 'opacity-0'}`}>
      {children}
    </div>
  );
}
