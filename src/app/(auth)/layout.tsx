export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      {children}
    </div>
  );
}