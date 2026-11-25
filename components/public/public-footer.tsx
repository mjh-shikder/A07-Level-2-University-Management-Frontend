import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background/50 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground"
          >
            <span
              className="size-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            UniManage
          </Link>
          <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
            Unified academic operations for students, faculty instructors, and
            university administrators.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
              University
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About
                </Link>
              </li>
              <li>
                <Link href="/programs" className="hover:text-foreground">
                  Academic Programs
                </Link>
              </li>
              <li>
                <Link href="/tuition-faq" className="hover:text-foreground">
                  Tuition &amp; FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Portals
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Student Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Instructor Portal
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground">
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-foreground uppercase">
              Admissions
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact Office
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        &copy; 2026 UniManage Academic Systems. All rights reserved.
      </div>
    </footer>
  );
}
