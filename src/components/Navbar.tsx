"use client";

import Image from "next/image";
import Link from "next/link";
import {useAuth} from "@/contexts/AuthContext";

export default function Navbar() {
  const {user, isAuthenticated, logout} = useAuth();

  const handleLogout = async () => {
    await logout();
  };

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
            <div className="ml-6 flex items-center gap-4">
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
      </div>
    </header>
  );
}
