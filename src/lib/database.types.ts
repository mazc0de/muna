
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "items": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"purchases": {
                  Row: {
                    "created_at": string,"id": string,"is_promo": boolean,"item_id": string,"qty": number,"trip_id": string,"unit_price": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_promo"?: boolean,"item_id": string,"qty": number,"trip_id": string,"unit_price": number,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_promo"?: boolean,"item_id"?: string,"qty"?: number,"trip_id"?: string,"unit_price"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "purchases_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "item_overview"
      referencedColumns: ["item_id","user_id"]
    },{
      foreignKeyName: "purchases_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "purchases_trip_id_user_id_fkey"
      columns: ["trip_id","user_id"]
isOneToOne: false
      referencedRelation: "trip_overview"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "purchases_trip_id_user_id_fkey"
      columns: ["trip_id","user_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"stores": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"trips": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"store_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"date"?: string,"id"?: string,"store_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"date"?: string,"id"?: string,"store_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "trips_store_id_user_id_fkey"
      columns: ["store_id","user_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Views: {
            "item_overview": {
                  Row: {
                    "best_date": string | null,"best_is_promo": boolean | null,"best_is_stale": boolean | null,"best_price": number | null,"best_store_ids": (string)[] | null,"best_store_names": (string)[] | null,"created_at": string,"has_comparison": boolean | null,"item_id": string,"last_purchased_at": string | null,"last_trip_created_at": string | null,"name": string,"store_count": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"item_store_summary": {
                  Row: {
                    "diff_from_cheapest": number | null,"is_cheapest": boolean | null,"is_stale": boolean | null,"item_id": string,"item_name": string,"last_promo_date": string | null,"last_promo_price": number | null,"last_purchased_at": string | null,"purchase_count": number | null,"reference_date": string | null,"reference_price": number | null,"store_id": string,"store_name": string,"stores_with_reference": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "purchases_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "item_overview"
      referencedColumns: ["item_id","user_id"]
    },{
      foreignKeyName: "purchases_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"purchase_details": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"is_promo": boolean,"item_id": string,"item_name": string,"qty": number,"store_id": string,"store_name": string,"trip_created_at": string,"trip_id": string,"unit_price": number,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "purchases_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "item_overview"
      referencedColumns: ["item_id","user_id"]
    },{
      foreignKeyName: "purchases_item_id_user_id_fkey"
      columns: ["item_id","user_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "purchases_trip_id_user_id_fkey"
      columns: ["trip_id","user_id"]
isOneToOne: false
      referencedRelation: "trip_overview"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "purchases_trip_id_user_id_fkey"
      columns: ["trip_id","user_id"]
isOneToOne: false
      referencedRelation: "trips"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"trip_overview": {
                  Row: {
                    "created_at": string,"date": string,"id": string,"item_count": number | null,"store_id": string,"store_name": string,"total": number | null,"user_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "trips_store_id_user_id_fkey"
      columns: ["store_id","user_id"]
isOneToOne: false
      referencedRelation: "stores"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Functions: {
            "save_trip":
{ Args: { "p_date": string,"p_purchases": Json,"p_store_id": string,"p_store_name": string,"p_trip_id": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
