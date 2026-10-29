'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

let currentTransition: ViewTransition | undefined;

/** Native snapshots preserve the outgoing view while React renders the next one. */
export function transitionUI(update: () => void) {
  if (typeof document === 'undefined' || !document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }
  currentTransition?.skipTransition();
  const transition = document.startViewTransition(() => flushSync(update));
  currentTransition = transition;
  void transition.ready.catch(() => {}); // Rapid navigation can intentionally skip a snapshot.
  void transition.finished.finally(() => {
    if (currentTransition === transition) currentTransition = undefined;
  }).catch(() => {});
}

/** Animate the displayed number; expose only its final value to assistive technology. */
export function AnimatedMetric({ value }: { value: string | number }) {
  const label = String(value);
  const target = Number(label.replace(/[^\d.]/g, ''));
  const current = useRef(target);
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!Number.isFinite(target) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const from = current.current;
    if (from === target) return;
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 580, 1);
      const next = from + (target - from) * (1 - Math.pow(1 - progress, 4));
      current.current = next;
      setDisplay(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const text = label.startsWith('$')
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(display)
    : label.endsWith('h') ? `${display.toFixed(1)}h` : String(Math.round(display));

  return <span className="metric-number" aria-label={label}><span aria-hidden="true">{text}</span></span>;
}

/** Keep the form's height flowing as its contents change, including on mobile. */
export function FormStage({ step, children }: { step: number; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="form-stage-shell" style={height === undefined ? undefined : { height }}>
    <div ref={content}><div className="form-stage" key={step}>{children}</div></div>
  </div>;
}
