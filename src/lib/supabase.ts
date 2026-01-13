import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  // Don't throw - allow app to load but Supabase calls will fail
  console.warn('⚠️  App will load but Supabase features will not work');
}

// Create Supabase client with fallback for missing env vars
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          niche: string | null;
          audience_size: number | null;
          instagram_handle: string | null;
          tiktok_handle: string | null;
          onboarding_completed: boolean;
          subscription_tier: string;
          subscription_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          niche?: string | null;
          audience_size?: number | null;
          instagram_handle?: string | null;
          tiktok_handle?: string | null;
          onboarding_completed?: boolean;
          subscription_tier?: string;
          subscription_status?: string;
        };
        Update: {
          display_name?: string;
          niche?: string | null;
          audience_size?: number | null;
          instagram_handle?: string | null;
          tiktok_handle?: string | null;
          onboarding_completed?: boolean;
          subscription_tier?: string;
          subscription_status?: string;
        };
      };
      platform_connections: {
        Row: {
          id: string;
          user_id: string;
          platform: 'LTK' | 'AMAZON' | 'WALMART' | 'SHOPSTYLE';
          status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
          connected_at: string | null;
          last_synced_at: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
      };
      sales: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          sale_date: string;
          product_name: string;
          product_sku: string | null;
          brand: string;
          type: 'SALE_COMMISSION' | 'CLICK_COMMISSION' | 'BONUS';
          status: 'OPEN' | 'PENDING' | 'PAID' | 'REVERSED';
          commission_amount: number;
          order_value: number | null;
          click_id: string | null;
          order_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string;
          category: string | null;
          image_url: string | null;
          total_revenue: number;
          total_sales: number;
          total_clicks: number;
          conversion_rate: number;
          avg_commission: number;
          is_favorite: boolean;
          platform_links: any[];
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
