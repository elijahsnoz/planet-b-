import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ status, archived }: { status: string; archived?: boolean }) {
  const map: Record<string, string> = {
    published: "text-verified border-verified",
    draft: "text-stone border-stone",
    in_review: "text-clay border-clay",
    archived: "text-accent border-accent",
    issued: "text-verified border-verified",
    reserved: "text-stone border-stone",
  };
  const label = archived ? "archived" : status;
  const cls = archived ? map.archived : map[status] ?? "text-stone border-stone";
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>{label}</span>;
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? undefined}
        className="mt-1 min-h-[44px] w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
      />
      {hint && <span className="mt-1 block text-xs text-stone">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 5,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-text-muted">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        className="mt-1 min-h-[44px] w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
      />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <label className="block text-sm">
      <span className="text-text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue ?? undefined}
        className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="inline-flex min-h-[44px] items-center rounded-sm bg-accent px-4 text-sm text-paper transition-transform hover:-translate-y-0.5 active:translate-y-0">
      {children}
    </button>
  );
}

export function GhostLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-[44px] items-center rounded-sm border border-border px-4 text-sm transition-colors hover:border-accent hover:text-accent">
      {children}
    </Link>
  );
}

export const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "published", label: "Published" },
];

export const CONSENT_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "granted", label: "Granted" },
  { value: "withheld", label: "Withheld" },
];
