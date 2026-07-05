/**
 * Database types for the Voxinta Postgres schema.
 *
 * Shaped like `supabase gen types typescript` output so it can be regenerated
 * once the schema is applied to a project:
 *   supabase gen types typescript --local > types/database.ts
 * Until then this is maintained by hand alongside the migrations in
 * `supabase/migrations/`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      agents: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          prompt: string | null;
          personality: string | null;
          welcome_message: string | null;
          voice: string | null;
          temperature: number;
          language: string;
          max_tokens: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          prompt?: string | null;
          personality?: string | null;
          welcome_message?: string | null;
          voice?: string | null;
          temperature?: number;
          language?: string;
          max_tokens?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          description?: string | null;
          avatar_url?: string | null;
          prompt?: string | null;
          personality?: string | null;
          welcome_message?: string | null;
          voice?: string | null;
          temperature?: number;
          language?: string;
          max_tokens?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          owner_id: string;
          agent_id: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          agent_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          agent_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          agent_id: string | null;
          role: string;
          content: string;
          response_time_ms: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          agent_id?: string | null;
          role: string;
          content: string;
          response_time_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          agent_id?: string | null;
          role?: string;
          content?: string;
          response_time_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      knowledge_documents: {
        Row: {
          id: string;
          owner_id: string;
          agent_id: string | null;
          filename: string;
          type: string;
          status: string;
          size_bytes: number | null;
          storage_path: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          agent_id?: string | null;
          filename: string;
          type: string;
          status?: string;
          size_bytes?: number | null;
          storage_path?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          agent_id?: string | null;
          filename?: string;
          type?: string;
          status?: string;
          size_bytes?: number | null;
          storage_path?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "knowledge_documents_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          content: string;
          embedding?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          chunk_index?: number;
          content?: string;
          embedding?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "knowledge_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_configs: {
        Row: {
          id: string;
          owner_id: string;
          agent_id: string | null;
          tool_type: string;
          name: string;
          enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          agent_id?: string | null;
          tool_type: string;
          name: string;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          agent_id?: string | null;
          tool_type?: string;
          name?: string;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_configs_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tool_configs_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_events: {
        Row: {
          id: string;
          owner_id: string;
          agent_id: string | null;
          conversation_id: string | null;
          event_type: string;
          quantity: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          agent_id?: string | null;
          conversation_id?: string | null;
          event_type: string;
          quantity?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          agent_id?: string | null;
          conversation_id?: string | null;
          event_type?: string;
          quantity?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_events_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_agent_id_fkey";
            columns: ["agent_id"];
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_events_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      user_api_keys: {
        Row: {
          id: string;
          owner_id: string;
          provider: string;
          encrypted_key: string;
          key_preview: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          provider: string;
          encrypted_key: string;
          key_preview: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          provider?: string;
          encrypted_key?: string;
          key_preview?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_api_keys_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      match_document_chunks: {
        Args: {
          query_embedding: string;
          match_count?: number;
          filter_agent_id?: string;
        };
        Returns: {
          id: string;
          document_id: string;
          content: string;
          similarity: number;
        }[];
      };
      list_conversations_with_stats: {
        Args: {
          filter_agent_id?: string;
          filter_search?: string;
          filter_from?: string;
          filter_to?: string;
        };
        Returns: {
          id: string;
          title: string | null;
          agent_id: string | null;
          agent_name: string | null;
          created_at: string;
          updated_at: string;
          message_count: number;
          last_message_at: string | null;
          last_message_preview: string | null;
          avg_response_time_ms: number | null;
        }[];
      };
      dashboard_overview_stats: {
        Args: Record<string, never>;
        Returns: {
          total_conversations: number;
          total_messages: number;
          total_users: number;
          avg_response_time_ms: number | null;
        }[];
      };
      usage_over_time: {
        Args: {
          granularity?: string;
          periods?: number;
        };
        Returns: {
          period_start: string;
          conversation_count: number;
          message_count: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ---------------------------------------------------------------------------
// Convenience helpers.
// ---------------------------------------------------------------------------
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

// Row aliases for ergonomic imports across the app.
export type Profile = Tables<"profiles">;
export type Agent = Tables<"agents">;
export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;
export type KnowledgeDocument = Tables<"knowledge_documents">;
export type DocumentChunk = Tables<"document_chunks">;
export type ToolConfig = Tables<"tool_configs">;
export type UsageEvent = Tables<"usage_events">;
export type UserApiKey = Tables<"user_api_keys">;
