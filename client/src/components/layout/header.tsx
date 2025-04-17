import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 lg:h-14">
      <Button
        variant="outline"
        size="icon"
        id="menu-toggle"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </Button>
      
      <div className="ml-2 flex items-center gap-2 lg:ml-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary"
        >
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
        </svg>
        <h1 className="font-semibold text-lg md:text-xl">Business Solution Manager</h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="border-l h-6"></div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user ? getInitials(user.username) : "U"}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="text-sm font-medium">{user?.username}</div>
                <div className="text-xs text-muted-foreground">
                  {user?.employeeId ? "Employee" : "User"}
                </div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setLocation("/")}>
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive" 
              onSelect={handleLogout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
