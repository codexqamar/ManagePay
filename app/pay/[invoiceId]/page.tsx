import { InvoicePayment } from "@/components/invoice-payment"

interface PageProps {
  params: Promise<{
    invoiceId: string
  }>
}

export default async function PayInvoicePage({ params }: PageProps) {
  const { invoiceId } = await params

  return (
    <div className="min-h-screen bg-background">
      <InvoicePayment invoiceId={invoiceId} />
    </div>
  )
}
