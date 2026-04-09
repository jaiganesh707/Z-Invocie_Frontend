export interface WorkflowUser {
    id?: number;
    username: string;
    email: string;
    password?: string;
    role: 'ROLE_APPROVER' | 'ROLE_WORKFLOW_USER' | 'ROLE_HR';
    contactNumber: string;
    parentUserId?: number;
    uniqueKey?: string;
}
