import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      ltk_posts: {
        Row: {
          id: string;
          user_id: string;
          creator_handle: string;
          creator_profile_url: string;
          post_url: string;
          original_caption: string;
          category: string | null;
          scraped_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          creator_handle: string;
          creator_profile_url: string;
          post_url: string;
          original_caption: string;
          category?: string | null;
        };
        Update: {
          creator_handle?: string;
          creator_profile_url?: string;
          post_url?: string;
          original_caption?: string;
          category?: string | null;
        };
      };
      ltk_products: {
        Row: {
          id: string;
          post_id: string;
          title: string;
          merchant: string;
          product_url: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          post_id: string;
          title: string;
          merchant: string;
          product_url: string;
          image_url?: string | null;
        };
        Update: {
          title?: string;
          merchant?: string;
          product_url?: string;
          image_url?: string | null;
        };
      };
      generated_captions: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          caption: string;
          caption_type: 'short' | 'long' | 'alt_text';
          prompt_type: string;
          tone: string;
          hashtags: string[];
          word_count: number;
          char_count: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          caption: string;
          caption_type: 'short' | 'long' | 'alt_text';
          prompt_type: string;
          tone: string;
          hashtags?: string[];
          word_count: number;
          char_count: number;
        };
        Update: {
          caption?: string;
          caption_type?: 'short' | 'long' | 'alt_text';
          prompt_type?: string;
          tone?: string;
          hashtags?: string[];
        };
      };
    };
  };
};
