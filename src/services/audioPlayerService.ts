class AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentIframe: HTMLIFrameElement | null = null;
  private listeners: Set<(isPlaying: boolean) => void> = new Set();

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

  registerAudioElement(audio: HTMLAudioElement): void {
    audio.addEventListener('play', () => {
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
    });

    audio.addEventListener('pause', () => {
      if (this.currentAudio === audio) {
        this.notifyListeners(false);
      }
    });

    audio.addEventListener('ended', () => {
      if (this.currentAudio === audio) {
        this.currentAudio = null;
        this.notifyListeners(false);
      }
    });
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
