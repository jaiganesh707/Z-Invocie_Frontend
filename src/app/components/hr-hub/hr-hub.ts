import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { StorageService } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { ActivatedRoute } from '@angular/router';
import { Employee } from '../../models/employee.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-hr-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hr-hub.html',
  styleUrls: ['./hr-hub.component.css']
})
export class HRHubComponent implements OnInit {
  userId = signal<number>(0);
  userRole = signal<string>('');
  isAdding = signal<boolean>(false);
  isChefMode = signal<boolean>(false);
  employees = signal<Employee[]>([]);
  
  departmentOptions = [
    { value: 'MARKETING-LEAD', label: 'MARKETING-LEAD (MANAGER HEAD)', isHead: true },
    { value: 'SUPERVISOR-LEAD', label: 'SUPERVISOR-LEAD (MANAGER HEAD)', isHead: true },
    { value: 'OPERATIONS-LEAD', label: 'OPERATIONS-LEAD (MANAGER HEAD)', isHead: true },
    { value: 'CLEANING', label: 'CLEANING STAFF (OFFLINE STAFF)', isHead: false },
    { value: 'MARKETING', label: 'MARKETING STAFF (OFFLINE STAFF)', isHead: false },
    { value: 'MAINTENANCE', label: 'MAINTENANCE STAFF (OFFLINE STAFF)', isHead: false }
  ];

  filteredDepartments = computed(() => {
    if (this.isChefMode()) {
      return this.departmentOptions.filter(d => d.isHead);
    }
    return this.departmentOptions;
  });

  // Analytical Nodes
  headTitle = computed(() => {
    if (this.isChefMode()) return 'CHEF EMPLOYEES CORE';
    const role = this.userRole();
    if (role === 'ROLE_DRIVER_LEAD') return 'DRIVER HEAD OPS';
    if (role === 'ROLE_MARKETING_LEAD') return 'MARKETING HEAD INTEL';
    if (role === 'ROLE_SUPERVISOR_LEAD') return 'SUPERVISOR HEAD CONTROL';
    return 'HR INTELLIGENCE HUB';
  });
  
  totalHeadcount = computed(() => this.employees().length);
  totalActiveNodes = computed(() => this.employees().filter(e => e.status === 'ACTIVE').length);
  monthlyOverhead = computed(() => this.employees().reduce((acc, e) => acc + (e.salary || 0), 0));
  
  newEmployee: Employee = {
    name: '',
    email: '',
    designation: '',
    department: '',
    salary: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    loginUsername: '',
    loginPassword: ''
  };

  isEditing = false;
  editingId: number | null = null;
  selectedFile: File | null = null;

  private employeeService = inject(EmployeeService);
  private storageService = inject(StorageService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.isChefMode.set(this.route.snapshot.data['filterHeads'] === true);
    const user = this.storageService.getUser();
    if (user && user.id) {
      this.userId.set(user.id);
      this.userRole.set(user.role);
      this.fetchEmployees();
    }
  }

  fetchEmployees() {
    this.employeeService.getAll(this.userId()).subscribe({
      next: (data) => {
        if (this.isChefMode()) {
          this.employees.set(data.filter(e => e.department && e.department.toUpperCase().endsWith('-LEAD')));
        } else {
          this.employees.set(data);
        }
      },
      error: () => this.toastService.show('Failed to fetch personnel nodes', 'error')
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] as File;
  }

  saveEmployee() {
    if (!this.newEmployee.name || !this.newEmployee.email) {
      this.toastService.show('Name and email are required identifiers', 'warning');
      return;
    }

    const handleImageUpload = (id: number) => {
      if (this.selectedFile) {
        this.employeeService.uploadImage(id, this.selectedFile, this.userId()).subscribe({
          next: () => {
            this.toastService.show('Personnel image synchronized', 'success');
            this.resetForm();
            this.fetchEmployees();
          },
          error: () => {
            this.toastService.show('Image synchronization failed', 'error');
            this.resetForm();
            this.fetchEmployees();
          }
        });
      } else {
        this.resetForm();
        this.fetchEmployees();
      }
    };

    if (this.isEditing && this.editingId) {
      this.employeeService.update(this.editingId, this.newEmployee, this.userId()).subscribe({
        next: () => {
          this.toastService.show('Personnel node updated successfully', 'success');
          handleImageUpload(this.editingId!);
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Update synchronization failure', 'error');
        }
      });
    } else {
      this.employeeService.create(this.newEmployee, this.userId()).subscribe({
        next: (created) => {
          this.toastService.show('New personnel node provisioned', 'success');
          if (created.id) {
            handleImageUpload(created.id);
          } else {
            this.resetForm();
            this.fetchEmployees();
          }
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Personnel provisioning aborted', 'error');
        }
      });
    }
  }

  editEmployee(employee: Employee) {
    this.newEmployee = { ...employee };
    this.isEditing = true;
    this.editingId = employee.id!;
    this.isAdding.set(true);
  }

  deleteEmployee(id: number) {
    if (confirm('Permanently terminate this personnel node from the registry?')) {
      this.employeeService.delete(id, this.userId()).subscribe({
        next: () => {
          this.toastService.show('Personnel node terminated', 'success');
          this.fetchEmployees();
        }
      });
    }
  }

  resetForm() {
    this.newEmployee = {
      name: '',
      email: '',
      designation: '',
      department: '',
      salary: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      loginUsername: '',
      loginPassword: ''
    };
    this.isEditing = false;
    this.editingId = null;
    this.isAdding.set(false);
    this.selectedFile = null;
  }

  getImageUrl(url: string | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }
}
