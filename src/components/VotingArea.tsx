import { useAuth } from '@/contexts/AuthContext';
import { FanVotingArea } from './FanVotingArea';
import { ExpertVotingArea } from './ExpertVotingArea';
import { Track } from '@/types';

interface VotingAreaProps {
  allTracks: Track[];
  onTrackClick: (track: Track) => void;
  onVoteComplete?: () => void;
}

export function VotingArea(props: VotingAreaProps) {
  const { user } = useAuth();

  if (user?.profile?.userType === 'dj') {
    return <ExpertVotingArea {...props} />;
  }

  return <FanVotingArea {...props} />;
}
