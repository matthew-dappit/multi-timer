// Zoho OAuth utility functions

const ZOHO_API_BASE_URL = process.env.NEXT_PUBLIC_ZOHO_OAUTH_API_BASE_URL;

export interface ZohoOAuthInitiateResponse {
  authorization_url: string;
}

export interface ZohoOAuthCallbackRequest {
  code: string;
  state: string;
  location?: string;
  accounts_server?: string;
}

export interface ZohoOAuthCallbackResponse {
  success: boolean;
  message: string;
  expires_in: number;
}

export interface ZohoOAuthStatusResponse {
  connected: boolean;
  token_valid?: boolean;
  expires_at?: string;
  updated_at?: string;
  message?: string;
}

export class ZohoOAuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ZohoOAuthError";
  }
}

// Get auth token from localStorage (same as main auth)
function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("multi-timer-auth-token");
  }
  return null;
}

// Zoho OAuth API functions
export const zohoOAuthAPI = {
  /**
   * Initiate OAuth flow - Get authorization URL from backend
   * Requires authentication
   */
  async initiate(): Promise<ZohoOAuthInitiateResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new ZohoOAuthError("Not authenticated", 401);
    }

    const response = await fetch(`${ZOHO_API_BASE_URL}/zoho/oauth/initiate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoOAuthError(
        error || "Failed to initiate OAuth flow",
        response.status
      );
    }

    const data: ZohoOAuthInitiateResponse = await response.json();
    return data;
  },

  /**
   * Handle OAuth callback - Exchange code for tokens
   * Does not require authentication (validated via state parameter)
   */
  async callback(
    callbackData: ZohoOAuthCallbackRequest
  ): Promise<ZohoOAuthCallbackResponse> {
    const response = await fetch(`${ZOHO_API_BASE_URL}/zoho/oauth/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callbackData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoOAuthError(
        error || "Failed to complete OAuth callback",
        response.status
      );
    }

    const data: ZohoOAuthCallbackResponse = await response.json();
    return data;
  },

  /**
   * Get OAuth connection status
   * Requires authentication
   */
  async getStatus(): Promise<ZohoOAuthStatusResponse> {
    const token = getAuthToken();
    if (!token) {
      throw new ZohoOAuthError("Not authenticated", 401);
    }

    const response = await fetch(`${ZOHO_API_BASE_URL}/zoho/oauth/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoOAuthError(
        error || "Failed to get OAuth status",
        response.status
      );
    }

    const data: ZohoOAuthStatusResponse = await response.json();
    return data;
  },

  /**
   * Disconnect Zoho OAuth
   * Requires authentication
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const token = getAuthToken();
    if (!token) {
      throw new ZohoOAuthError("Not authenticated", 401);
    }

    const response = await fetch(
      `${ZOHO_API_BASE_URL}/zoho/oauth/disconnect`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new ZohoOAuthError(
        error || "Failed to disconnect Zoho",
        response.status
      );
    }

    const data = await response.json();
    return data;
  },

  /**
   * Start OAuth flow - Initiates and redirects to Zoho
   */
  async startOAuthFlow(): Promise<void> {
    try {
      const { authorization_url } = await this.initiate();
      // Redirect to Zoho authorization page
      window.location.href = authorization_url;
    } catch (error) {
      if (error instanceof ZohoOAuthError) {
        throw error;
      }
      throw new ZohoOAuthError("Failed to start OAuth flow");
    }
  },
};

