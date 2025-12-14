/**
 * Dashboard Page
 * TODO: Implement full dashboard functionality
 */

class DashboardPage {
  constructor(params = {}) {
    this.params = params;
  }

  async render() {
    const container = document.createElement('div');
    container.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title>Dashboard</ion-title>
          <ion-buttons slot="end">
            <ion-button id="logout-btn">Logout</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div class="page-container">
          <h1>Welcome to V4L</h1>
          <p>Connecting local businesses with local customers.</p>
          <p>Phase 2 will implement:</p>
          <ul>
            <li>Active organization display</li>
            <li>Organization switcher</li>
            <li>Quick stats and metrics</li>
            <li>Recent activity feed</li>
          </ul>
        </div>
      </ion-content>
    `;

    return container;
  }

  async mounted() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        alert('Logout functionality coming soon!');
      });
    }
  }
}

export default DashboardPage;
