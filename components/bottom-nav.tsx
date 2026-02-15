"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wrench, Shield, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Tools", href: "/", icon: Wrench },
  { label: "Privacy", href: "/privacy", icon: Shield },
  { label: "Support", href: "https://www.buymeacoffee.com/zanoshky", icon: Coffee, external: true },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background/80 backdrop-blur-md lg:hidden"
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/" || pathname.startsWith("/tools")
            : pathname === item.href;

        if (item.external) {
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
