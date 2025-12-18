/**
 * Education Records Page
 * User self-service page for managing education qualifications
 */

import { router } from '../router.js';
import { authState } from '../state/auth-state.js';
import { eventBus } from '../utils/events.js';
import '../components/organization-lookup-input.js';

class EducationRecordsPage {
  constructor(params = {}) {
    this.params = params;
    this.educationRecords = [];
  }

  async render() {
    const page = document.createElement('ion-page');
    page.className = 'education-records-page';

    page.innerHTML = `
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button id="back-btn">
              <ion-icon name="arrow-back" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
          <ion-title>Education Records</ion-title>
          <ion-buttons slot="end">
            <ion-button id="add-education-btn">
              <ion-icon name="add" slot="icon-only"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content class="ion-padding">
        <div class="education-records-container">
          <!-- Empty State -->
          <div id="empty-state" class="empty-state">
            <ion-icon name="school-outline" color="medium"></ion-icon>
            <h3>No Education Records</h3>
            <p>Add your educational qualifications to build your profile</p>
            <ion-button id="add-first-education-btn">
              <ion-icon name="add" slot="start"></ion-icon>
              Add Education
            </ion-button>
          </div>

          <!-- Education List -->
          <ion-list id="education-list" class="education-list hidden">
          </ion-list>
        </div>

        <!-- Add/Edit Modal -->
        <ion-modal id="education-modal">
          <ion-header>
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button id="modal-cancel-btn">Cancel</ion-button>
              </ion-buttons>
              <ion-title id="modal-title">Add Education</ion-title>
              <ion-buttons slot="end">
                <ion-button id="modal-save-btn" strong="true">Save</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <form id="education-form">
              <ion-list>
                <ion-item>
                  <ion-label position="stacked">Education Level *</ion-label>
                  <ion-select id="education-level" placeholder="Select level" interface="action-sheet">
                    <ion-select-option value="primary">Primary Education (1st-5th)</ion-select-option>
                    <ion-select-option value="middle">Middle School (6th-8th)</ion-select-option>
                    <ion-select-option value="secondary">Secondary (10th)</ion-select-option>
                    <ion-select-option value="higher_secondary">Higher Secondary (12th)</ion-select-option>
                    <ion-select-option value="diploma">Diploma</ion-select-option>
                    <ion-select-option value="graduate">Graduate (Bachelor's)</ion-select-option>
                    <ion-select-option value="post_graduate">Post Graduate (Master's)</ion-select-option>
                    <ion-select-option value="doctorate">Doctorate (PhD)</ion-select-option>
                    <ion-select-option value="professional">Professional Certification</ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Subject/Stream *</ion-label>
                  <ion-select id="education-subject" placeholder="Select subject" interface="action-sheet">
                    <ion-select-option value="general">General</ion-select-option>
                    <ion-select-option value="science">Science (PCM/PCB)</ion-select-option>
                    <ion-select-option value="commerce">Commerce</ion-select-option>
                    <ion-select-option value="arts">Arts/Humanities</ion-select-option>
                    <ion-select-option value="engineering">Engineering/Technology</ion-select-option>
                    <ion-select-option value="medicine">Medicine/Healthcare</ion-select-option>
                    <ion-select-option value="management">Management/MBA</ion-select-option>
                    <ion-select-option value="law">Law</ion-select-option>
                    <ion-select-option value="computer_applications">Computer Applications (BCA/MCA)</ion-select-option>
                    <ion-select-option value="education">Education (BEd/MEd)</ion-select-option>
                    <ion-select-option value="other">Other</ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Specialization</ion-label>
                  <ion-input id="education-specialization" placeholder="e.g., Computer Science"></ion-input>
                </ion-item>

                <ion-item lines="none">
                  <div class="form-field-full-width">
                    <ion-label>Institute Name *</ion-label>
                    <organization-lookup-input
                      name="instituteId"
                      placeholder="Enter institute name"
                      required
                    ></organization-lookup-input>
                  </div>
                </ion-item>

                <ion-item lines="none">
                  <div class="form-field-full-width">
                    <ion-label>Board/University</ion-label>
                    <organization-lookup-input
                      name="boardUniversityId"
                      placeholder="Enter board/university name"
                    ></organization-lookup-input>
                  </div>
                </ion-item>

                <ion-item-divider>
                  <ion-label>Duration</ion-label>
                </ion-item-divider>

                <ion-item>
                  <ion-label position="stacked">Start Year</ion-label>
                  <ion-input id="education-start-year" type="number" placeholder="e.g., 2018" min="1950" max="2030"></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">End Year</ion-label>
                  <ion-input id="education-end-year" type="number" placeholder="e.g., 2022" min="1950" max="2035"></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Status *</ion-label>
                  <ion-select id="education-status" placeholder="Select status" interface="action-sheet">
                    <ion-select-option value="completed">Completed</ion-select-option>
                    <ion-select-option value="in_progress">In Progress</ion-select-option>
                    <ion-select-option value="dropped">Dropped</ion-select-option>
                    <ion-select-option value="on_hold">On Hold</ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-item-divider>
                  <ion-label>Performance</ion-label>
                </ion-item-divider>

                <ion-item>
                  <ion-label position="stacked">Marks Type *</ion-label>
                  <ion-select id="education-marks-type" placeholder="Select type" interface="action-sheet">
                    <ion-select-option value="percentage">Percentage</ion-select-option>
                    <ion-select-option value="cgpa_10">CGPA (out of 10)</ion-select-option>
                    <ion-select-option value="cgpa_4">GPA (out of 4)</ion-select-option>
                    <ion-select-option value="grade">Grade</ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Marks/Score *</ion-label>
                  <ion-input id="education-marks" type="number" placeholder="e.g., 85" step="0.01"></ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Achievements (Optional)</ion-label>
                  <ion-textarea id="education-achievements" placeholder="Notable achievements, awards, etc." rows="3"></ion-textarea>
                </ion-item>
              </ion-list>
            </form>
          </ion-content>
        </ion-modal>
      </ion-content>
    `;

    return page;
  }

  async mounted() {
    console.log('Education Records page mounted');
    this.attachEventListeners();
    await this.loadEducationRecords();
  }

  attachEventListeners() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        router.navigate('/account/processes');
      });
    }

    // Add education buttons
    const addBtn = document.getElementById('add-education-btn');
    const addFirstBtn = document.getElementById('add-first-education-btn');

    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }
    if (addFirstBtn) {
      addFirstBtn.addEventListener('click', () => this.openModal());
    }

    // Modal buttons
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const saveBtn = document.getElementById('modal-save-btn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeModal());
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveEducation());
    }

    // Education list actions
    const educationList = document.getElementById('education-list');
    if (educationList) {
      educationList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-education-btn');
        const deleteBtn = e.target.closest('.delete-education-btn');

        if (editBtn) {
          const id = editBtn.dataset.id;
          this.editEducation(id);
        }
        if (deleteBtn) {
          const id = deleteBtn.dataset.id;
          this.confirmDelete(id);
        }
      });
    }
  }

  async loadEducationRecords() {
    // TODO: Load from PouchDB using userPersistence
    // For now, show empty state
    this.educationRecords = [];
    this.renderEducationList();
  }

  renderEducationList() {
    const emptyState = document.getElementById('empty-state');
    const educationList = document.getElementById('education-list');

    if (this.educationRecords.length === 0) {
      emptyState?.classList.remove('hidden');
      educationList?.classList.add('hidden');
    } else {
      emptyState?.classList.add('hidden');
      educationList?.classList.remove('hidden');

      educationList.innerHTML = this.educationRecords.map(record => this.renderEducationCard(record)).join('');
    }
  }

  renderEducationCard(record) {
    const levelLabels = {
      primary: 'Primary Education',
      middle: 'Middle School',
      secondary: 'Secondary (10th)',
      higher_secondary: 'Higher Secondary (12th)',
      diploma: 'Diploma',
      graduate: 'Graduate',
      post_graduate: 'Post Graduate',
      doctorate: 'Doctorate',
      professional: 'Professional'
    };

    const statusColors = {
      completed: 'success',
      in_progress: 'primary',
      dropped: 'danger',
      on_hold: 'warning'
    };

    const statusLabels = {
      completed: 'Completed',
      in_progress: 'In Progress',
      dropped: 'Dropped',
      on_hold: 'On Hold'
    };

    return `
      <ion-item-sliding>
        <ion-item class="education-card">
          <ion-icon name="school" slot="start" color="primary"></ion-icon>
          <ion-label>
            <h2>${levelLabels[record.educationLevel] || record.educationLevel}</h2>
            <h3>${record.subject || ''} ${record.specialization ? '- ' + record.specialization : ''}</h3>
            <p>${record.instituteName || ''}</p>
            <p>${record.startYear || ''} - ${record.endYear || 'Present'} | ${record.marksType === 'percentage' ? record.marks + '%' : record.marks}</p>
          </ion-label>
          <ion-badge slot="end" color="${statusColors[record.status] || 'medium'}">${statusLabels[record.status] || record.status}</ion-badge>
        </ion-item>
        <ion-item-options side="end">
          <ion-item-option color="primary" class="edit-education-btn" data-id="${record._id}">
            <ion-icon name="create" slot="icon-only"></ion-icon>
          </ion-item-option>
          <ion-item-option color="danger" class="delete-education-btn" data-id="${record._id}">
            <ion-icon name="trash" slot="icon-only"></ion-icon>
          </ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    `;
  }

  openModal(record = null) {
    const modal = document.getElementById('education-modal');
    const modalTitle = document.getElementById('modal-title');

    if (modalTitle) {
      modalTitle.textContent = record ? 'Edit Education' : 'Add Education';
    }

    // Clear form or populate with existing data
    this.clearForm();
    if (record) {
      this.populateForm(record);
    }

    modal?.present();
  }

  closeModal() {
    const modal = document.getElementById('education-modal');
    modal?.dismiss();
  }

  clearForm() {
    const form = document.getElementById('education-form');
    if (form) {
      form.reset();
      // Reset ion-select values
      ['education-level', 'education-subject', 'education-status', 'education-marks-type'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

      // Clear organization lookup components
      const instituteComponent = document.querySelector('organization-lookup-input[name="instituteId"]');
      const boardComponent = document.querySelector('organization-lookup-input[name="boardUniversityId"]');

      if (instituteComponent) instituteComponent.clearSelection();
      if (boardComponent) boardComponent.clearSelection();
    }
  }

  populateForm(record) {
    const fields = {
      'education-level': record.educationLevel,
      'education-subject': record.subject,
      'education-specialization': record.specialization,
      'education-start-year': record.startYear,
      'education-end-year': record.endYear,
      'education-status': record.status,
      'education-marks-type': record.marksType,
      'education-marks': record.marks,
      'education-achievements': record.achievements
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && value !== undefined) {
        el.value = value;
      }
    });

    // Populate organization lookup components
    if (record.instituteId) {
      const instituteComponent = document.querySelector('organization-lookup-input[name="instituteId"]');
      if (instituteComponent) {
        instituteComponent.value = record.instituteId;
      }
    }

    if (record.boardUniversityId) {
      const boardComponent = document.querySelector('organization-lookup-input[name="boardUniversityId"]');
      if (boardComponent) {
        boardComponent.value = record.boardUniversityId;
      }
    }
  }

  async saveEducation() {
    // Get organization IDs from lookup components
    const instituteComponent = document.querySelector('organization-lookup-input[name="instituteId"]');
    const boardComponent = document.querySelector('organization-lookup-input[name="boardUniversityId"]');

    const formData = {
      educationLevel: document.getElementById('education-level')?.value,
      subject: document.getElementById('education-subject')?.value,
      specialization: document.getElementById('education-specialization')?.value,
      // Organization references (IDs and denormalized names)
      instituteId: instituteComponent?.value || null,
      instituteName: instituteComponent?.getOrganization()?.fullName || null,
      boardUniversityId: boardComponent?.value || null,
      boardUniversity: boardComponent?.getOrganization()?.fullName || null,
      startYear: parseInt(document.getElementById('education-start-year')?.value) || null,
      endYear: parseInt(document.getElementById('education-end-year')?.value) || null,
      status: document.getElementById('education-status')?.value,
      marksType: document.getElementById('education-marks-type')?.value,
      marks: parseFloat(document.getElementById('education-marks')?.value) || null,
      achievements: document.getElementById('education-achievements')?.value
    };

    // Basic validation
    if (!formData.educationLevel || !formData.subject || !formData.instituteId || !formData.status || !formData.marksType || formData.marks === null) {
      alert('Please fill in all required fields');
      return;
    }

    // TODO: Save to PouchDB using userPersistence
    console.log('Saving education record:', formData);

    // For demo, add to local array
    formData._id = 'edu_' + Date.now();
    this.educationRecords.push(formData);
    this.renderEducationList();

    this.closeModal();
  }

  editEducation(id) {
    const record = this.educationRecords.find(r => r._id === id);
    if (record) {
      this.openModal(record);
    }
  }

  async confirmDelete(id) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Delete Education Record';
    alert.message = 'Are you sure you want to delete this education record?';
    alert.buttons = [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          this.deleteEducation(id);
        }
      }
    ];

    document.body.appendChild(alert);
    await alert.present();
  }

  deleteEducation(id) {
    this.educationRecords = this.educationRecords.filter(r => r._id !== id);
    this.renderEducationList();
    // TODO: Delete from PouchDB
  }

  destroy() {
    // Cleanup
  }
}

export default EducationRecordsPage;
