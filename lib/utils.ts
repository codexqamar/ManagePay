import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 🔑 Dynamic Payment URL based on company settings
 */
export function getInvoicePaymentUrl(invoiceId: string, company?: any) {
  if (company?.paymentBaseUrl || company?.payment_base_url) {
    const rawUrl = company.paymentBaseUrl || company.payment_base_url;
    // Ensure the URL has a protocol
    const baseUrl = rawUrl.startsWith('http') 
      ? rawUrl 
      : `https://${rawUrl}`
    
    // Remove trailing slash if exists
    const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${sanitizedBase}/pay/${invoiceId}`
  }
  
  // Fallback to current origin
  return `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${invoiceId}`
}
