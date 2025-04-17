import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Folder,
  BookOpen,
  CheckCircle,
  UserCog,
  BarChart2,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const navigate = (path: string) => {
    window.location.href = path;
  };
  
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/auth");
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: "Clients",
      href: "/clients",
      icon: <Users className="h-4 w-4" />
    },
    {
      name: "Services",
      href: "/services",
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <Folder className="h-4 w-4" />
    },
    {
      name: "New Contacts",
      href: "/contacts",
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      name: "Follow-Ups",
      href: "/followups",
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      name: "Employees",
      href: "/employees",
      icon: <UserCog className="h-4 w-4" />
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <BarChart2 className="h-4 w-4" />
    }
  ];

  const bottomNavItems = [
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />
    },
    {
      name: "Logout",
      onClick: handleLogout,
      icon: <LogOut className="h-4 w-4" />
    }
  ];

  return (
    <aside
      id="sidebar"
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r bg-background pt-14 lg:pt-14 transition-transform duration-200 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="flex flex-col gap-1 p-4 h-full">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                location === item.href
                  ? "bg-secondary text-white"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.name}
            </a>
          </Link>
        ))}
        
        <div className="mt-auto pt-4 border-t">
          {bottomNavItems.map((item, index) => (
            <React.Fragment key={item.name}>
              {item.href ? (
                <Link href={item.href}>
                  <a
                    className={cn(
                      "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                      location === item.href
                        ? "bg-secondary text-white"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </a>
                </Link>
              ) : (
                <button
                  onClick={item.onClick}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium w-full text-left text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  {item.icon}
                  {item.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>
    </aside>
  );
}
