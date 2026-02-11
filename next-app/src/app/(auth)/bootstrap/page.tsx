import { createAdminClient } from '@/lib/supabase/admin';
import BootstrapForm from './BootstrapForm';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BootstrapPage() {
  const admin = createAdminClient();
  const { count } = await admin.from('profiles').select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    redirect('/login');
  }

  return <BootstrapForm />;
}
