import { Metadata } from 'next';
import { getAllUsers } from '@/lib/queries/profiles';
import UserActions from './UserActions';

export const metadata: Metadata = {
  title: 'Manage Users - Admin',
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Users</h1>
        <p className="text-[var(--color-text-muted)] mt-1">{users.length} total users</p>
      </div>

      <UserActions users={users} />
    </div>
  );
}
