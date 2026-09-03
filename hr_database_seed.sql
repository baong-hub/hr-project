-- Seed script for HR Portal

CREATE TABLE IF NOT EXISTS roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(100) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_roles FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permissions FOREIGN KEY (permission_id) REFERENCES permissions(code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed Roles
INSERT INTO roles (id, name) VALUES 
(1, 'CANDIDATE'),
(2, 'EMPLOYER'),
(3, 'ADMIN')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Permissions
INSERT INTO permissions (code, description) VALUES
('job:search', 'Tìm kiếm tin tuyển dụng'),
('job:apply', 'Ứng tuyển việc làm'),
('cv:manage', 'Quản lý CV cá nhân'),
('interview:view', 'Xem lịch hẹn phỏng vấn'),
('company:view', 'Xem trang doanh nghiệp'),
('job:save', 'Lưu tin tuyển dụng và theo dõi công ty'),
('notification:view', 'Xem thông báo cá nhân'),
('job:post', 'Đăng tuyển dụng mới'),
('job:manage', 'Quản lý tin tuyển dụng và ứng tuyển'),
('cv:search', 'Tìm kiếm hồ sơ ứng viên'),
('interview:schedule', 'Lên lịch hẹn phỏng vấn'),
('company:update', 'Cập nhật trang công ty'),
('employer:verify', 'Kiểm duyệt tài khoản doanh nghiệp'),
('job:moderate', 'Kiểm duyệt tin đăng tuyển'),
('user:manage', 'Quản lý người dùng toàn hệ thống'),
('report:view', 'Xem báo cáo thống kê tuyển dụng'),
('report:view_all', 'Xem báo cáo toàn sàn')
ON DUPLICATE KEY UPDATE description=VALUES(description);
