'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authUtils } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Users, 
  Book,
  LogOut,
  Settings
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { userType, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || userType !== 'admin') {
      router.push('/login');
    }
  }, [isAuthenticated, userType, router]);

  if (!isAuthenticated || userType !== 'admin') {
    return null;
  }

  const navItems = [
    { href: '/login/dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { href: '/login/dashboard/exam-sets', label: 'Bộ Đề Thi', icon: FileText },
    { href: '/login/dashboard/exam', label: 'Kích Hoạt Thi', icon: Settings },
    { href: '/login/dashboard/results', label: 'Kết Quả', icon: Users },
    { href: '/login/dashboard/books', label: 'Sách Di Sản', icon: Book },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-screen p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">HCMUTE</p>
          </div>
          
          <Separator className="mb-4" />
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-4" />

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Đăng Xuất
          </Button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

