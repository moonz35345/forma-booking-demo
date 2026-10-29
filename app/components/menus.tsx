'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

function useMenu(width: number) {
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; maxHeight: number }>();

  useEffect(() => {
    if (open) { setPresent(true); return; }
    const timer = setTimeout(() => setPresent(false), 150);
    return () => clearTimeout(timer);
  }, [open]);

  useLayoutEffect(() => {
    if (!present) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const panelWidth = Math.min(Math.max(rect.width, width), window.innerWidth - 24);
      const desiredHeight = Math.min(panel.current?.scrollHeight || 280, 340);
      const below = window.innerHeight - rect.bottom - 20;
      const above = rect.top - 20;
      const upwards = below < desiredHeight && above > below;
      const height = Math.min(desiredHeight, Math.max(100, upwards ? above : below));
      setPosition({ top: upwards ? Math.max(12, rect.top - height - 8) : rect.bottom + 8,
        left: Math.min(Math.max(12, rect.left), window.innerWidth - panelWidth - 12),
        width: panelWidth, maxHeight: height });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [present, width]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
      if (event.key === 'Tab') setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  return { trigger, panel, open, setOpen, present, position };
}

export function SelectMenu({ label, value, onChange, options, icon }: {
  label: string; value: string; onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[]; icon?: ReactNode;
}) {
  const menu = useMenu(200);
  const id = useId();
  const [active, setActive] = useState(0);
  const typeahead = useRef({ text: '', at: 0 });
  const selected = Math.max(0, options.findIndex(option => option.value === value));
  const show = () => { setActive(selected); menu.setOpen(true); };
  const choose = (index: number) => { if (!options[index]) return; onChange(options[index].value); menu.setOpen(false); menu.trigger.current?.focus(); };
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!menu.open) { show(); if (event.key === 'End') setActive(options.length - 1); return; }
      setActive(index => event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); if (menu.open) choose(active); else show();
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      typeahead.current = { text: (now - typeahead.current.at < 600 ? typeahead.current.text : '') + event.key.toLowerCase(), at: now };
      const index = options.findIndex(option => option.label.toLowerCase().startsWith(typeahead.current.text));
      if (index >= 0) { menu.setOpen(true); setActive(index); }
    }
  };
  return <>
    <button ref={menu.trigger} type="button" className="select-menu-trigger" role="combobox" aria-label={label} aria-expanded={menu.open} aria-haspopup="listbox" aria-controls={`${id}-list`} aria-activedescendant={menu.open ? `${id}-${active}` : undefined} onKeyDown={keyboard} onClick={() => menu.open ? menu.setOpen(false) : show()}>
      {icon}<span>{options[selected]?.label}</span><ChevronDown size={14} className="menu-chevron"/>
    </button>
    {menu.present && createPortal(<div ref={menu.panel} id={`${id}-list`} role="listbox" aria-label={label} className="floating-menu select-menu" data-open={menu.open} style={{ ...menu.position, visibility: menu.position ? 'visible' : 'hidden' }}>
      <div className="menu-section-label">{label.replace('Filter ', '')}</div>
      {options.map((option, index) => <div id={`${id}-${index}`} role="option" aria-selected={value === option.value} key={option.value} className="select-menu-option" data-highlighted={active === index} onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span><Check size={15} style={{ opacity: value === option.value ? 1 : 0 }}/>
      </div>)}
    </div>, document.body)}
  </>;
}

export function ActionMenu({ label, className, children, heading, items }: {
  label: string; className: string; children: ReactNode; heading: string;
  items: { label: string; description?: string; icon: ReactNode; action: () => void }[];
}) {
  const menu = useMenu(252);
  const id = useId();
  useEffect(() => {
    if (!menu.open || !menu.present) return;
    const frame = requestAnimationFrame(() => menu.panel.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [menu.open, menu.present, menu.panel]);
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menu.panel.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') || []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    }
    if (event.key === 'Tab') menu.trigger.current?.focus();
  };
  return <>
    <button type="button" ref={menu.trigger} className={className} aria-label={label} aria-haspopup="menu" aria-expanded={menu.open} aria-controls={id} onClick={() => menu.setOpen(!menu.open)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); menu.setOpen(true); } }}>{children}</button>
    {menu.present && createPortal(<div ref={menu.panel} id={id} role="menu" aria-label={label} className="floating-menu action-menu" data-open={menu.open} style={{ ...menu.position, visibility: menu.position ? 'visible' : 'hidden' }} onKeyDown={keyboard}>
      <div className="menu-section-label">{heading}</div>
      {items.map(item => <button type="button" role="menuitem" key={item.label} onClick={() => { menu.setOpen(false); menu.trigger.current?.focus(); item.action(); }}>
        <span className="menu-item-icon">{item.icon}</span><span><strong>{item.label}</strong>{item.description && <small>{item.description}</small>}</span>
      </button>)}
    </div>, document.body)}
  </>;
}
