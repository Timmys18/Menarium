export enum ItemType {
  THING = 'THING',
  SERVICE = 'SERVICE',
}

export enum ThingCategory {
  ELECTRONICS = 'ELECTRONICS',
  CLOTHING = 'CLOTHING',
  FURNITURE = 'FURNITURE',
  TOOLS = 'TOOLS',
  KIDS = 'KIDS',
  BOOKS = 'BOOKS',
  SPORTS = 'SPORTS',
  AUTO = 'AUTO',
  PETS = 'PETS',
}

export enum ServiceCategory {
  EDUCATION = 'EDUCATION',
  HOUSEHOLD = 'HOUSEHOLD',
  BEAUTY = 'BEAUTY',
  REPAIR = 'REPAIR',
  DOCUMENTS = 'DOCUMENTS',
  CREATIVE = 'CREATIVE',
  IT = 'IT',
  AUTO = 'AUTO',
}

export type Category = ThingCategory | ServiceCategory;

export enum SwapRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum ExchangeChainStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export interface Item {
  id: string;
  title: string;
  type: ItemType;
  category: Category;
  description: string;
  images: string[];
  city: string;
  isOnline?: boolean;
  userId: string;
  desiredCategories: Category[];
  acceptsAnything: boolean;
  additionalItems?: {
    itemId: string;
    comment?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SwapRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderItemId: string;
  receiverItemId: string;
  status: SwapRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  swapRequestId: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

export interface ExchangeChain {
  id: string;
  itemIds: string[];
  userIds: string[];
  status: ExchangeChainStatus;
  confirmedBy: string[];
  createdAt: Date;
  updatedAt: Date;
} 