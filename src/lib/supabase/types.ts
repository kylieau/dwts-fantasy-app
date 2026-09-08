export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      couples: {
        Row: {
          celebrity_name: string
          celebrity_photo_url: string | null
          created_at: string
          elimination_week: number | null
          id: string
          pro_name: string
          pro_photo_url: string | null
          status: string
        }
        Insert: {
          celebrity_name: string
          celebrity_photo_url?: string | null
          created_at?: string
          elimination_week?: number | null
          id?: string
          pro_name: string
          pro_photo_url?: string | null
          status?: string
        }
        Update: {
          celebrity_name?: string
          celebrity_photo_url?: string | null
          created_at?: string
          elimination_week?: number | null
          id?: string
          pro_name?: string
          pro_photo_url?: string | null
          status?: string
        }
        Relationships: []
      }
      dance_scores: {
        Row: {
          couple_id: string
          created_at: string
          dance_name: string | null
          episode_id: string
          id: string
          judge_breakdown: Json | null
          total_score: number
        }
        Insert: {
          couple_id: string
          created_at?: string
          dance_name?: string | null
          episode_id: string
          id?: string
          judge_breakdown?: Json | null
          total_score: number
        }
        Update: {
          couple_id?: string
          created_at?: string
          dance_name?: string | null
          episode_id?: string
          id?: string
          judge_breakdown?: Json | null
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "dance_scores_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dance_scores_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      draft_picks: {
        Row: {
          couple_id: string
          id: string
          league_id: string
          manager_id: string
          pick_number: number
          picked_at: string
          round: number
        }
        Insert: {
          couple_id: string
          id?: string
          league_id: string
          manager_id: string
          pick_number: number
          picked_at?: string
          round: number
        }
        Update: {
          couple_id?: string
          id?: string
          league_id?: string
          manager_id?: string
          pick_number?: number
          picked_at?: string
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "draft_picks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draft_picks_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      episode_results: {
        Row: {
          couple_id: string
          episode_id: string
          id: string
          outcome: string
          saved_by_judges: boolean
          was_bottom_two: boolean
        }
        Insert: {
          couple_id: string
          episode_id: string
          id?: string
          outcome: string
          saved_by_judges?: boolean
          was_bottom_two?: boolean
        }
        Update: {
          couple_id?: string
          episode_id?: string
          id?: string
          outcome?: string
          saved_by_judges?: boolean
          was_bottom_two?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "episode_results_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_results_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          air_date: string
          id: string
          is_elimination_week: boolean
          is_finale: boolean
          locks_at: string
          status: string
          week_number: number
        }
        Insert: {
          air_date: string
          id?: string
          is_elimination_week?: boolean
          is_finale?: boolean
          locks_at: string
          status?: string
          week_number: number
        }
        Update: {
          air_date?: string
          id?: string
          is_elimination_week?: boolean
          is_finale?: boolean
          locks_at?: string
          status?: string
          week_number?: number
        }
        Relationships: []
      }
      league_members: {
        Row: {
          draft_position: number | null
          id: string
          joined_at: string
          league_id: string
          role: string
          user_id: string
        }
        Insert: {
          draft_position?: number | null
          id?: string
          joined_at?: string
          league_id: string
          role?: string
          user_id: string
        }
        Update: {
          draft_position?: number | null
          id?: string
          joined_at?: string
          league_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          commissioner_id: string
          created_at: string
          draft_scheduled_at: string | null
          draft_status: string
          id: string
          invite_code: string
          name: string
          pick_time_limit_seconds: number
          roster_size: number
          waiver_claim_method: string | null
          waiver_mode: string
        }
        Insert: {
          commissioner_id: string
          created_at?: string
          draft_scheduled_at?: string | null
          draft_status?: string
          id?: string
          invite_code: string
          name: string
          pick_time_limit_seconds?: number
          roster_size?: number
          waiver_claim_method?: string | null
          waiver_mode?: string
        }
        Update: {
          commissioner_id?: string
          created_at?: string
          draft_scheduled_at?: string | null
          draft_status?: string
          id?: string
          invite_code?: string
          name?: string
          pick_time_limit_seconds?: number
          roster_size?: number
          waiver_claim_method?: string | null
          waiver_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "leagues_commissioner_id_fkey"
            columns: ["commissioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          episode_id: string
          id: string
          league_id: string
          manager_id: string
          predicted_eliminated_couple_id: string | null
          predicted_top_scorer_couple_id: string | null
          submitted_at: string
        }
        Insert: {
          episode_id: string
          id?: string
          league_id: string
          manager_id: string
          predicted_eliminated_couple_id?: string | null
          predicted_top_scorer_couple_id?: string | null
          submitted_at?: string
        }
        Update: {
          episode_id?: string
          id?: string
          league_id?: string
          manager_id?: string
          predicted_eliminated_couple_id?: string | null
          predicted_top_scorer_couple_id?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_predicted_eliminated_couple_id_fkey"
            columns: ["predicted_eliminated_couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_predicted_top_scorer_couple_id_fkey"
            columns: ["predicted_top_scorer_couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          is_super_admin: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          is_super_admin?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_super_admin?: boolean
        }
        Relationships: []
      }
      roster_slots: {
        Row: {
          couple_id: string | null
          end_week: number | null
          id: string
          league_id: string
          manager_id: string
          slot_number: number
          source: string
          start_week: number
        }
        Insert: {
          couple_id?: string | null
          end_week?: number | null
          id?: string
          league_id: string
          manager_id: string
          slot_number: number
          source: string
          start_week: number
        }
        Update: {
          couple_id?: string | null
          end_week?: number | null
          id?: string
          league_id?: string
          manager_id?: string
          slot_number?: number
          source?: string
          start_week?: number
        }
        Relationships: [
          {
            foreignKeyName: "roster_slots_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_slots_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_slots_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_settings: {
        Row: {
          elimination_prediction_points: number
          first_place_points: number
          judges_score_multiplier: number
          league_id: string
          second_place_points: number
          survival_points: number
          third_place_points: number
          top_scorer_prediction_points: number
        }
        Insert: {
          elimination_prediction_points?: number
          first_place_points?: number
          judges_score_multiplier?: number
          league_id: string
          second_place_points?: number
          survival_points?: number
          third_place_points?: number
          top_scorer_prediction_points?: number
        }
        Update: {
          elimination_prediction_points?: number
          first_place_points?: number
          judges_score_multiplier?: number
          league_id?: string
          second_place_points?: number
          survival_points?: number
          third_place_points?: number
          top_scorer_prediction_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "scoring_settings_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: true
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      waiver_claims: {
        Row: {
          couple_id: string
          created_at: string
          id: string
          league_id: string
          manager_id: string
          priority_order: number | null
          resolved_at: string | null
          slot_number: number
          status: string
          week_number: number
        }
        Insert: {
          couple_id: string
          created_at?: string
          id?: string
          league_id: string
          manager_id: string
          priority_order?: number | null
          resolved_at?: string | null
          slot_number: number
          status?: string
          week_number: number
        }
        Update: {
          couple_id?: string
          created_at?: string
          id?: string
          league_id?: string
          manager_id?: string
          priority_order?: number | null
          resolved_at?: string | null
          slot_number?: number
          status?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "waiver_claims_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_claims_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiver_claims_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_manager_scores: {
        Row: {
          computed_at: string
          episode_id: string
          id: string
          league_id: string
          manager_id: string
          prediction_points: number
          roster_points: number
          total_points: number
        }
        Insert: {
          computed_at?: string
          episode_id: string
          id?: string
          league_id: string
          manager_id: string
          prediction_points?: number
          roster_points?: number
          total_points?: number
        }
        Update: {
          computed_at?: string
          episode_id?: string
          id?: string
          league_id?: string
          manager_id?: string
          prediction_points?: number
          roster_points?: number
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_manager_scores_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_manager_scores_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_manager_scores_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_league: {
        Args: { p_name: string }
        Returns: {
          commissioner_id: string
          created_at: string
          draft_scheduled_at: string | null
          draft_status: string
          id: string
          invite_code: string
          name: string
          pick_time_limit_seconds: number
          roster_size: number
          waiver_claim_method: string | null
          waiver_mode: string
        }
        SetofOptions: {
          from: "*"
          to: "leagues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_league_member: { Args: { p_league_id: string }; Returns: boolean }
      join_league: {
        Args: { p_invite_code: string }
        Returns: {
          commissioner_id: string
          created_at: string
          draft_scheduled_at: string | null
          draft_status: string
          id: string
          invite_code: string
          name: string
          pick_time_limit_seconds: number
          roster_size: number
          waiver_claim_method: string | null
          waiver_mode: string
        }
        SetofOptions: {
          from: "*"
          to: "leagues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      make_draft_pick: {
        Args: { p_couple_id: string; p_league_id: string }
        Returns: {
          couple_id: string
          id: string
          league_id: string
          manager_id: string
          pick_number: number
          picked_at: string
          round: number
        }
        SetofOptions: {
          from: "*"
          to: "draft_picks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_draft_order: {
        Args: { p_league_id: string; p_ordered_user_ids: string[] }
        Returns: undefined
      }
      start_draft: {
        Args: { p_league_id: string }
        Returns: {
          commissioner_id: string
          created_at: string
          draft_scheduled_at: string | null
          draft_status: string
          id: string
          invite_code: string
          name: string
          pick_time_limit_seconds: number
          roster_size: number
          waiver_claim_method: string | null
          waiver_mode: string
        }
        SetofOptions: {
          from: "*"
          to: "leagues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_prediction: {
        Args: {
          p_episode_id: string
          p_league_id: string
          p_predicted_eliminated_couple_id: string
          p_predicted_top_scorer_couple_id: string
        }
        Returns: {
          episode_id: string
          id: string
          league_id: string
          manager_id: string
          predicted_eliminated_couple_id: string | null
          predicted_top_scorer_couple_id: string | null
          submitted_at: string
        }
        SetofOptions: {
          from: "*"
          to: "predictions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_league_settings: {
        Args: {
          p_league_id: string
          p_pick_time_limit_seconds: number
          p_waiver_claim_method: string
          p_waiver_mode: string
        }
        Returns: {
          commissioner_id: string
          created_at: string
          draft_scheduled_at: string | null
          draft_status: string
          id: string
          invite_code: string
          name: string
          pick_time_limit_seconds: number
          roster_size: number
          waiver_claim_method: string | null
          waiver_mode: string
        }
        SetofOptions: {
          from: "*"
          to: "leagues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_scoring_settings: {
        Args: {
          p_elimination_prediction_points: number
          p_first_place_points: number
          p_judges_score_multiplier: number
          p_league_id: string
          p_second_place_points: number
          p_survival_points: number
          p_third_place_points: number
          p_top_scorer_prediction_points: number
        }
        Returns: {
          elimination_prediction_points: number
          first_place_points: number
          judges_score_multiplier: number
          league_id: string
          second_place_points: number
          survival_points: number
          third_place_points: number
          top_scorer_prediction_points: number
        }
        SetofOptions: {
          from: "*"
          to: "scoring_settings"
          isOneToOne: true
          isSetofReturn: false
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
