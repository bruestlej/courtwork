export type UserRole = "trainer" | "client";
export type SubscriptionStatus = "free" | "active" | "canceled" | "past_due";
export type AssignmentStatus = "assigned" | "in_progress" | "completed";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Clip {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  storage_path: string;
  duration_seconds: number | null;
  thumbnail_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  clip_id: string;
  position: number;
  notes: string | null;
  clip?: Clip;
}

export interface Assignment {
  id: string;
  playlist_id: string;
  client_id: string;
  trainer_id: string;
  title: string;
  message: string | null;
  due_date: string | null;
  status: AssignmentStatus;
  created_at: string;
  updated_at: string;
  playlist?: Playlist;
  client?: Profile;
}

export interface AssignmentProgress {
  id: string;
  assignment_id: string;
  clip_id: string;
  completed_at: string | null;
}

export interface TrainerClient {
  id: string;
  trainer_id: string;
  client_id: string;
  created_at: string;
  client?: Profile;
}
