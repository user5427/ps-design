import { jsPDF } from "jspdf";
import type { OrderResponse } from "@ps-design/schemas/order/order";
import type { Appointment } from "@/schemas/appointments";
import dayjs from "dayjs";

/**
 * Format a number as a price string (e.g., "12.50€").
 * Handles both cents (numbers > 100) and major units.
 */
function formatPrice(amount: number, isCents = false): string {
  const value = isCents ? amount / 100 : amount;
  return `${value.toFixed(2)}€`;
}

/**
 * Generate a PDF receipt for an order and open it in a new tab.
 */
export function generateOrderReceiptPdf(order: OrderResponse): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200],
  });

  const pageWidth = 80;
  const marginLeft = 5;
  const marginRight = 5;
  let y = 10;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPT", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Order info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Order: ${order.id.slice(0, 8)}...`, marginLeft, y);
  y += 5;
  doc.text(
    order.tableId ? `Table: ${order.tableId.slice(0, 8)}` : "Takeaway",
    marginLeft,
    y,
  );
  y += 5;
  doc.text(
    `Date: ${dayjs(order.createdAt).format("YYYY-MM-DD HH:mm")}`,
    marginLeft,
    y,
  );
  y += 7;

  // Divider
  doc.setLineWidth(0.2);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 5;

  // Items header
  doc.setFont("helvetica", "bold");
  doc.text("Items", marginLeft, y);
  y += 5;

  // Order items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  for (const item of order.orderItems) {
    const itemName = item.snapName;
    const qty = item.quantity;
    const lineTotal = item.lineTotal;

    // Item line: qty x name
    const itemLine = `${qty}x ${itemName}`;
    const priceText = formatPrice(lineTotal);

    doc.text(itemLine, marginLeft, y);
    doc.text(priceText, pageWidth - marginRight, y, { align: "right" });
    y += 4;

    // Show variations if any
    if (item.variations && item.variations.length > 0) {
      for (const variation of item.variations) {
        doc.setFontSize(7);
        doc.text(`  + ${variation.snapVariationName}`, marginLeft, y);
        y += 3;
      }
      doc.setFontSize(8);
    }
  }

  y += 3;
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 5;

  // Totals section
  doc.setFontSize(9);

  // Subtotal (items total)
  doc.text("Subtotal:", marginLeft, y);
  doc.text(formatPrice(order.itemsTotal), pageWidth - marginRight, y, {
    align: "right",
  });
  y += 5;

  // Tax
  if (order.totalTax > 0) {
    doc.text("Tax:", marginLeft, y);
    doc.text(formatPrice(order.totalTax), pageWidth - marginRight, y, {
      align: "right",
    });
    y += 5;
  }

  // Discount
  if (order.totalDiscount > 0) {
    doc.text("Discount:", marginLeft, y);
    doc.text(
      `-${formatPrice(order.totalDiscount)}`,
      pageWidth - marginRight,
      y,
      {
        align: "right",
      },
    );
    y += 5;
  }

  // Tip
  if (order.totalTip > 0) {
    doc.text("Tip:", marginLeft, y);
    doc.text(formatPrice(order.totalTip), pageWidth - marginRight, y, {
      align: "right",
    });
    y += 5;
  }

  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 5;

  // Grand total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", marginLeft, y);
  doc.text(formatPrice(order.totalAmount), pageWidth - marginRight, y, {
    align: "right",
  });
  y += 7;

  // Payment info
  if (order.payments && order.payments.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Payments:", marginLeft, y);
    y += 4;

    for (const payment of order.payments) {
      const method = payment.method;
      const amount = payment.amount;
      const refundLabel = payment.isRefund ? " (refund)" : "";
      doc.text(
        `${method}${refundLabel}: ${formatPrice(amount)}`,
        marginLeft + 2,
        y,
      );
      y += 4;
    }
  }

  y += 5;

  // Footer
  doc.setFontSize(8);
  doc.text("Thank you!", pageWidth / 2, y, { align: "center" });

  // Open PDF in new tab
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}

/**
 * Generate a PDF receipt for an appointment and open it in a new tab.
 */
export function generateAppointmentReceiptPdf(appointment: Appointment): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 200], // Receipt-style narrow format
  });

  const pageWidth = 80;
  const marginLeft = 5;
  const marginRight = 5;
  let y = 10;

  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPT", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Appointment info
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text(`Customer: ${appointment.customerName}`, marginLeft, y);
  y += 5;

  const serviceName = appointment.service?.serviceDefinition?.name ?? "Service";
  doc.text(`Service: ${serviceName}`, marginLeft, y);
  y += 5;

  const employeeName = appointment.service?.employee?.name ?? "Staff";
  doc.text(`Staff: ${employeeName}`, marginLeft, y);
  y += 5;

  const dateStr = dayjs(appointment.startTime).format("YYYY-MM-DD HH:mm");
  doc.text(`Date: ${dateStr}`, marginLeft, y);
  y += 5;

  const duration = appointment.service?.serviceDefinition?.duration ?? 0;
  doc.text(`Duration: ${duration} min`, marginLeft, y);
  y += 7;

  // Divider
  doc.setLineWidth(0.2);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 5;

  // Payment details
  const payment = appointment.payment;
  if (payment) {
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", marginLeft, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    // Line items
    if (payment.lineItems && payment.lineItems.length > 0) {
      for (const item of payment.lineItems) {
        const label = item.label;
        const amount = item.amount; // cents
        const isNegative = item.type === "DISCOUNT";

        doc.text(label, marginLeft, y);
        doc.text(
          isNegative
            ? `-${formatPrice(amount, true)}`
            : formatPrice(amount, true),
          pageWidth - marginRight,
          y,
          { align: "right" },
        );
        y += 4;
      }
    } else {
      // Fallback: show service price and tip
      doc.text("Service:", marginLeft, y);
      doc.text(
        formatPrice(payment.servicePrice, true),
        pageWidth - marginRight,
        y,
        {
          align: "right",
        },
      );
      y += 4;

      if (payment.tipAmount > 0) {
        doc.text("Tip:", marginLeft, y);
        doc.text(
          formatPrice(payment.tipAmount, true),
          pageWidth - marginRight,
          y,
          {
            align: "right",
          },
        );
        y += 4;
      }
    }

    y += 2;
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 5;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL:", marginLeft, y);
    doc.text(
      formatPrice(payment.totalAmount, true),
      pageWidth - marginRight,
      y,
      {
        align: "right",
      },
    );
    y += 7;

    // Payment method
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Paid via: ${payment.paymentMethod}`, marginLeft, y);
    y += 4;
    doc.text(
      `Paid at: ${dayjs(payment.paidAt).format("YYYY-MM-DD HH:mm")}`,
      marginLeft,
      y,
    );
    y += 5;

    // Refund info if applicable
    if (payment.refundedAt) {
      doc.setFontSize(8);
      doc.text(
        `Refunded: ${dayjs(payment.refundedAt).format("YYYY-MM-DD HH:mm")}`,
        marginLeft,
        y,
      );
      y += 4;
      if (payment.refundReason) {
        doc.text(`Reason: ${payment.refundReason}`, marginLeft, y);
        y += 4;
      }
    }
  } else {
    doc.setFontSize(9);
    doc.text("No payment recorded.", marginLeft, y);
    y += 5;
  }

  y += 3;

  // Footer
  doc.setFontSize(8);
  doc.text("Thank you!", pageWidth / 2, y, { align: "center" });

  // Open PDF in new tab
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, "_blank");
}
