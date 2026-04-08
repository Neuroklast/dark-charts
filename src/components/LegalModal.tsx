import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PrivacyPolicyView } from './PrivacyPolicyView';
import { TermsOfServiceView } from './TermsOfServiceView';
import { ImprintView } from './ImprintView';

type LegalType = 'privacy' | 'terms' | 'imprint';

interface LegalModalProps {
  type: LegalType | null;
  onClose: () => void;
}

const TITLES: Record<LegalType, string> = {
  privacy: 'Datenschutzerklärung',
  terms: 'AGB',
  imprint: 'Impressum',
};

export function LegalModal({ type, onClose }: LegalModalProps) {
  return (
    <Dialog open={type !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] overflow-y-auto bg-background border border-border p-0"
        aria-labelledby="legal-modal-title"
      >
        <DialogTitle id="legal-modal-title" className="sr-only">
          {type ? TITLES[type] : ''}
        </DialogTitle>
        <div className="px-6 pb-6">
          {type === 'privacy' && <PrivacyPolicyView />}
          {type === 'terms' && <TermsOfServiceView />}
          {type === 'imprint' && <ImprintView />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
