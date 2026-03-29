import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EditItemForm from '@/components/ui/EditItemForm';

export default async function EditItemPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return redirect('/auth/login');

  const item = await prisma.item.findUnique({
    where: { id: params.id },
  });

  if (!item || item.userId !== session.user.id) return notFound();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <EditItemForm initialData={item} />
    </div>
  );
}
