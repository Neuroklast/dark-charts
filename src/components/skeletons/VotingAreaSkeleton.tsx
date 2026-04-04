export function VotingAreaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="cyber-card p-6 border border-border">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-secondary/50 animate-pulse" />
            <div className="h-10 w-32 bg-secondary/50 animate-pulse" />
          </div>
          
          <div className="h-12 w-full bg-secondary/50 animate-pulse" />
          
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="h-7 w-24 bg-secondary/50 animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <VotingTrackCardSkeleton key={i} delay={i * 50} />
        ))}
      </div>
    </div>
  );
}

export function VotingTrackCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div 
      className="cyber-card p-4 border border-border space-y-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-secondary/60 animate-pulse flex-shrink-0" />
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-full bg-secondary/60 animate-pulse" />
          <div className="h-4 w-3/4 bg-secondary/50 animate-pulse" />
          
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div 
                key={i} 
                className="h-4 w-16 bg-secondary/40 animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-secondary/50 animate-pulse" />
          <div className="h-6 w-16 bg-secondary/50 animate-pulse" />
          <div className="h-8 w-8 bg-secondary/50 animate-pulse" />
        </div>
        
        <div className="h-5 w-24 bg-secondary/50 animate-pulse" />
      </div>
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[0, 1, 2].map((i) => (
        <div 
          key={i} 
          className="cyber-card p-6 border border-border"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-secondary/60 animate-pulse" />
              <div className="h-4 w-32 bg-secondary/60 animate-pulse" />
            </div>
            <div className="h-10 w-20 bg-secondary/70 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileActivitySkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-48 bg-secondary/60 animate-pulse mb-4" />
      
      {[0, 1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className="cyber-card p-4 border border-border"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary/60 animate-pulse flex-shrink-0" />
            
            <div className="flex-1 space-y-2">
              <div className="h-5 w-full bg-secondary/60 animate-pulse" />
              <div className="h-4 w-2/3 bg-secondary/50 animate-pulse" />
              <div className="h-3 w-1/3 bg-secondary/40 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
