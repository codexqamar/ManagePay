// components/invoice-preview.tsx
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/currencies"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface InvoicePreviewProps {
  invoiceData: {
    company: any
    client: {
      id?: string
      name: string
      email: string
      address: string
      phone?: string
      companyName?: string
    }
    invoiceNumber: string
    dueDate: string
    currency: string
    items: Array<{
      id: string
      serviceId?: string
      serviceName?: string
      description: string
      quantity: number
      rate: number
      amount: number
    }>
    subtotal: number
    tax: number
    taxRate: number
    total: number
    notes: string
  }
}

export function InvoicePreview({ invoiceData }: InvoicePreviewProps) {
  const { company, client, invoiceNumber, dueDate, currency, items, subtotal, tax, total, notes } = invoiceData
  const taxRateLabel = invoiceData.taxRate > 0 ? `${invoiceData.taxRate}%` : "0%"

  return (
    <Card className="w-full bg-white border-hairline rounded-lg shadow-none" id="invoice-preview">
      <CardContent className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            {company?.logoUrl ? (
              <div className={cn(
                "p-3 rounded-xl inline-block mb-3 shadow-md transition-colors",
                company.logoHasDarkBg ? "bg-ink" : "bg-transparent"
              )}>
                <img src={company.logoUrl} alt={company.name} className="h-10 w-auto object-contain" />
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold text-ink">INVOICE</h1>
            )}
            <p className="text-ink-mute text-sm">#{invoiceNumber}</p>
          </div>
          {company && (
            <div className="text-left sm:text-right mt-4 sm:mt-0">
              <h2 className="text-lg font-bold text-ink">{company?.name || "Company Name"}</h2>
              <p className="text-ink-mute text-sm">{company?.email}</p>
              {company?.phone && <p className="text-ink-mute text-sm">{company.phone}</p>}
              <p className="text-ink-mute text-xs whitespace-pre-line mt-1">{company?.address}</p>
            </div>
          )}
        </div>

        {/* Client and Date Info */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h3 className="font-semibold mb-2 text-ink">Bill To:</h3>
            <p className="text-ink-secondary">{client.name || "Client"}</p>
            {client.email && <p className="text-ink-secondary">{client.email}</p>}
            {client.address && <p className="whitespace-pre-line text-ink-secondary">{client.address}</p>}
          </div>
          <div className="text-left sm:text-right">
            <div className="mb-2">
              <span className="font-semibold">Invoice Date: </span>
              <span>{format(new Date(), "MMM dd, yyyy")}</span>
            </div>
            {dueDate && (
              <div>
                <span className="font-semibold">Due Date: </span>
                <span>{format(new Date(dueDate), "MMM dd, yyyy")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 sm:mb-8 overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-hairline">
                <th className="text-left py-2 px-2 sm:px-4 text-ink">Description</th>
                <th className="text-right py-2 px-2 sm:px-4 text-ink">Quantity</th>
                <th className="text-right py-2 px-2 sm:px-4 text-ink">Rate</th>
                <th className="text-right py-2 px-2 sm:px-4 text-ink">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-hairline">
                  <td className="py-3 px-2 sm:px-4">
                    {item.serviceName && (
                      <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">
                        {item.serviceName}
                      </div>
                    )}
                    <div className="text-ink font-medium">{item.description || "-"}</div>
                  </td>
                  <td className="py-3 px-2 sm:px-4 text-right">{item.quantity}</td>
                  <td className="py-3 px-2 sm:px-4 text-right">{formatCurrency(item.rate, currency)}</td>
                  <td className="py-3 px-2 sm:px-4 text-right">{formatCurrency(item.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="ml-auto w-full sm:w-64 mb-6 sm:mb-8">
          <div className="flex justify-between py-2">
            <span className="font-semibold">Subtotal:</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between py-2">
              <span className="font-semibold">Tax ({taxRateLabel}):</span>
              <span>{formatCurrency(tax, currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-hairline font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-hairline">
            <h3 className="font-semibold mb-2">Notes:</h3>
            <p className="text-sm whitespace-pre-line">{notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-hairline text-center text-xs text-ink-mute">
          <p>Thank you for your business!</p>
          {company && company.terms && (
            <p className="mt-2">{company.terms}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
