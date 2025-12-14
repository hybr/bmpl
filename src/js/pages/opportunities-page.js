/**
 * Opportunities Page
 * Browse jobs, view applications, and post vacancies
 */

import { navigationState } from '../state/navigation-state.js';
import { authState } from '../state/auth-state.js';
import { eventBus } from '../utils/events.js';
import { router } from '../router.js';

export class OpportunitiesPage {
  constructor(params = {}) {
    this.params = params;
    this.currentView = 'jobs';
    this.setupEventListeners();
  }

  /**
   * Render the opportunities page
   */
  async render() {
    const page = document.createElement('ion-page');
    page.className = 'opportunities-page';

    // Header
    const header = this.createHeader();
    page.appendChild(header);

    // Content
    const content = document.createElement('ion-content');
    content.className = 'opportunities-content';

    // Main content area
    const mainContent = document.createElement('div');
    mainContent.className = 'opportunities-main-content';
    mainContent.id = 'opportunities-main-content';

    // Initial content
    mainContent.innerHTML = this.getContentForView('jobs');

    content.appendChild(mainContent);
    page.appendChild(content);

    return page;
  }

  /**
   * Create page header
   */
  createHeader() {
    const header = document.createElement('ion-header');

    const toolbar = document.createElement('ion-toolbar');
    toolbar.className = 'opportunities-toolbar';

    const title = document.createElement('ion-title');
    title.textContent = 'Opportunities';
    toolbar.appendChild(title);

    // Filter button
    const filterButton = document.createElement('ion-button');
    filterButton.setAttribute('slot', 'end');
    filterButton.setAttribute('fill', 'clear');

    const filterIcon = document.createElement('ion-icon');
    filterIcon.setAttribute('name', 'filter');
    filterButton.appendChild(filterIcon);

    filterButton.addEventListener('click', () => {
      this.openFilters();
    });

    toolbar.appendChild(filterButton);

    header.appendChild(toolbar);
    return header;
  }

  /**
   * Get content HTML for a specific view
   */
  getContentForView(view) {
    const contentMap = {
      jobs: this.getJobsContent(),
      applied: this.getAppliedContent(),
      saved: this.getSavedContent(),
      post: this.getPostJobContent()
    };

    return contentMap[view] || contentMap.jobs;
  }

  /**
   * Get jobs content
   */
  getJobsContent() {
    return `
      <div class="content-section">
        <h2>Open Job Vacancies</h2>
        <ion-list>
          <ion-item class="job-item" data-job-id="1">
            <ion-icon name="briefcase" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Barista</h3>
              <p>Local Coffee Shop</p>
              <div class="job-meta">
                <ion-chip color="primary">
                  <ion-label>Full-time</ion-label>
                </ion-chip>
                <ion-chip>
                  <ion-icon name="location"></ion-icon>
                  <ion-label>2.3 km away</ion-label>
                </ion-chip>
              </div>
            </ion-label>
            <div slot="end" class="job-actions">
              <ion-button size="small" class="apply-button">Apply</ion-button>
              <ion-button size="small" fill="clear" class="save-button">
                <ion-icon name="bookmark-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-item>

          <ion-item class="job-item" data-job-id="2">
            <ion-icon name="briefcase" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Delivery Driver</h3>
              <p>Fresh Produce Market</p>
              <div class="job-meta">
                <ion-chip color="warning">
                  <ion-label>Part-time</ion-label>
                </ion-chip>
                <ion-chip>
                  <ion-icon name="location"></ion-icon>
                  <ion-label>1.8 km away</ion-label>
                </ion-chip>
              </div>
            </ion-label>
            <div slot="end" class="job-actions">
              <ion-button size="small" class="apply-button">Apply</ion-button>
              <ion-button size="small" fill="clear" class="save-button">
                <ion-icon name="bookmark-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-item>

          <ion-item class="job-item" data-job-id="3">
            <ion-icon name="briefcase" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Sales Associate</h3>
              <p>Tech Repair Shop</p>
              <div class="job-meta">
                <ion-chip color="primary">
                  <ion-label>Full-time</ion-label>
                </ion-chip>
                <ion-chip>
                  <ion-icon name="location"></ion-icon>
                  <ion-label>3.2 km away</ion-label>
                </ion-chip>
              </div>
            </ion-label>
            <div slot="end" class="job-actions">
              <ion-button size="small" class="apply-button">Apply</ion-button>
              <ion-button size="small" fill="clear" class="save-button">
                <ion-icon name="bookmark-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>
      </div>
    `;
  }

  /**
   * Get applied jobs content
   */
  getAppliedContent() {
    if (!authState.isAuth()) {
      return this.getAuthRequiredContent('view your applications');
    }

    return `
      <div class="content-section">
        <h2>My Applications</h2>
        <ion-list>
          <ion-item class="application-item" data-app-id="1">
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label>
              <h3>Barista</h3>
              <p>Local Coffee Shop</p>
              <p class="status">Applied 2 days ago</p>
            </ion-label>
            <ion-badge color="warning" slot="end">Under Review</ion-badge>
          </ion-item>

          <ion-item class="application-item" data-app-id="2">
            <ion-icon name="checkmark-circle" slot="start" color="success"></ion-icon>
            <ion-label>
              <h3>Sales Associate</h3>
              <p>Tech Repair Shop</p>
              <p class="status">Applied 1 week ago</p>
            </ion-label>
            <ion-badge color="success" slot="end">Interview Scheduled</ion-badge>
          </ion-item>
        </ion-list>
      </div>
    `;
  }

  /**
   * Get saved jobs content
   */
  getSavedContent() {
    if (!authState.isAuth()) {
      return this.getAuthRequiredContent('view saved jobs');
    }

    return `
      <div class="content-section">
        <h2>Saved Jobs</h2>
        <ion-list>
          <ion-item class="job-item" data-job-id="4">
            <ion-icon name="bookmark" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h3>Marketing Manager</h3>
              <p>Premium Coffee House</p>
              <div class="job-meta">
                <ion-chip color="primary">
                  <ion-label>Full-time</ion-label>
                </ion-chip>
                <ion-chip>
                  <ion-icon name="location"></ion-icon>
                  <ion-label>4.1 km away</ion-label>
                </ion-chip>
              </div>
            </ion-label>
            <div slot="end" class="job-actions">
              <ion-button size="small" class="apply-button">Apply</ion-button>
              <ion-button size="small" fill="clear" color="danger" class="unsave-button">
                <ion-icon name="trash"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>
      </div>
    `;
  }

  /**
   * Get post job content
   */
  getPostJobContent() {
    if (!authState.isAuth()) {
      return this.getAuthRequiredContent('post a job');
    }

    return `
      <div class="content-section">
        <h2>Post a Job Vacancy</h2>
        <div class="job-form">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Job Title</ion-label>
              <ion-input placeholder="e.g. Barista, Sales Associate"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Organization</ion-label>
              <ion-select placeholder="Select organization">
                <ion-select-option value="org1">My Coffee Shop</ion-select-option>
                <ion-select-option value="org2">My Market</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Employment Type</ion-label>
              <ion-select placeholder="Select type">
                <ion-select-option value="full">Full-time</ion-select-option>
                <ion-select-option value="part">Part-time</ion-select-option>
                <ion-select-option value="contract">Contract</ion-select-option>
                <ion-select-option value="intern">Internship</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Description</ion-label>
              <ion-textarea rows="6" placeholder="Job description and requirements"></ion-textarea>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Salary Range (Optional)</ion-label>
              <ion-input placeholder="e.g. $15-20/hour"></ion-input>
            </ion-item>
          </ion-list>

          <div class="form-actions">
            <ion-button expand="block" class="post-job-button">
              <ion-icon name="add-circle" slot="start"></ion-icon>
              Post Job Vacancy
            </ion-button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get auth required content
   */
  getAuthRequiredContent(action) {
    return `
      <div class="auth-required-content">
        <ion-icon name="lock-closed" color="medium"></ion-icon>
        <h3>Login Required</h3>
        <p>You need to be logged in to ${action}</p>
        <ion-button id="login-button">
          <ion-icon name="log-in" slot="start"></ion-icon>
          Login
        </ion-button>
      </div>
    `;
  }

  /**
   * Update content based on view
   */
  updateContent(view) {
    this.currentView = view;
    const mainContent = document.getElementById('opportunities-main-content');
    if (mainContent) {
      mainContent.innerHTML = this.getContentForView(view);
      this.attachEventListeners();
    }
  }

  /**
   * Attach event listeners to dynamic content
   */
  attachEventListeners() {
    // Apply buttons
    document.querySelectorAll('.apply-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleApply(e);
      });
    });

    // Save buttons
    document.querySelectorAll('.save-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleSaveJob(e);
      });
    });

    // Post job button
    const postButton = document.querySelector('.post-job-button');
    if (postButton) {
      postButton.addEventListener('click', () => {
        this.handlePostJob();
      });
    }

    // Login button (in auth required view)
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
      loginButton.addEventListener('click', () => {
        router.navigate('/login', { redirect: '/opportunities' });
      });
    }
  }

  /**
   * Handle job application
   */
  handleApply(e) {
    if (!authState.isAuth()) {
      router.navigate('/login', { redirect: '/opportunities' });
      return;
    }

    console.log('Applying to job...');
    // TODO: Implement job application
  }

  /**
   * Handle save job
   */
  handleSaveJob(e) {
    if (!authState.isAuth()) {
      router.navigate('/login', { redirect: '/opportunities' });
      return;
    }

    console.log('Saving job...');
    // TODO: Implement save job
  }

  /**
   * Handle post job
   */
  handlePostJob() {
    console.log('Posting job...');
    // TODO: Implement job posting
  }

  /**
   * Open filters
   */
  openFilters() {
    console.log('Opening filters...');
    // TODO: Implement filter modal
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    eventBus.on('navigation:subtab-clicked', ({ tab, subTab }) => {
      if (tab === 'opportunities') {
        this.updateContent(subTab);
      }
    });
  }

  /**
   * Called after page is mounted
   */
  async mounted() {
    console.log('Opportunities page mounted');
    navigationState.setActiveTab('opportunities');
    this.attachEventListeners();
  }

  /**
   * Clean up when page is destroyed
   */
  destroy() {
    eventBus.off('navigation:subtab-clicked');
  }
}

export default OpportunitiesPage;
