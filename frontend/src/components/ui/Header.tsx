'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils/constants';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/demo', label: 'Demo' },
  { href: '/history', label: 'History' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-2">
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Smart<span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">Sign</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-400'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}


