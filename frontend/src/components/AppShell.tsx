"use client";

import {
  BookOpen,
  Download,
  GraduationCap,
  LayoutGrid,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
};

const navItems = [
  { icon: LayoutGrid, label: "Dashboard", active: false },
  { icon: BookOpen, label: "Syllabuses", active: true },
  { icon: GraduationCap, label: "Skills", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export function AppShell({
  children,
  title,
  subtitle,
  badge,
  actions,
}: AppShellProps) {
  return (
    <div className="admin-page flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-sidebar-border bg-sidebar lg:w-56">
        <div className="flex h-14 items-center justify-center border-b border-sidebar-border px-3 lg:justify-start lg:px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            4G
          </div>
          <span className="ml-3 hidden text-sm font-semibold text-foreground lg:inline">
            4Geeks Admin
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`admin-sidebar-link w-full ${
                item.active ? "admin-sidebar-link-active" : ""
              }`}
            >
              <span
                className={`admin-sidebar-icon shrink-0 ${
                  item.active ? "admin-sidebar-icon-active" : ""
                }`}
              >
                <item.icon className="size-4" />
              </span>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="hidden rounded-lg bg-muted/50 p-3 lg:block">
            <p className="text-sm font-medium text-foreground">
              Syllabus Planner
            </p>
            <p className="text-xs text-muted-foreground">
              Program architecture
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pl-16 lg:pl-56">
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-6 py-5 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {title}
                </h1>
                {badge ? (
                  <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                    {badge}
                  </span>
                ) : null}
              </div>
              {subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </div>
        </header>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

export function ExportButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Download className="size-4" />
      Export CSV
    </a>
  );
}
