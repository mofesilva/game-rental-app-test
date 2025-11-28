export interface GameRecord {
    _id: string;
    title: string;
    platform: string;
    daily_price: number;
    stock: number;
    cover_url?: string;
    tags?: string[];
    description?: string;
    created_at?: string;
    updated_at?: string;
}
