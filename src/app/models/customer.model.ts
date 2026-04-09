export interface Customer {
    id?: number;
    companyName: string;
    customerName: string;
    contactNumber: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    gstin?: string;
    email: string;
    customerType: string;
    outstandingBalance?: number;
    pendingHistory?: { [date: string]: number };
}
