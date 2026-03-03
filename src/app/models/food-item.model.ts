export interface FoodItem {
    id?: number;
    name: string;
    price: number;
    description: string;
    user?: {
        id: number;
        username: string;
        email: string;
    };
    currency?: string;
    createdAt?: string;
    updatedAt?: string;
    imageUrl?: string;
}
