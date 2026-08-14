import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Link to="/" className="text-primary underline">
        Back to dashboard
      </Link>
    </div>
  );
}
