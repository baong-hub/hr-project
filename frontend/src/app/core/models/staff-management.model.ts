export interface PositionDto {
  id: number;
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CreatePositionRequest {
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface UpdatePositionRequest {
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface StaffPositionDto {
  id: number;
  staffId: number;
  staffName: string;
  positionId: number;
  positionName: string;
  startDate: string;
  endDate?: string;
}

export interface StaffListItem {
  id: number;
  userId?: number;
  staffCode: string;
  fullName: string;
  phone: string;
  departmentName: string;
  positions: string[];
  isActive: boolean;
}

export interface AssignStaffPositionsRequest {
  staffId: number;
  positions: {
    positionId: number;
    startDate: string;
    endDate?: string;
  }[];
}

export interface CustomerStaffDto {
  id: number;
  customerId: number;
  staffId: number;
  staffName: string;
  staffPhone?: string;
  moduleName: string;
  positionNames?: string[];
}

export interface AssignCustomerStaffRequest {
  customerId: number;
  staffIds: number[];
  moduleName: string;
  entityId?: number;
}

export interface CrmLeadUserDto {
  id: number;
  userId: number;
  staffId?: number;
  fullName?: string;
  staffName?: string;
  staffPhone?: string;
  positionNames?: string[];
}

export interface AssignCrmLeadUserRequest {
  leadId: number;
  userIds?: number[];
  staffIds?: number[];
  moduleName?: string;
  removeOldCareStaff?: boolean;
}
