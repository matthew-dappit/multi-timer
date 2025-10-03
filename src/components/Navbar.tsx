"use client";

import Image from "next/image";
import Link from "next/link";
import {useAuth} from "@/contexts/AuthContext";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {zohoOAuthAPI, ZohoOAuthError} from "@/lib/zoho-oauth";

export default function Navbar() {
  const {user, isAuthenticated, logout} = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const handleConnectZoho = async () => {
    try {
      await zohoOAuthAPI.startOAuthFlow();
    } catch (error) {
      console.error("Failed to start Zoho OAuth:", error);
      if (error instanceof ZohoOAuthError) {
        alert(`Failed to connect to Zoho: ${error.message}`);
      } else {
        alert("Failed to connect to Zoho. Please try again.");
      }
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="bg-white shadow-[0px_9px_90px_25px_rgba(0,0,0,0.02)]">
      <div className="flex flex-row justify-between items-center py-2 px-6 sm:px-12 gap-2.5 h-[89px]">
        {/* Logo and Title */}
        <Link
          href="/"
          className="flex flex-col items-start"
          aria-label="Go to home page"
        >
          <div className="relative w-28 h-[52px]">
            <Image
              src="/dappit-logo-LightBG.svg"
              alt="Dappit Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span
            className="text-[12.86px] font-light tracking-[0.54px] leading-[15px]"
            style={{fontFamily: "Poppins, sans-serif"}}
          >
            MULTI-TIMER
          </span>
        </Link>

        {/* Center Navigation - Hidden on mobile */}
        {isAuthenticated && user && (
          <nav className="hidden md:flex items-center gap-6 mx-auto">
            <Link
              href="/"
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                isActive("/")
                  ? "bg-teal-50 text-teal-600"
                  : "text-gray-700 hover:text-teal-600 hover:bg-gray-100"
              }`}
            >
              Timers
            </Link>
            <Link
              href="/insights"
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                isActive("/insights")
                  ? "bg-teal-50 text-teal-600"
                  : "text-gray-700 hover:text-teal-600 hover:bg-gray-100"
              }`}
            >
              Insights
            </Link>
            <button
              onClick={handleConnectZoho}
              className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors duration-200"
            >
              Connect to Zoho
            </button>
          </nav>
        )}

        {/* Right side - User info and logout */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-gray-100 transition-colors"
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

            {/* User info - Desktop only */}
            <div
              className="hidden md:flex flex-col items-end"
              style={{fontFamily: "Poppins, sans-serif"}}
            >
              <p className="text-base font-normal leading-7 text-black">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-base font-light leading-7 text-[#717182]">
                {user.email}
              </p>
            </div>

            {/* Logout button - Desktop only */}
            <button
              onClick={handleLogout}
              className="hidden md:block"
              aria-label="Logout"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.58L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isAuthenticated && user && mobileMenuOpen && (
        <nav className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-2 px-6 pb-4">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive("/")
                ? "bg-teal-50 text-teal-600"
                : "text-gray-700 hover:text-teal-600 hover:bg-gray-100"
            }`}
          >
            Timers
          </Link>
          <Link
            href="/insights"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive("/insights")
                ? "bg-teal-50 text-teal-600"
                : "text-gray-700 hover:text-teal-600 hover:bg-gray-100"
            }`}
          >
            Insights
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleConnectZoho();
            }}
            className="w-full text-left px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors"
          >
            Connect to Zoho
          </button>
          <div className="pt-2 mt-2 border-t border-gray-200">
            <div className="px-4 py-2 text-xs text-gray-500">
              {user.first_name} {user.last_name}
              <div>{user.email}</div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full mt-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
