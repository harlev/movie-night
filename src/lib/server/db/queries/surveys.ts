import { eq, and, isNull, ne, desc } from 'drizzle-orm';
import type { Database } from '../index';
import { surveys, surveyEntries, movies, type Survey, type SurveyEntry } from '../schema';
import { generateId } from '$lib/utils';

export async function createSurvey(
	db: Database,
	data: {
		title: string;
		description?: string;
		maxRankN?: number;
	}
): Promise<Survey> {
	const id = generateId();

	const [survey] = await db
		.insert(surveys)
		.values({
			id,
			title: data.title,
			description: data.description || null,
			maxRankN: data.maxRankN || 3
		})
		.returning();

	return survey;
}

export async function getSurveyById(db: Database, id: string): Promise<Survey | undefined> {
	const [survey] = await db.select().from(surveys).where(eq(surveys.id, id));
	return survey;
}

export async function getAllSurveys(db: Database): Promise<Survey[]> {
	return db.select().from(surveys).orderBy(desc(surveys.createdAt));
}

export async function getLiveSurvey(db: Database): Promise<Survey | undefined> {
	const [survey] = await db.select().from(surveys).where(eq(surveys.state, 'live')).limit(1);
	return survey;
}

export async function updateSurvey(
	db: Database,
	id: string,
	data: Partial<Pick<Survey, 'title' | 'description' | 'maxRankN'>>
): Promise<Survey | undefined> {
	const [survey] = await db
		.update(surveys)
		.set({ ...data, updatedAt: new Date().toISOString() })
		.where(eq(surveys.id, id))
		.returning();
	return survey;
}

export async function updateSurveyState(
	db: Database,
	id: string,
	state: 'draft' | 'live' | 'frozen'
): Promise<{ success: boolean; error?: string; survey?: Survey }> {
	// If going live, check no other survey is live
	if (state === 'live') {
		const existing = await getLiveSurvey(db);
		if (existing && existing.id !== id) {
			return { success: false, error: 'Another survey is already live' };
		}
	}

	const updates: Partial<Survey> = {
		state,
		updatedAt: new Date().toISOString()
	};

	if (state === 'frozen') {
		updates.frozenAt = new Date().toISOString();
	}

	const [survey] = await db.update(surveys).set(updates).where(eq(surveys.id, id)).returning();

	return { success: true, survey };
}

export async function deleteSurvey(db: Database, id: string): Promise<void> {
	// Only allow deleting draft surveys
	const survey = await getSurveyById(db, id);
	if (survey && survey.state !== 'draft') {
		throw new Error('Cannot delete non-draft survey');
	}
	await db.delete(surveys).where(eq(surveys.id, id));
}

// Survey Entries
export async function addSurveyEntry(
	db: Database,
	data: {
		surveyId: string;
		movieId: string;
		addedBy: string;
	}
): Promise<SurveyEntry> {
	const id = generateId();

	// Check if entry exists (even if removed)
	const [existing] = await db
		.select()
		.from(surveyEntries)
		.where(and(eq(surveyEntries.surveyId, data.surveyId), eq(surveyEntries.movieId, data.movieId)));

	if (existing) {
		if (existing.removedAt) {
			// Re-add by clearing removedAt
			const [updated] = await db
				.update(surveyEntries)
				.set({ removedAt: null, addedBy: data.addedBy })
				.where(eq(surveyEntries.id, existing.id))
				.returning();
			return updated;
		}
		throw new Error('Movie already in survey');
	}

	const [entry] = await db
		.insert(surveyEntries)
		.values({
			id,
			surveyId: data.surveyId,
			movieId: data.movieId,
			addedBy: data.addedBy
		})
		.returning();

	return entry;
}

export async function removeSurveyEntry(db: Database, entryId: string): Promise<void> {
	await db
		.update(surveyEntries)
		.set({ removedAt: new Date().toISOString() })
		.where(eq(surveyEntries.id, entryId));
}

export async function getSurveyEntries(
	db: Database,
	surveyId: string,
	options: { includeRemoved?: boolean } = {}
): Promise<
	Array<
		SurveyEntry & {
			movie: {
				id: string;
				title: string;
				tmdbId: number;
				metadataSnapshot: (typeof movies.$inferSelect)['metadataSnapshot'];
			};
		}
	>
> {
	const conditions = [eq(surveyEntries.surveyId, surveyId)];
	if (!options.includeRemoved) {
		conditions.push(isNull(surveyEntries.removedAt));
	}

	const result = await db
		.select({
			id: surveyEntries.id,
			surveyId: surveyEntries.surveyId,
			movieId: surveyEntries.movieId,
			addedBy: surveyEntries.addedBy,
			removedAt: surveyEntries.removedAt,
			createdAt: surveyEntries.createdAt,
			movie: {
				id: movies.id,
				title: movies.title,
				tmdbId: movies.tmdbId,
				metadataSnapshot: movies.metadataSnapshot
			}
		})
		.from(surveyEntries)
		.innerJoin(movies, eq(surveyEntries.movieId, movies.id))
		.where(and(...conditions))
		.orderBy(movies.title);

	return result;
}

export async function getSurveyEntryByMovieId(
	db: Database,
	surveyId: string,
	movieId: string
): Promise<SurveyEntry | undefined> {
	const [entry] = await db
		.select()
		.from(surveyEntries)
		.where(
			and(
				eq(surveyEntries.surveyId, surveyId),
				eq(surveyEntries.movieId, movieId),
				isNull(surveyEntries.removedAt)
			)
		);
	return entry;
}
