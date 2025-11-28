export type RentalStatus = "active" | "overdue" | "returned";

export interface RentalRecord {
    _id: string;
    game_id: string;
    game_title?: string;
    client_id: string;
    client_name?: string;
    start_date: string;
    end_date: string;
    returned_at?: string;
    status: RentalStatus;
    daily_price: number;
    total_days: number;
    total_amount: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}
