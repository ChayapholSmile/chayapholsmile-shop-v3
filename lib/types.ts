export type Role = "user" | "admin"

export interface User {
  _id: string
  username: string
  passwordHash: string
  role: Role
  walletBalance: number
  twoFA?: {
    enabled: boolean
    secret?: string
  }
  createdAt: string
}

export type PaymentMethod = "truemoney-angpao" | "truemoney" | "promptpay"

export interface Transaction {
  _id: string
  userId: string
  amount: number
  fee: number
  method: PaymentMethod
  status: "pending" | "approved" | "failed"
  reference?: string
  createdAt: string
}

export type ProductType = "idpass" | "custom"

export interface ProductItem {
  username?: string
  password?: string
  // For custom items, store key-value payload
  payload?: Record<string, string>
  sold?: boolean
  buyerId?: string
  soldAt?: string
  _id?: string
}

export interface Product {
  _id: string
  name: string
  description?: string
  price: number
  type: ProductType
  // For custom type, define schema fields
  customSchema?: { label: string; key: string; required?: boolean }[]
  items: ProductItem[]
  createdAt: string
}

export interface Order {
  _id: string
  userId: string
  productId: string
  productName: string
  amount: number
  status: "paid" | "refunded" | "cancelled"
  deliveredItem?: ProductItem
  adminNotes?: string
  createdAt: string
}

export interface Coupon {
  _id: string
  code: string
  type: "money" | "percent"
  value: number
  usesLeft: number
  expiresAt?: string
  createdAt: string
}

export interface Announcement {
  _id: string
  message: string
  visible: boolean
  createdAt: string
}

export interface Notification {
  _id: string
  userId: string
  type: "back-in-stock" | "order" | "wallet" | "system"
  message: string
  read: boolean
  createdAt: string
}

export interface Settings {
  _id: string
  paymentAccounts: {
    truemoWalletId?: string
    promptpayQrUrl?: string
    note?: string
  }
  createdAt: string
  updatedAt: string
}
