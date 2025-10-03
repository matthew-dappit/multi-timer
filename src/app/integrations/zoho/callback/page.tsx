"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zohoOAuthAPI, ZohoOAuthError } from "@/lib/zoho-oauth";

export default function ZohoCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [message, setMessage] = useState<string>("Processing OAuth callback...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract parameters from URL
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const location = searchParams.get("location");
        const accountsServer = searchParams.get("accounts-server");

        // Validate required parameters
        if (!code || !state) {
          throw new Error("Missing required OAuth parameters (code or state)");
        }

        // Call the callback API
        const response = await zohoOAuthAPI.callback({
          code,
          state,
          location: location || undefined,
          accounts_server: accountsServer || undefined,
        });

        // Success!
        setStatus("success");
        setMessage(response.message || "Zoho connected successfully!");

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");

        if (error instanceof ZohoOAuthError) {
          setMessage(error.message);
        } else if (error instanceof Error) {
          setMessage(error.message);
        } else {
          setMessage("Failed to complete Zoho OAuth connection");
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {status === "processing" && (
            <>
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 dark:border-teal-400 mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connecting to Zoho
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Success!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{message}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Redirecting to home page...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Connection Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200"
              >
                Return to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

