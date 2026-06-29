import { AdminPageShell } from '../_components/AdminPageShell';
import { ThemeEditorContainer } from '@/components/admin/ThemeEditorContainer';

export const dynamic = 'force-dynamic';

export default function AdminColorsPage() {
  return (
    <AdminPageShell
      title="Colors"
      description="Customize theme colors and visual branding."
    >
      <ThemeEditorContainer />
    </AdminPageShell>
  );
}