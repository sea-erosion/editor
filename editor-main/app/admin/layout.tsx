export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin pages get their own full-screen layout, not the site header/footer
  return <>{children}</>;
}
