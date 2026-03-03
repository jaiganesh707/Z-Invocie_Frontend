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
    createdAt?: string;
}

export interface CreateInvoiceDto {
    userId: number;
    items: {
        foodItemId: number;
        quantity: number;
    }[];
}
