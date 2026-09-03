export interface MasterPipelineStage {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PipelineStage {
  id: number;
  pipelineId: number;
  masterStageId: number;
  masterStageCode: string;
  name: string;
  colorCode?: string;
  textColor?: string;
  bgColor?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  stages: PipelineStage[];
}

export interface LeadListItem {
  id: number;
  leadCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  gender: number;
  genderLabel: string;
  birthDate?: string;
  leadValue: number;
  pipelineName: string;
  pipelineStageName: string;
  pipelineStageColor?: string;
  careStaffName?: string;
  sourceName?: string;
  referralSourceName?: string;
  lastContactedAt?: string;
  totalOrders: number;
  totalRevenue: number;
  totalInteractions: number;
  customerId?: number;
  customerCode?: string;
  convertedAt?: string;
  createdAt: string;
  addressDetail?: string;
  provinceName?: string;
  districtName?: string;
  logoUrl?: string;
  duplicateCreatedAt?: string;
  duplicateCreatedMonth?: number;
}

export interface LeadDetail {
  id: number;
  leadCode: string;
  fullName: string;
  phone?: string;
  email?: string;
  gender: number;
  genderLabel: string;
  birthDate?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  fax?: string;
  taxCode?: string;
  leadValue: number;
  isForeignerInVn: boolean;
  socialQrLinks?: string;
  facebook?: string;
  countryId?: number;
  countryName?: string;
  provinceId?: number;
  provinceName?: string;
  districtId?: number;
  districtName?: string;
  addressDetail?: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonPosition?: string;
  contactPersonBirthDate?: string;
  pipelineId: number;
  pipelineName: string;
  pipelineStageId: number;
  pipelineStageName: string;
  pipelineStageColor?: string;
  careStaffId?: number;
  careStaffName?: string;
  sourceId?: number;
  sourceName?: string;
  referralSourceId?: number;
  referralSourceName?: string;
  occupationId?: number;
  occupationName?: string;
  campaignId?: number;
  adName?: string;
  affiliateCode?: string;
  duplicateCreatedAt?: string;
  duplicateCreatedMonth?: number;
  lastContactedAt?: string;
  totalOrders: number;
  totalRevenue: number;
  customerId?: number;
  customerCode?: string;
  convertedAt?: string;
  convertedBy?: number;
  convertedByName?: string;
  isActive: boolean;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
  updatedAt: string;
  contacts: LeadContact[];
  customerGroupId?: number;
  customerGroupName?: string;
}

export interface LeadContact {
  id?: number;
  leadId?: number;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  isMain: boolean;
}

export interface InteractionLogEditHistory {
  id: number;
  interactionLogId: number;
  oldTitle: string;
  oldContent?: string;
  newTitle: string;
  newContent?: string;
  editedByUserId: number;
  editedByUserName: string;
  editedAt: string;
}

export interface InteractionLog {
  id: number;
  leadId?: number;
  customerId?: number;
  type: number;
  typeLabel: string;
  title: string;
  content?: string;
  callId?: string;
  callStatus?: string;
  durationSeconds?: number;
  audioUrl?: string;
  direction?: number;
  createdByUserId: number;
  createdByUserName: string;
  createdAt: string;
  isStarred?: boolean;
  isPinned?: boolean;
  isEdited?: boolean;
  lastEditedAt?: string;
  updatedByUserId?: number;
  updatedByUserName?: string;
  editHistories?: InteractionLogEditHistory[];
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedByUserId?: number;
  deletedByUserName?: string;
}

export interface FormConfig {
  id: number;
  name: string;
  campaignId?: number;
  pipelineId: number;
  pipelineName: string;
  pipelineStageId: number;
  pipelineStageName: string;
  formConfigJson: string;
  successRedirectUrl?: string;
  embedCode?: string;
  isActive: boolean;
  createdAt: string;
}

export interface IncomingCallMatchResult {
  found: boolean;
  type: 'Lead' | 'Customer' | 'Both' | 'None';
  lead?: LeadListItem;
  customer?: any; // Customers.CustomerListItemDto
}
