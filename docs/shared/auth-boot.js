// docs/shared/auth-boot.js
import HanuAuth from './auth.js';

/**
 * Wait until the user has logged in before the rest of the page runs.
 * Shows the little “Enter authentication token” banner automatically.
 */
await HanuAuth.requireLogin();   // blocks until there is a valid token
