import { InvoicePayment } from "@/components/invoice-payment"

interface PageProps {
  params: Promise<{
    invoiceId: string
  }>
}

export default async function PayInvoicePage({ params }: PageProps) {
  const { invoiceId } = await params

  return (
    <div className="p-6">
      <InvoicePayment invoiceId={invoiceId} />
    </div>
  )
}
