export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'member';
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  metadata_snapshot: {
    posterPath: string | null;
    releaseDate: string | null;
    overview: string | null;
    voteAverage: number | null;
    genres: string[];
    trailerKey?: string | null;
  } | null;
  suggested_by: string;
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface MovieComment {
  id: string;
  movie_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  state: 'draft' | 'live' | 'frozen';
  max_rank_n: number;
  created_at: string;
  updated_at: string;
  frozen_at: string | null;
}

export interface SurveyEntry {
  id: string;
  survey_id: string;
  movie_id: string;
  added_by: string;
  removed_at: string | null;
  created_at: string;
}

export interface Ballot {
  id: string;
  survey_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface BallotRank {
  id: string;
  ballot_id: string;
  rank: number;
  movie_id: string;
}

export interface BallotChangeLog {
  id: string;
  survey_id: string;
  user_id: string;
  previous_ranks: Array<{ rank: number; movieId: string }> | null;
  new_ranks: Array<{ rank: number; movieId: string }> | null;
  reason: 'user_update' | 'movie_removed' | 'system';
  created_at: string;
}

export interface Invite {
  id: string;
  code: string;
  created_by: string;
  expires_at: string;
  status: 'active' | 'expired';
  use_count: number;
  created_at: string;
}

export interface InviteUse {
  id: string;
  invite_id: string;
  user_id: string;
  used_at: string;
}

export interface AdminLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: 'user' | 'movie' | 'survey' | 'invite';
  target_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
}
