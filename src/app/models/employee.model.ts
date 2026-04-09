export interface Employee {
    id?: number;
    name: string;
    email: string;
    designation: string;
    department: string;
    salary: number;
    joinedDate: string;
    status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
    imageUrl?: string;
    userId?: number;
    loginUsername?: string;
    loginPassword?: string;
}
