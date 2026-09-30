import React, { useState } from 'react';
import { Modal } from '../../../shared/components/modal/Modal';
import type { ApplicationDto } from '../../../core/models/application.model';
import { interviewsService } from '../../../core/services/interviews.service';
import { toast } from '../../../core/services/toast.service';
import styles from '../pages/EmployerAppManagePage.module.scss';

interface ScheduleInterviewModalProps {
  app: ApplicationDto;
  onClose: () => void;
  onSuccess: (appId: number, newStatus: string) => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  app,
  onClose,
  onSuccess
}) => {
  const [interviewForm, setInterviewForm] = useState({
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: 'Online',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Phỏng vấn vòng 1 về kiến thức chuyên môn và kinh nghiệm thực chiến.'
  });

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await interviewsService.createInterview({
        applicationId: app.id,
        scheduledAt: new Date(interviewForm.scheduledAt).toISOString(),
        location: interviewForm.location,
        meetingLink: interviewForm.location === 'Online' ? interviewForm.meetingLink : undefined,
        notes: interviewForm.notes
      });

      // Tự động chuyển trạng thái đơn sang INTERVIEW nếu thành công
      onSuccess(app.id, 'INTERVIEW');
      toast.success(`Đã lên lịch phỏng vấn và gửi thông báo cho ứng viên ${app.candidateName}!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu lịch phỏng vấn.');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Lên lịch phỏng vấn: ${app.candidateName}`}
      size="md"
      footer={
        <>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>Hủy</button>
          <button type="submit" form="schedule-interview-form" className={styles.btnPrimary}>Gửi lịch mời</button>
        </>
      }
    >
      <form id="schedule-interview-form" onSubmit={handleScheduleInterview}>
        <div className={styles.formGroup}>
          <label>Vị trí ứng tuyển</label>
          <input type="text" disabled value={app.jobTitle} />
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Hình thức phỏng vấn</label>
            <select
              value={interviewForm.location}
              onChange={e => setInterviewForm({...interviewForm, location: e.target.value})}
            >
              <option value="Online">Phỏng vấn Online</option>
              <option value="Tại văn phòng">Phỏng vấn Trực tiếp (Tại văn phòng)</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Thời gian phỏng vấn</label>
            <input
              type="datetime-local"
              required
              value={interviewForm.scheduledAt}
              onChange={e => setInterviewForm({...interviewForm, scheduledAt: e.target.value})}
            />
          </div>
        </div>
        {interviewForm.location === 'Online' && (
          <div className={styles.formGroup}>
            <label>Đường dẫn phòng họp trực tuyến (Google Meet/Zoom)</label>
            <input
              type="url"
              required
              value={interviewForm.meetingLink}
              onChange={e => setInterviewForm({...interviewForm, meetingLink: e.target.value})}
            />
          </div>
        )}
        <div className={styles.formGroup}>
          <label>Ghi chú gửi ứng viên & HR</label>
          <textarea
            rows={3}
            value={interviewForm.notes}
            onChange={e => setInterviewForm({...interviewForm, notes: e.target.value})}
          ></textarea>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleInterviewModal;
