class AuthStore {
  // Store the access_token in an in-memory variable only (module-level singleton).
  // Never localStorage, never sessionStorage.
  private accessToken: string | null = null;

  /**
   * Sets the token in memory.
   */
  setToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Gets the token from memory.
   */
  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Clears the token from memory and fires a custom event.
   */
  clearToken(): void {
    const wasAuthenticated = this.isAuthenticated();
    this.accessToken = null;

    if (wasAuthenticated && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('questify:auth:cleared'));
    }
  }

  /**
   * Returns true if the token exists.
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

export const tokenManager = new AuthStore();
