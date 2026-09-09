import * as signalR from '@microsoft/signalr';
import { authService } from './auth.service';

class ChatSignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentConversationId: number | null = null;
  private onMessageCallback: ((message: any) => void) | null = null;

  public async startConnection() {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) return;

    const token = authService.getToken();
    const hubUrl = `/hubs/chat`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveMessage', (payload: any) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(payload);
      }
      window.dispatchEvent(new CustomEvent('app-chat-message-received', { detail: payload }));
    });

    try {
      await this.connection.start();
      console.log('SignalR successfully connected to Chat Hub.');
      if (this.currentConversationId) {
        await this.joinConversation(this.currentConversationId);
      }
    } catch (err) {
      console.error('Error starting Chat SignalR connection:', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  public async joinConversation(conversationId: number) {
    this.currentConversationId = conversationId;
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('JoinConversation', conversationId);
      } catch (err) {
        console.error(`Error joining conversation ${conversationId}:`, err);
      }
    }
  }

  public async leaveConversation(conversationId: number) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('LeaveConversation', conversationId);
      } catch (err) {
        console.error(`Error leaving conversation ${conversationId}:`, err);
      }
    }
    if (this.currentConversationId === conversationId) {
      this.currentConversationId = null;
    }
  }

  public registerMessageCallback(callback: (message: any) => void) {
    this.onMessageCallback = callback;
  }

  public async stopConnection() {
    if (!this.connection) return;
    try {
      await this.connection.stop();
      console.log('Chat SignalR connection stopped.');
    } catch (err) {
      console.error('Error stopping Chat SignalR:', err);
    } finally {
      this.connection = null;
      this.currentConversationId = null;
    }
  }
}

export const chatSignalRService = new ChatSignalRService();
export const signalRService = chatSignalRService; // alias for backward compatibility
