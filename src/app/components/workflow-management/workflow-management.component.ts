import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkflowUser } from '../../models/workflow-user.model';
import { WorkflowService } from '../../services/workflow.service';
import { ToastService } from '../../services/toast.service';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-workflow-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow-management.component.html',
  styleUrl: './workflow-management.component.css'
})
export class WorkflowManagementComponent implements OnInit {
  subUsers = signal<WorkflowUser[]>([]);
  isLoading = signal<boolean>(true);
  isFormVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  userForm = signal<WorkflowUser>(this.resetForm());
  currentUser: any = null;

  // Computed views for roles
  creators = computed(() => this.subUsers().filter(u => u.role === 'ROLE_WORKFLOW_USER'));
  approvers = computed(() => this.subUsers().filter(u => u.role === 'ROLE_APPROVER'));
  hrs = computed(() => this.subUsers().filter(u => u.role === 'ROLE_HR'));

  constructor(
    private workflowService: WorkflowService,
    private toastService: ToastService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.fetchSubUsers();
  }

  fetchSubUsers(): void {
    this.isLoading.set(true);
    console.log('#### WORKFLOW CENTER: Requesting Intelligence API V2 ####');
    this.workflowService.getSubUsers().subscribe({
      next: (data) => {
        console.log('#### WORKFLOW CENTER: Received Nodes ####', data);
        this.subUsers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('#### WORKFLOW CENTER: Fetch Error ####', err);
        this.toastService.error('Failed to synchronize workflow units');
        this.isLoading.set(false);
      }
    });
  }

  toggleForm(): void {
    this.isFormVisible.set(!this.isFormVisible());
    if (!this.isFormVisible()) {
      this.isEditing.set(false);
      this.userForm.set(this.resetForm());
    }
  }

  resetForm(): WorkflowUser {
    return {
      username: '',
      email: '',
      password: '',
      role: 'ROLE_WORKFLOW_USER',
      contactNumber: ''
    };
  }

  onEdit(user: WorkflowUser): void {
    this.userForm.set({ ...user, password: '' });
    this.isEditing.set(true);
    this.isFormVisible.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(id: number | undefined): void {
    if (!id) return;
    if (confirm('Strategic Termination: Decommission this unit node permanently?')) {
      this.workflowService.deleteSubUser(id).subscribe({
        next: () => {
          this.toastService.success('Unit node decommissioned successfully');
          this.fetchSubUsers();
        },
        error: () => this.toastService.error('Termination sequence failed')
      });
    }
  }

  onSubmit(): void {
    const formData = this.userForm();
    if (this.isEditing() && formData.id) {
      this.workflowService.updateSubUser(formData.id, formData).subscribe({
        next: () => {
          this.toastService.success('Unit parameters synchronized');
          this.toggleForm();
          this.fetchSubUsers();
        },
        error: () => this.toastService.error('Synchronization failed')
      });
    } else {
      this.workflowService.createSubUser(formData).subscribe({
        next: (response) => {
          console.log('#### WORKFLOW CENTER: Node Provisioned ####', response);
          this.toastService.success('New intelligence node provisioned');
          this.toggleForm();
          this.fetchSubUsers();
        },
        error: (err) => {
          console.error('#### WORKFLOW CENTER: Provision Error ####', err);
          this.toastService.error('Node provisioning failed');
        }
      });
    }
  }

  // Helpers for template compatibility
  getCount(role: string): number {
    return this.subUsers().filter(u => u.role === role).length;
  }
}
