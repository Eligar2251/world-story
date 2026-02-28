import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';
export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-ink mb-6">Уведомления</h1>
      <NotificationsClient notifications={notifications ?? []} />
    </div>
  );
}