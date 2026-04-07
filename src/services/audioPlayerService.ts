class AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentIframe: HTMLIFrameElement | null = null;
  private listeners: Set<(isPlaying: boolean) => void> = new Set();
  private audioListeners: Map<HTMLAudioElement, { play: () => void, pause: () => void, ended: () => void }> = new Map();

  addListener(callback: (isPlaying: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(isPlaying: boolean) {
    this.listeners.forEach(listener => listener(isPlaying));
  }

  stopAll(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.cleanupAudioListeners(this.currentAudio);
      this.currentAudio = null;
    }

    if (this.currentIframe) {
      const src = this.currentIframe.src;
      this.currentIframe.src = '';
      this.currentIframe.src = src;
      this.currentIframe = null;
    }

    this.notifyListeners(false);
  }

  private cleanupAudioListeners(audio: HTMLAudioElement): void {
    const listeners = this.audioListeners.get(audio);
    if (listeners) {
      audio.removeEventListener('play', listeners.play);
      audio.removeEventListener('pause', listeners.pause);
      audio.removeEventListener('ended', listeners.ended);
      this.audioListeners.delete(audio);
    }
  }

  registerAudioElement(audio: HTMLAudioElement): void {
    if (this.audioListeners.has(audio)) {
      return;
    }

    const playHandler = () => {
      if (this.currentAudio && this.currentAudio !== audio) {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      }
      if (this.currentIframe) {
        const src = this.currentIframe.src;
        this.currentIframe.src = '';
        this.currentIframe.src = src;
        this.currentIframe = null;
      }
      this.currentAudio = audio;
      this.notifyListeners(true);
    };

    const pauseHandler = () => {
      if (this.currentAudio === audio) {
        this.notifyListeners(false);
      }
    };

    const endedHandler = () => {
      if (this.currentAudio === audio) {
        this.cleanupAudioListeners(audio);
        this.currentAudio = null;
        this.notifyListeners(false);
      }
    };

    this.audioListeners.set(audio, {
      play: playHandler,
      pause: pauseHandler,
      ended: endedHandler
    });

    audio.addEventListener('play', playHandler);
    audio.addEventListener('pause', pauseHandler);
    audio.addEventListener('ended', endedHandler);
  }

  registerIframe(iframe: HTMLIFrameElement): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    if (this.currentIframe && this.currentIframe !== iframe) {
      const src = this.currentIframe.src;
      this.currentIframe.src = '';
      this.currentIframe.src = src;
    }

    this.currentIframe = iframe;
    this.notifyListeners(true);
  }

  getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }

  isPlaying(): boolean {
    return !!(this.currentAudio && !this.currentAudio.paused) || !!this.currentIframe;
  }
}

export const audioPlayerService = new AudioPlayerService();
