"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Company {
  id: string
  name: string
  email: string
  address: string
  phone?: string
  website?: string
  logoUrl: string
  logoHasDarkBg: boolean
  paymentBaseUrl: string
  taxId?: string
  stripeAccountId?: string
  isActive: boolean
  createdAt: string
  stats: {
    totalRevenue: number
    invoiceCount: number
    clientCount: number
  }
}

interface AppSettings {
  defaultCurrency: string
  defaultTaxRate: number
  processingFeeRate: number
  processingFeeFixed: number
}

export interface InvoiceService {
  id: string
  name: string
}

// ✅ Fixed Draft interface to match actual usage
export interface Draft {
  id: string  // Always string, never undefined
  data: {
    company: Company | null
    client: {
      name: string
      email: string
      address: string
    }
    invoiceNumber: string
    dueDate: string
    currency: string
    items: any[]
    subtotal: number
    tax: number
    taxRate: number
    total: number
    notes: string
  }
}

interface Transaction {
  id: string
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  paymentMethod: string
  status: string
  date: string
  processingFee: number
  totalWithFees: number
  methodDetails: any
}

interface AppState {
  companies: Company[]
  settings: AppSettings
  invoiceServices: InvoiceService[]
   transactions: Transaction[]

  // Company actions
  setCompanies: (companies: Company[]) => void
  addCompany: (company: Omit<Company, "id" | "createdAt" | "stats">) => void
  updateCompany: (id: string, updates: Partial<Company>) => void
  deleteCompany: (id: string) => void
  toggleCompanyStatus: (id: string) => void

  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void
  setInvoiceServices: (services: InvoiceService[]) => void
  addInvoiceService: (name: string) => void
  deleteInvoiceService: (id: string) => void

// Transaction actions
  addTransaction: (txn: Transaction) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      companies: [],
      settings: {
        defaultCurrency: "GBP",
        defaultTaxRate: 0.2, // 20% UK VAT
        processingFeeRate: 0.029, // 2.9%
        processingFeeFixed: 0.2,
      },
      invoiceServices: [
        { id: "consulting", name: "Consulting" },
        { id: "development", name: "Development" },
        { id: "design", name: "Design" },
        { id: "support", name: "Support" },
      ],

      // ✅ Company actions
      setCompanies: (companies) => set({ companies }),
      addCompany: (companyData) => {
        const company: Company = {
          ...companyData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString().split("T")[0],
          stats: {
            totalRevenue: 0,
            invoiceCount: 0,
            clientCount: 0,
          },
        }
        set((state) => ({
          companies: [...state.companies, company],
        }))
      },
      updateCompany: (id, updates) => {
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === id ? { ...company, ...updates } : company,
          ),
        }))
      },
      deleteCompany: (id) => {
        set((state) => ({
          companies: state.companies.filter((company) => company.id !== id),
        }))
      },
      toggleCompanyStatus: (id) => {
        set((state) => ({
          companies: state.companies.map((company) =>
            company.id === id ? { ...company, isActive: !company.isActive } : company,
          ),
        }))
      },

          // ✅ transection
      transactions: [],

addTransaction: (txn) => {
  set((state) => ({
    transactions: [...state.transactions, txn],
  }))
},

      // ✅ Settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }))
      },
      setInvoiceServices: (services) => set({ invoiceServices: services }),
      addInvoiceService: (name) => {
        const trimmedName = name.trim()
        if (!trimmedName) return

        set((state) => {
          const duplicate = state.invoiceServices.some(
            (service) => service.name.toLowerCase() === trimmedName.toLowerCase(),
          )
          if (duplicate) return state

          return {
            invoiceServices: [
              ...state.invoiceServices,
              {
                id: crypto.randomUUID(),
                name: trimmedName,
              },
            ],
          }
        })
      },
      deleteInvoiceService: (id) => {
        set((state) => ({
          invoiceServices: state.invoiceServices.filter((service) => service.id !== id),
        }))
      },
    }),
    {
      name: "payment-terminal-storage", // persisted key in localStorage
      partialize: (state) => ({
        settings: state.settings,
        invoiceServices: state.invoiceServices,
        transactions: state.transactions,
        // companies are now handled via DB
      }),
    },
  ),
)
