export const NotificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  send: (title, body, icon = '/assets/leaf.png') => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        timestamp: Date.now()
      });
    } else {
      // Fallback to console/custom toast if needed
      console.info(`[Notification Simulation] ${title}: ${body}`);
    }
  }
};
