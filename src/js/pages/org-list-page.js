/**
 * Organization List Page
 * TODO: Implement organization listing
 */

class OrgListPage {
  constructor(params = {}) {
    this.params = params;
  }

  async render() {
    const container = document.createElement('div');
    container.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-title>Organizations</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div class="page-container">
          <h1>Your Organizations</h1>
          <p>Coming in Phase 3: Display all organizations you belong to</p>
        </div>
      </ion-content>
    `;

    return container;
  }

  async mounted() {
    // TODO: Load organizations from PouchDB
  }
}

export default OrgListPage;
