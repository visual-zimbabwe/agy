export type Database = {
  public: {
    Tables: {
      walls: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          camera_x: number;
          camera_y: number;
          camera_zoom: number;
          last_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title?: string;
          camera_x?: number;
          camera_y?: number;
          camera_zoom?: number;
          last_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          camera_x?: number;
          camera_y?: number;
          camera_zoom?: number;
          last_color?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          wall_id: string;
          owner_id: string;
          note_kind: string | null;
          text: string;
          quote_author: string | null;
          quote_source: string | null;
          canon: unknown;
          image_url: string | null;
          text_align: string | null;
          text_v_align: string | null;
          text_font: string | null;
          text_color: string | null;
          pinned: boolean;
          highlighted: boolean;
          vocabulary: unknown;
          tags: unknown;
          text_size: string | null;
          x: number;
          y: number;
          w: number;
          h: number;
          color: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          wall_id: string;
          owner_id: string;
          note_kind?: string | null;
          text: string;
          quote_author?: string | null;
          quote_source?: string | null;
          canon?: unknown;
          image_url?: string | null;
          text_align?: string | null;
          text_v_align?: string | null;
          text_font?: string | null;
          text_color?: string | null;
          pinned?: boolean;
          highlighted?: boolean;
          vocabulary?: unknown;
          tags?: unknown;
          text_size?: string | null;
          x: number;
          y: number;
          w: number;
          h: number;
          color: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Update: {
          note_kind?: string | null;
          text?: string;
          quote_author?: string | null;
          quote_source?: string | null;
          canon?: unknown;
          image_url?: string | null;
          text_align?: string | null;
          text_v_align?: string | null;
          text_font?: string | null;
          text_color?: string | null;
          pinned?: boolean;
          highlighted?: boolean;
          vocabulary?: unknown;
          tags?: unknown;
          text_size?: string | null;
          x?: number;
          y?: number;
          w?: number;
          h?: number;
          color?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      zones: {
        Row: {
          id: string;
          wall_id: string;
          owner_id: string;
          label: string;
          kind: string;
          group_id: string | null;
          x: number;
          y: number;
          w: number;
          h: number;
          color: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          wall_id: string;
          owner_id: string;
          label: string;
          kind?: string;
          group_id?: string | null;
          x: number;
          y: number;
          w: number;
          h: number;
          color: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Update: {
          label?: string;
          kind?: string;
          group_id?: string | null;
          x?: number;
          y?: number;
          w?: number;
          h?: number;
          color?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      zone_groups: {
        Row: {
          id: string;
          wall_id: string;
          owner_id: string;
          label: string;
          color: string;
          zone_ids: unknown;
          collapsed: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          wall_id: string;
          owner_id: string;
          label: string;
          color: string;
          zone_ids?: unknown;
          collapsed?: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Update: {
          label?: string;
          color?: string;
          zone_ids?: unknown;
          collapsed?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      note_groups: {
        Row: {
          id: string;
          wall_id: string;
          owner_id: string;
          label: string;
          color: string;
          note_ids: unknown;
          collapsed: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          wall_id: string;
          owner_id: string;
          label: string;
          color: string;
          note_ids?: unknown;
          collapsed?: boolean;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Update: {
          label?: string;
          color?: string;
          note_ids?: unknown;
          collapsed?: boolean;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          wall_id: string;
          owner_id: string;
          from_note_id: string;
          to_note_id: string;
          type: string;
          label: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          wall_id: string;
          owner_id: string;
          from_note_id: string;
          to_note_id: string;
          type: string;
          label: string;
          created_at: string;
          updated_at: string;
          deleted_at?: string | null;
        };
        Update: {
          from_note_id?: string;
          to_note_id?: string;
          type?: string;
          label?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          parent_id: string | null;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          parent_id?: string | null;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          parent_id?: string | null;
          archived?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      deck_note_types: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          builtin_key: string | null;
          fields: unknown;
          front_template: string;
          back_template: string;
          css: string;
          is_builtin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          builtin_key?: string | null;
          fields?: unknown;
          front_template?: string;
          back_template?: string;
          css?: string;
          is_builtin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          builtin_key?: string | null;
          fields?: unknown;
          front_template?: string;
          back_template?: string;
          css?: string;
          is_builtin?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      deck_notes: {
        Row: {
          id: string;
          owner_id: string;
          deck_id: string;
          note_type_id: string;
          sort_field: string;
          fields: unknown;
          tags: unknown;
          suspended: boolean;
          flagged: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          deck_id: string;
          note_type_id: string;
          sort_field?: string;
          fields?: unknown;
          tags?: unknown;
          suspended?: boolean;
          flagged?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          deck_id?: string;
          note_type_id?: string;
          sort_field?: string;
          fields?: unknown;
          tags?: unknown;
          suspended?: boolean;
          flagged?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      deck_cards: {
        Row: {
          id: string;
          owner_id: string;
          deck_id: string;
          note_id: string;
          card_ordinal: number;
          prompt: string;
          answer: string;
          state: string;
          step: number;
          interval_days: number;
          ease_factor: number;
          reps: number;
          lapses: number;
          due_at: string | null;
          last_reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          deck_id: string;
          note_id: string;
          card_ordinal?: number;
          prompt?: string;
          answer?: string;
          state?: string;
          step?: number;
          interval_days?: number;
          ease_factor?: number;
          reps?: number;
          lapses?: number;
          due_at?: string | null;
          last_reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          deck_id?: string;
          prompt?: string;
          answer?: string;
          state?: string;
          step?: number;
          interval_days?: number;
          ease_factor?: number;
          reps?: number;
          lapses?: number;
          due_at?: string | null;
          last_reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      deck_reviews: {
        Row: {
          id: string;
          owner_id: string;
          deck_id: string;
          card_id: string;
          rating: string;
          state_before: string;
          state_after: string;
          interval_days_after: number;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          deck_id: string;
          card_id: string;
          rating: string;
          state_before: string;
          state_after: string;
          interval_days_after?: number;
          reviewed_at?: string;
        };
        Update: {
          rating?: string;
          state_before?: string;
          state_after?: string;
          interval_days_after?: number;
          reviewed_at?: string;
        };
        Relationships: [];
      };
      deck_import_presets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          mapping: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          mapping?: unknown;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          mapping?: unknown;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
