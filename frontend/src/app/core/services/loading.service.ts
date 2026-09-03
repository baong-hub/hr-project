type Listener = (isLoading: boolean) => void;

let activeRequests = 0;
const listeners: Listener[] = [];

export const loadingService = {
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  },
  
  start: () => {
    activeRequests++;
    if (activeRequests === 1) {
      listeners.forEach(l => l(true));
    }
  },
  
  stop: () => {
    if (activeRequests > 0) {
      activeRequests--;
    }
    if (activeRequests === 0) {
      listeners.forEach(l => l(false));
    }
  }
};
