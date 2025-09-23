import Image from "next/image";
import MultiTimer from "@/components/MultiTimer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex items-center">
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
            </div>
            {/* Header Text */}
            <div className="hidden sm:block ml-auto">
              <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
                Multi-Timer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional Time Tracking
              </p>
            </div>
            {/* Mobile Title */}
            <div className="sm:hidden ml-4">
              <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
                Multi-Timer
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Multi-Timer Component */}
        <MultiTimer />
      </main>
    </div>
  );
}
