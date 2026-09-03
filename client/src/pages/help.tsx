import { ChevronDown, Mail } from 'lucide-react';
import { useState } from 'react';
import { PageIntro } from '@/components/page-states';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How does the streak actually work?',
    a: "A day counts once you've logged at least one set. If a planned day passes with nothing logged, it's marked Not logged and the streak resets the next morning — the missed day itself stays visible in your history, it's never hidden.",
  },
  {
    q: "What counts as a PR?",
    a: 'A set counts as a PR when its estimated one-rep max beats your best-ever result for that exercise, not just when the raw weight is heavier — so a strong 5-rep set can still be a PR even if an old 1-rep set moved more total weight.',
  },
  {
    q: "I logged a set with no signal — did it save?",
    a: "Yes. Sets logged offline are queued on your device and sync automatically the moment you're back online, in the order you logged them. You'll see an \"Offline — queued\" tag on the header while it's waiting.",
  },
  {
    q: 'Can I switch between kg and lb?',
    a: "Yes, in Settings → Account. It only changes how numbers are displayed — your history is stored in one canonical unit, so switching back and forth never rewrites a past PR.",
  },
  {
    q: 'How do I connect with a coach?',
    a: "From Your coach, enter the short code they share with you. If you don't have a coach yet, that same screen is where you'd add one once you have a code.",
  },
  {
    q: 'How do I remove my account and data?',
    a: 'Settings → Privacy has both a "Download my data" request and a "Delete my account" action. Deletion is permanent and removes your training history, streak, and any coach pairing.',
  },
];

function FaqRow({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-dashed border-[hsl(var(--border))] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        data-testid={`button-faq-${index}`}
        className="flex min-h-14 w-full items-center gap-4 py-4 text-left"
      >
        <span className="forma-mono text-[10px] font-bold text-[hsl(var(--muted-foreground))]">Q{String(index + 1).padStart(2, '0')}</span>
        <span className="flex-1 text-sm font-semibold">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-[hsl(var(--muted-foreground))] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="max-w-2xl pb-5 pl-9 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{a}</p>}
    </div>
  );
}

export default function HelpPage() {
  return (
    <div>
      <PageIntro eyebrow="Support" title="Help.">
        Answers to the questions we hear most. If yours isn't here, write to us directly.
      </PageIntro>

      <div className="mb-8 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 sm:px-6">
        {FAQS.map((faq, index) => (
          <FaqRow key={faq.q} q={faq.q} a={faq.a} index={index} />
        ))}
      </div>

      <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-[hsl(var(--border))] p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="forma-display text-lg font-semibold">Still stuck?</p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">We read every message ourselves — no ticket queue.</p>
        </div>
        <a
          href="mailto:support@forma.app"
          data-testid="link-email-support"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[hsl(var(--foreground))] px-5 text-sm font-semibold text-[hsl(var(--background))] hover:opacity-90"
        >
          <Mail size={16} />
          support@forma.app
        </a>
      </div>
    </div>
  );
}
