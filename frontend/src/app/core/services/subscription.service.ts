import api from './api.service';

export interface PlanDto {
  plan: string;
  name: string;
  priceVnd: number;
  maxActiveJobs: number;
  cvSearchAccess: boolean;
  aiScoringEnabled: boolean;
  prioritySupport: boolean;
  features: string[];
}

export interface SubscriptionDto {
  id: number;
  companyId: number;
  plan: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxActiveJobs: number;
  featuresJson?: string;
  features: string[];
}

export interface CheckoutResultDto {
  checkoutUrl: string;
  orderCode: string;
  paymentMethod: string;
  amount: number;
  plan: string;
  qrCodeUrl?: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
}

export const subscriptionService = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  getCurrentSubscription: async () => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  createCheckout: async (data: { plan: string; paymentMethod: string; returnUrl?: string; cancelUrl?: string }) => {
    const response = await api.post('/subscriptions/checkout', data);
    return response.data;
  }
};
