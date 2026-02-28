import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProfileEditClient from './ProfileEditClient';

export const dynamic = 'force-dynamic';
export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-ink mb-6">Настройки профиля</h1>
      <ProfileEditClient profile={profile} />
    </div>
  );
}