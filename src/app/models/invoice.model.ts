import { FoodItem } from "./food-item.model";

export interface InvoiceItem {
    id?: number;
    foodItem: FoodItem;
    quantity: number;
    price: number;
}

export interface Invoice {
    id?: number;
    user: any;
    totalAmount: number;
    items: InvoiceItem[];
    status?: string;
    rejectionReason?: string;
    createdBy?: any;
    creatorEmployeeId?: number;
    creatorName?: string;
    approvedBy?: any;
    customer?: any;
    invoiceNumber?: string;
    assignedDriver?: any;
    deliveryStatus?: string;
    outstandingAmount?: number;
    paidAmount?: number;
    previousBalance?: number;
    balanceAmount?: number;
    deliveryRequired?: boolean;
    amountCollectedByDriver?: number;
    createdAt?: string;
    updatedAt?: string;
    billingAddress?: string;
    customerGstin?: string;
}

export interface CreateInvoiceDto {
    userId: number;
    creatorId?: number;
    customerId?: number;
    status?: string;
    outstandingAmount?: number;
    deliveryRequired?: boolean;
    preferredDriverId?: number;
    billingAddress?: string;
    customerGstin?: string;

    items: {
        foodItemId: number;
        quantity: number;
    }[];
}
