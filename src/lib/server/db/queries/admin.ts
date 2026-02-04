import { eq, desc } from 'drizzle-orm';
import type { Database } from '../index';
import { adminLogs, users, type AdminLog } from '../schema';
import { generateId } from '$lib/utils';

export async function createAdminLog(
	db: Database,
	data: {
		actorId: string;
		action: string;
		targetType: 'user' | 'movie' | 'survey' | 'invite';
		targetId: string;
		details?: Record<string, unknown>;
	}
): Promise<AdminLog> {
	const id = generateId();

	const [log] = await db
		.insert(adminLogs)
		.values({
			id,
			actorId: data.actorId,
			action: data.action,
			targetType: data.targetType,
			targetId: data.targetId,
			details: data.details || null
		})
		.returning();

	return log;
}

export async function getAdminLogs(
	db: Database,
	options: { limit?: number; targetType?: string; targetId?: string } = {}
): Promise<Array<AdminLog & { actorName: string }>> {
	let query = db
		.select({
			id: adminLogs.id,
			actorId: adminLogs.actorId,
			action: adminLogs.action,
			targetType: adminLogs.targetType,
			targetId: adminLogs.targetId,
			details: adminLogs.details,
			createdAt: adminLogs.createdAt,
			actorName: users.displayName
		})
		.from(adminLogs)
		.leftJoin(users, eq(adminLogs.actorId, users.id))
		.orderBy(desc(adminLogs.createdAt))
		.$dynamic();

	if (options.limit) {
		query = query.limit(options.limit);
	}

	const result = await query;
	return result.map((r) => ({
		...r,
		actorName: r.actorName || 'Unknown'
	}));
}
