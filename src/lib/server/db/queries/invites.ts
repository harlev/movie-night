import { eq, and, gt } from 'drizzle-orm';
import type { Database } from '../index';
import { invites, type Invite } from '../schema';
import { generateId, generateInviteCode } from '$lib/utils';

export async function createInvite(
	db: Database,
	createdBy: string,
	expiresInDays: number = 7
): Promise<Invite> {
	const id = generateId();
	const code = generateInviteCode();
	const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

	const [invite] = await db
		.insert(invites)
		.values({
			id,
			code,
			createdBy,
			expiresAt: expiresAt.toISOString()
		})
		.returning();

	return invite;
}

export async function getInviteByCode(db: Database, code: string): Promise<Invite | undefined> {
	const [invite] = await db.select().from(invites).where(eq(invites.code, code.toUpperCase()));
	return invite;
}

export async function validateInviteCode(
	db: Database,
	code: string
): Promise<{ valid: boolean; error?: string; invite?: Invite }> {
	const invite = await getInviteByCode(db, code);

	if (!invite) {
		return { valid: false, error: 'Invalid invite code' };
	}

	if (invite.status === 'used') {
		return { valid: false, error: 'This invite code has already been used' };
	}

	if (invite.status === 'expired' || new Date(invite.expiresAt) < new Date()) {
		return { valid: false, error: 'This invite code has expired' };
	}

	return { valid: true, invite };
}

export async function markInviteUsed(
	db: Database,
	inviteId: string,
	usedBy: string
): Promise<void> {
	await db
		.update(invites)
		.set({
			status: 'used',
			usedBy,
			usedAt: new Date().toISOString()
		})
		.where(eq(invites.id, inviteId));
}

export async function getAllInvites(db: Database): Promise<Invite[]> {
	return db.select().from(invites);
}

export async function getInvitesByCreator(db: Database, createdBy: string): Promise<Invite[]> {
	return db.select().from(invites).where(eq(invites.createdBy, createdBy));
}

export async function expireInvite(db: Database, inviteId: string): Promise<void> {
	await db.update(invites).set({ status: 'expired' }).where(eq(invites.id, inviteId));
}
