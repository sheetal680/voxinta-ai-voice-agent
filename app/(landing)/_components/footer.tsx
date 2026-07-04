import Link from "next/link";

const FOOTER_LINKS = [
  { label: "Log in", href: "/login" },
  { label: "Sign up", href: "/signup" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-sm sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          &copy; {new Date().getFullYear()} Voxinta. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
