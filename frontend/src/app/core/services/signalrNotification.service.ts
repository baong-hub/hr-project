import * as signalR from '@microsoft/signalr';
import { authService } from './auth.service';
import { toast } from './toast.service';

class NotificationSignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentUserId: number = 0;

  public async startConnection(userId: number) {
    if (!userId || userId <= 0) return;
    if (this.connection && this.currentUserId === userId && this.connection.state === signalR.HubConnectionState.Connected) return;

    if (this.connection) {
      await this.stopConnection();
    }

    this.currentUserId = userId;
    const token = authService.getToken();

    const hubUrl = `/hubs/notifications`;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || ''
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('ReceiveNotification', (payload: any) => {
      console.log('SignalR ReceiveNotification:', payload);
      
      // Hiển thị Pop-up Toastr / Notification trên màn hình
      toast.info(`${payload.title || 'Nhắc nhở công việc'}: ${payload.content || 'Bạn có thông báo mới.'}`);

      // Bắn Custom Event để Header / List tự động cập nhật số lượng badge
      window.dispatchEvent(new CustomEvent('app-notification-received', { detail: payload }));
    });

    try {
      await this.connection.start();
      console.log(`SignalR connected to Notification Hub for user ${userId}`);
      await this.connection.invoke('JoinUserGroup', userId);
    } catch (err) {
      console.error('Error connecting Notification SignalR Hub:', err);
      setTimeout(() => this.startConnection(userId), 5000);
    }
  }

  public async stopConnection() {
    if (!this.connection) return;
    try {
      if (this.currentUserId > 0 && this.connection.state === signalR.HubConnectionState.Connected) {
        await this.connection.invoke('LeaveUserGroup', this.currentUserId);
      }
      await this.connection.stop();
    } catch (err) {
      console.error('Error stopping Notification SignalR:', err);
    } finally {
      this.connection = null;
      this.currentUserId = 0;
    }
  }
}

export const notificationSignalRService = new NotificationSignalRService();
