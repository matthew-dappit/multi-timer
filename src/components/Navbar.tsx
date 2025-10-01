"use client";

import Image from "next/image";
import Link from "next/link";
import {useAuth} from "@/contexts/AuthContext";
import {useState} from "react";
import {usePathname} from "next/navigation";

export default function Navbar() {
  const {user, isAuthenticated, logout} = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center"
            aria-label="Go to home page"
          >
            <Image
              src="/dappit-logo-LightBG.svg"
              alt="Dappit Logo"
              width={120}
              height={40}
              priority
              className="dark:hidden"
            />
            <Image
              src="/dappit-logo-DarkBG.svg"
              alt="Dappit Logo"
              width={120}
              height={40}
              priority
              className="hidden dark:block"
            />
          </Link>
          <div className="hidden sm:block ml-auto">
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              Multi-Timer
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Professional Time Tracking
            </p>
          </div>
          <div className="sm:hidden ml-4">
            <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
              Multi-Timer
            </h1>
          </div>

          {isAuthenticated && user && (
            <nav className="hidden md:flex items-center gap-2 ml-6">
              <Link
                href="/"
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                  isActive("/")
                    ? "bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
                    : "text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Timers
              </Link>
              <Link
                href="/insights"
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                  isActive("/insights")
                    ? "bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
                    : "text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Insights
              </Link>
            </nav>
          )}

          {isAuthenticated && user && (
            <div className="ml-auto md:ml-6 flex items-center gap-2">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>

              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && user && mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive("/")
                  ? "bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
                  : "text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Timers
            </Link>
            <Link
              href="/insights"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive("/insights")
                  ? "bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400"
                  : "text-gray-700 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Insights
            </Link>
            <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                {user.first_name} {user.last_name}
                <div>{user.email}</div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
