import './style.css';

// Import loading state first
import { showLoading, LoadingStateType } from './components/ui/LoadingState';
import { initializeApp } from './services/AppService';

// Show loading screen immediately when the page loads
showLoading(LoadingStateType.INITIAL);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize app and handle any errors
  initializeApp().catch(error => {
    console.error('Application initialization failed:', error);
    
    // Display error to user
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="error-message">
          Failed to initialize application. Please refresh the page and try again.
          <br>
          Error: ${error instanceof Error ? error.message : String(error)}
        </div>
      `;
    }
  });
});
