// Loading State Manager for AI Responses
// Provides user feedback during response generation

export interface LoadingState {
  isLoading: boolean;
  stage: 'analyzing' | 'generating' | 'adapting' | 'complete';
  message: string;
  progress: number; // 0-100
}

export class LoadingManager {
  private loadingStates: Map<string, LoadingState> = new Map();
  private callbacks: Map<string, (state: LoadingState) => void> = new Map();

  // Start loading for a user
  startLoading(userId: string, callback?: (state: LoadingState) => void): void {
    if (callback) {
      this.callbacks.set(userId, callback);
    }

    this.updateLoadingState(userId, {
      isLoading: true,
      stage: 'analyzing',
      message: 'Understanding your message...',
      progress: 10
    });
  }

  // Update loading stage
  updateStage(userId: string, stage: LoadingState['stage']): void {
    const messages = {
      analyzing: 'Understanding your message...',
      generating: 'Crafting a thoughtful response...',
      adapting: 'Personalizing for you...',
      complete: 'Ready!'
    };

    const progress = {
      analyzing: 25,
      generating: 60,
      adapting: 85,
      complete: 100
    };

    this.updateLoadingState(userId, {
      isLoading: stage !== 'complete',
      stage,
      message: messages[stage],
      progress: progress[stage]
    });
  }

  // Complete loading
  completeLoading(userId: string): void {
    this.updateStage(userId, 'complete');
    
    // Clean up after a short delay
    setTimeout(() => {
      this.loadingStates.delete(userId);
      this.callbacks.delete(userId);
    }, 1000);
  }

  // Get current loading state
  getLoadingState(userId: string): LoadingState | null {
    return this.loadingStates.get(userId) || null;
  }

  // Private method to update state and notify callback
  private updateLoadingState(userId: string, state: LoadingState): void {
    this.loadingStates.set(userId, state);
    
    const callback = this.callbacks.get(userId);
    if (callback) {
      callback(state);
    }
  }
}

// Export singleton instance
export const loadingManager = new LoadingManager();