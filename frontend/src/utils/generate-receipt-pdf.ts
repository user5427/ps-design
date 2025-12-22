import { jsPDF } from "jspdf";
import type { OrderResponse } from "@ps-design/schemas/order/order";
import type { Appointment } from "@/schemas/appointments";
import dayjs from "dayjs";

/** PDF page dimensions and spacing configuration */
const PDF_CONFIG = {
  pageWidth: 80,
  marginLeft: 5,
  marginRight: 5,
  lineWidth: 0.2,
} as const;

/**
 * Format a number as a price string (e.g., "12.50€").
 * Handles both cents (numbers > 100) and major units.
 */
function formatPrice(amount: number, isCents = false): string {
  const value = isCents ? amount / 100 : amount;
  return `${value.toFixed(2)}€`;
}

/**
 * Create a new PDF document with standard receipt formatting
 */
function createReceiptDocument(): jsPDF {
  return new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200],
  });
}

function addDivider(
  doc: jsPDF,
  y: number,
  marginLeft: number = PDF_CONFIG.marginLeft,
  marginRight: number = PDF_CONFIG.marginRight,
): number {
  doc.setLineWidth(PDF_CONFIG.lineWidth);
  doc.line(marginLeft, y, PDF_CONFIG.pageWidth - marginRight, y);
  return y + 5;
}

/**
 * Add a section header with bold formatting
 */
function addSectionHeader(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.text(text, PDF_CONFIG.marginLeft, y);
  return y + 5;
}

/**
 * Add a left-right aligned row (label on left, value on right)
 */
function addRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  indent = 0,
): number {
  doc.setFont("helvetica", "normal");
  doc.text(label, PDF_CONFIG.marginLeft + indent, y);
  doc.text(value, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, y, {
    align: "right",
  });
  return y + 4;
}

/**
 * Add the title/header to the receipt
 */
function addHeader(doc: jsPDF, title: string): number {
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, PDF_CONFIG.pageWidth / 2, 10, { align: "center" });
  return 18;
}

/**
 * Open PDF in a new tab
 */
function openPdfInTab(doc: jsPDF): void {
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}

export function generateOrderReceiptPdf(order: OrderResponse): void {
  const doc = createReceiptDocument();
  let y = addHeader(doc, "RECEIPT");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Order: ${order.id.slice(0, 8)}...`, PDF_CONFIG.marginLeft, y);
  y += 5;
  doc.text(
    order.tableId ? `Table: ${order.tableId.slice(0, 8)}` : "Takeaway",
    PDF_CONFIG.marginLeft,
    y,
  );
  y += 5;
  doc.text(
    `Date: ${dayjs(order.createdAt).format("YYYY-MM-DD HH:mm")}`,
    PDF_CONFIG.marginLeft,
    y,
  );
  y += 7;

  y = addDivider(doc, y);
  y = addSectionHeader(doc, "Items", y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const item of order.orderItems) {
    const itemLine = `${item.quantity}x ${item.snapName}`;
    const priceText = formatPrice(item.lineTotal);

    doc.text(itemLine, PDF_CONFIG.marginLeft, y);
    doc.text(priceText, PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight, y, {
      align: "right",
    });
    y += 4;

    if (item.variations && item.variations.length > 0) {
      for (const variation of item.variations) {
        doc.setFontSize(7);
        doc.text(
          `  + ${variation.snapVariationName}`,
          PDF_CONFIG.marginLeft,
          y,
        );
        y += 3;
      }
      doc.setFontSize(8);
    }
  }

  y += 3;
  y = addDivider(doc, y);

  doc.setFontSize(9);
  y = addRow(doc, "Subtotal:", formatPrice(order.itemsTotal), y);

  if (order.totalTax > 0) {
    y = addRow(doc, "Tax:", formatPrice(order.totalTax), y);
  }

  if (order.totalDiscount > 0) {
    y = addRow(doc, "Discount:", `-${formatPrice(order.totalDiscount)}`, y);
  }

  if (order.totalTip > 0) {
    y = addRow(doc, "Tip:", formatPrice(order.totalTip), y);
  }

  y = addDivider(doc, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  y = addRow(doc, "TOTAL:", formatPrice(order.totalAmount), y);
  y += 2;

  if (order.payments && order.payments.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    y = addSectionHeader(doc, "Payments", y);

    for (const payment of order.payments) {
      const method = payment.method;
      const amount = payment.amount;
      const refundLabel = payment.isRefund ? " (refund)" : "";
      y = addRow(doc, `${method}${refundLabel}:`, formatPrice(amount), y, 2);
    }
  }

  openPdfInTab(doc);
}

/**
 * Generate a PDF receipt for an appointment and open it in a new tab.
 */
export function generateAppointmentReceiptPdf(appointment: Appointment): void {
  const doc = createReceiptDocument();
  let y = addHeader(doc, "RECEIPT");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${appointment.customerName}`, PDF_CONFIG.marginLeft, y);
  y += 5;

  const serviceName = appointment.service?.serviceDefinition?.name ?? "Service";
  doc.text(`Service: ${serviceName}`, PDF_CONFIG.marginLeft, y);
  y += 5;

  const employeeName = appointment.service?.employee?.name ?? "Staff";
  doc.text(`Staff: ${employeeName}`, PDF_CONFIG.marginLeft, y);
  y += 5;

  const dateStr = dayjs(appointment.startTime).format("YYYY-MM-DD HH:mm");
  doc.text(`Date: ${dateStr}`, PDF_CONFIG.marginLeft, y);
  y += 5;

  const duration = appointment.service?.serviceDefinition?.duration ?? 0;
  doc.text(`Duration: ${duration} min`, PDF_CONFIG.marginLeft, y);
  y += 7;

  y = addDivider(doc, y);

  const payment = appointment.payment;
  if (payment) {
    y = addSectionHeader(doc, "Payment Details", y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    if (payment.lineItems && payment.lineItems.length > 0) {
      for (const item of payment.lineItems) {
        const isNegative = item.type === "DISCOUNT";
        y = addRow(
          doc,
          item.label,
          isNegative
            ? `-${formatPrice(item.amount, true)}`
            : formatPrice(item.amount, true),
          y,
        );
      }
    } else {
      // Fallback: show service price and tip
      y = addRow(doc, "Service:", formatPrice(payment.servicePrice, true), y);

      if (payment.tipAmount > 0) {
        y = addRow(doc, "Tip:", formatPrice(payment.tipAmount, true), y);
      }
    }

    y += 2;
    y = addDivider(doc, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    y = addRow(doc, "TOTAL:", formatPrice(payment.totalAmount, true), y);
    y += 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Paid via: ${payment.paymentMethod}`, PDF_CONFIG.marginLeft, y);
    y += 4;
    doc.text(
      `Paid at: ${dayjs(payment.paidAt).format("YYYY-MM-DD HH:mm")}`,
      PDF_CONFIG.marginLeft,
      y,
    );
    y += 5;

    if (payment.refundedAt) {
      doc.setFontSize(8);
      doc.text(
        `Refunded: ${dayjs(payment.refundedAt).format("YYYY-MM-DD HH:mm")}`,
        PDF_CONFIG.marginLeft,
        y,
      );
      y += 4;
      if (payment.refundReason) {
        doc.text(`Reason: ${payment.refundReason}`, PDF_CONFIG.marginLeft, y);
        y += 4;
      }
    }
  } else {
    doc.setFontSize(9);
    doc.text("No payment recorded.", PDF_CONFIG.marginLeft, y);
  }

  openPdfInTab(doc);
}
