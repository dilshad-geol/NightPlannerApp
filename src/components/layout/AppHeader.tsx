
"use client";

import Link from 'next/link';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Moon, ListChecks, LogIn, LogOut, UserPlus, MailWarning } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export function AppHeader() {
  const { currentUser, signOutUser, sendUserEmailVerification } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: "Logout Failed", description: "Could not log you out. Please try again.", variant: "destructive" });
    }
  };
  
  const handleSendVerification = async () => {
    await sendUserEmailVerification();
  };

  return (
    <header className="py-4 px-4 md:px-6 bg-background border-b border-border sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
          <Moon className="h-7 w-7 text-primary" />
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          {currentUser ? (
            <>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/">
                  <Moon className="mr-2 h-5 w-5" />
                  <span>Plan Next Day</span>
                </Link>
              </Button>
              <Button variant="ghost" asChild className="hidden sm:flex">
                <Link href="/summary">
                  <ListChecks className="mr-2 h-5 w-5" />
                  <span>Daily Summary</span>
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || currentUser.email || "User"} />
                      <AvatarFallback>{currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser.displayName || currentUser.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {!currentUser.emailVerified && (
                    <>
                     <DropdownMenuItem onClick={handleSendVerification} className="text-yellow-500 hover:!text-yellow-400 cursor-pointer">
                        <MailWarning className="mr-2 h-4 w-4" />
                        Verify Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
              <Button variant="default" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/signup">
                  <UserPlus className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
