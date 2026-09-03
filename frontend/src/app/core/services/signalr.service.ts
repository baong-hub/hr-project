import * as signalR from '@microsoft/signalr';
import { authService } from './auth.service';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private onCallEventCallback: ((event: any) => void) | null = null;
  private onAgentStatusCallback: ((status: any) => void) | null = null;
  private currentExtension: string = '';

  public async startConnection(extension: string) {
    if (this.connection && this.currentExtension === extension) return;
    
    if (this.connection) {
      await this.stopConnection();
    }

    this.currentExtension = extension;
    const token = authService.getToken();
    
    // Sử dụng proxy /hubs của Vite
    const hubUrl = `/hubs/callcenter?extension=${extension}`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveCallEvent', (payload: any) => {
      console.log('SignalR ReceiveCallEvent:', payload);
      if (this.onCallEventCallback) {
        this.onCallEventCallback(payload);
      }
      window.dispatchEvent(new CustomEvent('call-log-updated', { detail: payload }));
    });

    this.connection.on('AgentStatusUpdated', (payload: any) => {
      console.log('SignalR AgentStatusUpdated:', payload);
      if (this.onAgentStatusCallback) {
        this.onAgentStatusCallback(payload);
      }
    });

    try {
      await this.connection.start();
      console.log(`SignalR successfully connected to CallCenter Hub for extension: ${extension}`);
    } catch (err) {
      console.error('Error starting SignalR connection:', err);
      // Thử kết nối lại sau 5 giây
      setTimeout(() => this.startConnection(extension), 5000);
    }
  }

  public registerCallbacks(onCallEvent: (event: any) => void, onAgentStatus: (status: any) => void) {
    this.onCallEventCallback = onCallEvent;
    this.onAgentStatusCallback = onAgentStatus;
  }

  public async stopConnection() {
    if (!this.connection) return;
    try {
      await this.connection.stop();
      console.log('SignalR connection stopped.');
    } catch (err) {
      console.error('Error stopping SignalR connection:', err);
    } finally {
      this.connection = null;
      this.currentExtension = '';
    }
  }
}

export const signalRService = new SignalRService();
