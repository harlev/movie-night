import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable(
	'users',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		displayName: text('display_name').notNull(),
		role: text('role', { enum: ['admin', 'member'] })
			.notNull()
			.default('member'),
		status: text('status', { enum: ['active', 'disabled'] })
			.notNull()
			.default('active'),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(table) => [index('users_email_idx').on(table.email)]
);

// Invites table
export const invites = sqliteTable('invites', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	createdBy: text('created_by')
		.notNull()
		.references(() => users.id),
	expiresAt: text('expires_at').notNull(),
	status: text('status', { enum: ['active', 'expired'] })
		.notNull()
		.default('active'),
	useCount: integer('use_count').notNull().default(0),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Invite uses table - tracks which users signed up with which invite
export const inviteUses = sqliteTable('invite_uses', {
	id: text('id').primaryKey(),
	inviteId: text('invite_id')
		.notNull()
		.references(() => invites.id),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	usedAt: text('used_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Password reset tokens
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull(),
	expiresAt: text('expires_at').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Movies table
export const movies = sqliteTable(
	'movies',
	{
		id: text('id').primaryKey(),
		tmdbId: integer('tmdb_id').notNull().unique(),
		title: text('title').notNull(),
		metadataSnapshot: text('metadata_snapshot', { mode: 'json' }).$type<{
			posterPath: string | null;
			releaseDate: string | null;
			overview: string | null;
			voteAverage: number | null;
			genres: string[];
			trailerKey?: string | null;
		}>(),
		suggestedBy: text('suggested_by')
			.notNull()
			.references(() => users.id),
		hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(table) => [uniqueIndex('movies_tmdb_id_idx').on(table.tmdbId)]
);

// Movie comments
export const movieComments = sqliteTable('movie_comments', {
	id: text('id').primaryKey(),
	movieId: text('movie_id')
		.notNull()
		.references(() => movies.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	content: text('content').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Surveys table
export const surveys = sqliteTable(
	'surveys',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description'),
		state: text('state', { enum: ['draft', 'live', 'frozen'] })
			.notNull()
			.default('draft'),
		maxRankN: integer('max_rank_n').notNull().default(3),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		frozenAt: text('frozen_at')
	},
	(table) => [index('surveys_state_idx').on(table.state)]
);

// Survey entries (movies in a survey)
export const surveyEntries = sqliteTable(
	'survey_entries',
	{
		id: text('id').primaryKey(),
		surveyId: text('survey_id')
			.notNull()
			.references(() => surveys.id, { onDelete: 'cascade' }),
		movieId: text('movie_id')
			.notNull()
			.references(() => movies.id),
		addedBy: text('added_by')
			.notNull()
			.references(() => users.id),
		removedAt: text('removed_at'),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(table) => [uniqueIndex('survey_entries_survey_movie_idx').on(table.surveyId, table.movieId)]
);

// Ballots table
export const ballots = sqliteTable(
	'ballots',
	{
		id: text('id').primaryKey(),
		surveyId: text('survey_id')
			.notNull()
			.references(() => surveys.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => users.id),
		createdAt: text('created_at')
			.notNull()
			.default(sql`(datetime('now'))`),
		updatedAt: text('updated_at')
			.notNull()
			.default(sql`(datetime('now'))`)
	},
	(table) => [uniqueIndex('ballots_survey_user_idx').on(table.surveyId, table.userId)]
);

// Ballot ranks
export const ballotRanks = sqliteTable('ballot_ranks', {
	id: text('id').primaryKey(),
	ballotId: text('ballot_id')
		.notNull()
		.references(() => ballots.id, { onDelete: 'cascade' }),
	rank: integer('rank').notNull(),
	movieId: text('movie_id')
		.notNull()
		.references(() => movies.id)
});

// Ballot change logs
export const ballotChangeLogs = sqliteTable('ballot_change_logs', {
	id: text('id').primaryKey(),
	surveyId: text('survey_id')
		.notNull()
		.references(() => surveys.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	previousRanks: text('previous_ranks', { mode: 'json' }).$type<
		Array<{ rank: number; movieId: string }>
	>(),
	newRanks: text('new_ranks', { mode: 'json' }).$type<Array<{ rank: number; movieId: string }>>(),
	reason: text('reason', { enum: ['user_update', 'movie_removed', 'system'] }).notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Admin logs
export const adminLogs = sqliteTable('admin_logs', {
	id: text('id').primaryKey(),
	actorId: text('actor_id')
		.notNull()
		.references(() => users.id),
	action: text('action').notNull(),
	targetType: text('target_type', { enum: ['user', 'movie', 'survey', 'invite'] }).notNull(),
	targetId: text('target_id').notNull(),
	details: text('details', { mode: 'json' }).$type<Record<string, unknown>>(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Sessions table
export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	refreshTokenHash: text('refresh_token_hash').notNull(),
	expiresAt: text('expires_at').notNull(),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

// Type exports for use in application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Invite = typeof invites.$inferSelect;
export type NewInvite = typeof invites.$inferInsert;
export type InviteUse = typeof inviteUses.$inferSelect;
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type MovieComment = typeof movieComments.$inferSelect;
export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;
export type SurveyEntry = typeof surveyEntries.$inferSelect;
export type Ballot = typeof ballots.$inferSelect;
export type BallotRank = typeof ballotRanks.$inferSelect;
export type BallotChangeLog = typeof ballotChangeLogs.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;
export type Session = typeof sessions.$inferSelect;
