import './styles/index.css';
import './styles/components.css';
import './styles/landing.css';
import { handleRouting } from './router.js';
import { initializeTenant } from './tenant.js';

// Listen to hash changes for single-page routing
window.addEventListener('hashchange', handleRouting);

// Initialize app on DOM ready
window.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeTenant();
    await handleRouting();
  } catch (error) {
    document.getElementById('app').innerHTML = `<main class="boot-error"><h1>Restaurant unavailable</h1><p>${error.message || 'Please try again later.'}</p><button onclick="window.location.reload()">Try again</button></main>`;
  }
});
