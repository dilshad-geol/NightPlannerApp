import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Moon, ListChecks } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="py-4 px-4 md:px-6 bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
          <Moon className="h-7 w-7 text-primary" />
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/">
              <Moon className="mr-2 h-5 w-5" /> {/* Icon size increased, mr-2 for spacing when text visible */}
              <span className="hidden sm:inline">Plan Next Day</span> {/* Text hidden on xs screens */}
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/summary">
              <ListChecks className="mr-2 h-5 w-5" /> {/* Icon size increased, mr-2 for spacing when text visible */}
              <span className="hidden sm:inline">Daily Summary</span> {/* Text hidden on xs screens */}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
