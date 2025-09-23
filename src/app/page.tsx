import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-medium text-gray-900 dark:text-gray-100">
              Multi-Timer
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
            Professional Time Tracking
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Track time across multiple projects and tasks with seamless
            stopwatches designed for professional software development teams.
          </p>

          {/* Coming Soon Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-dappit-turquoise rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              Stopwatch Component
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Coming Soon</p>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              Next: Create basic stopwatch component
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
