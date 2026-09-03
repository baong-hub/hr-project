import * as signalR from '@microsoft/signalr';
import { authService } from './auth.service';

class PresenceSignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentUserId: number = 0;

  public async startConnection(userId: number) {
    if (this.connection && this.currentUserId === userId) return;
    
    if (this.connection) {
      await this.stopConnection();
    }

    this.currentUserId = userId;
    const token = authService.getToken();
    
    const hubUrl = `/hubs/userpresence`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || '',
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    try {
      await this.connection.start();
      console.log(`SignalR successfully connected to UserPresence Hub for user: ${userId}`);
      
      // Register presence on backend
      await this.connection.invoke('RegisterPresence', userId);
    } catch (err) {
      console.error('Error starting UserPresence SignalR connection:', err);
      // Retry in 5s
      setTimeout(() => this.startConnection(userId), 5000);
    }
  }

  public async stopConnection() {
    if (!this.connection) return;
    try {
      await this.connection.stop();
      console.log('UserPresence SignalR connection stopped.');
    } catch (err) {
      console.error('Error stopping UserPresence SignalR connection:', err);
    } finally {
      this.connection = null;
      this.currentUserId = 0;
    }
  }
}

export const presenceSignalRService = new PresenceSignalRService();
