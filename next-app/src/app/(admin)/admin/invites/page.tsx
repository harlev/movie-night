import { Metadata } from 'next';
import Link from 'next/link';
import { getAllInvites, getInviteUsers } from '@/lib/queries/invites';
import { getUserById } from '@/lib/queries/profiles';
import InviteActions from './InviteActions';

export const metadata: Metadata = {
  title: 'Manage Invites - Admin',
};

export default async function AdminInvitesPage() {
  const allInvites = await getAllInvites();

  const invitesWithDetails = await Promise.all(
    allInvites.map(async (invite) => {
      const creator = await getUserById(invite.created_by);
      const users = await getInviteUsers(invite.id);

      return {
        ...invite,
        creatorName: creator?.display_name || 'Unknown',
        users,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Invites</h1>
          <p className="text-[var(--color-text-muted)] mt-1">{invitesWithDetails.length} total invites</p>
        </div>
        <Link
          href="/admin/invites/new"
          className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium rounded-lg transition-colors"
        >
          Generate Invite
        </Link>
      </div>

      <InviteActions invites={invitesWithDetails} />
    </div>
  );
}
