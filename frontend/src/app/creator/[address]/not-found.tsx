import Link from 'next/link';
import { UserX } from 'lucide-react';

export default function CreatorNotFound() {
  return (
    <main className="max-w-lg mx-auto px-4 py-24 text-center space-y-4">
      <UserX className="h-10 w-10 text-muted-foreground mx-auto" />
      <h1 className="text-xl font-semibold">Creator not found</h1>
      <p className="text-sm text-muted-foreground">
        This address has not created any markets yet, or it does not exist.
      </p>
      <Link href="/markets" className="inline-block mt-2 text-sm text-primary underline-offset-4 hover:underline">
        Browse all markets
      </Link>
    </main>
  );
}
