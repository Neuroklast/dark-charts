import { UserProfile, FanProfile, BandProfile, DJProfile } from '@/types';
import { FanProfileDrawer } from './FanProfileDrawer';
import { ArtistProfileDrawer } from './ArtistProfileDrawer';
import { DJProfileDrawer } from './DJProfileDrawer';

interface ProfileDrawerManagerProps {
  profile: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawerManager({ profile, isOpen, onClose }: ProfileDrawerManagerProps) {
  if (!profile) return null;

  switch (profile.userType) {
    case 'fan':
      return (
        <FanProfileDrawer
          profile={profile as FanProfile}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    case 'band':
      return (
        <ArtistProfileDrawer
          profile={profile as BandProfile}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    case 'dj':
      return (
        <DJProfileDrawer
          profile={profile as DJProfile}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    case 'label':
      return (
        <ArtistProfileDrawer
          profile={profile as unknown as BandProfile}
          isOpen={isOpen}
          onClose={onClose}
        />
      );
    default:
      return null;
  }
}
