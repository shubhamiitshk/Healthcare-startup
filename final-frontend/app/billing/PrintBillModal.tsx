import React from "react";
import { BillDetails } from "./BillingModals";

export function PrintBillModal({ open, onClose, bill }: {
  open: boolean;
  onClose: () => void;
  bill: BillDetails | null;
}) {
  const printRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const win = window.open('', '', 'height=600,width=800');
      if (win) {
        win.document.write('<html><head><title>Print Bill</title>');
        win.document.write('<style>body{font-family:sans-serif;} .accent{color:#164772;} .amount{color:#1BBA8D;}</style>');
        win.document.write('</head><body >');
        win.document.write(printContents);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
      }
    }
  };

  if (!open || !bill) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 min-w-[350px] max-w-[90vw]">
        <div ref={printRef} className="mb-4">
          <h2 className="text-2xl font-bold accent mb-2">Clinic Invoice</h2>
          <div className="mb-1"><b className="accent">Patient:</b> {bill.patientName}</div>
          <div className="mb-1"><b className="accent">Date:</b> {bill.date}</div>
          <div className="mb-1"><b className="accent">Status:</b> {bill.status}</div>
          <div className="mb-1"><b className="accent">Payment Mode:</b> {bill.paymentMode || '-'}</div>
          {typeof bill.discount === 'number' && bill.discount > 0 && (
            <div className="mb-1"><b className="accent">Discount:</b> ${bill.discount.toFixed(2)}</div>
          )}
          <div className="mb-1"><b className="accent">Details:</b> {bill.details}</div>
          {bill.notes && <div className="mb-1"><b className="accent">Notes:</b> {bill.notes}</div>}
          <div className="mb-2 text-lg font-bold amount">Amount: ${bill.amount.toFixed(2)}</div>
          <hr className="my-2" />
          <div className="mb-1"><b className="accent">Clinic:</b> {bill.clinicName || ''}</div>
          <div className="mb-1"><b className="accent">Clinic Address:</b> {bill.clinicAddress || ''}</div>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="px-4 py-2 rounded bg-gray-200 text-[#164772] font-semibold" onClick={onClose}>Close</button>
          <button className="px-4 py-2 rounded bg-[#1BBA8D] text-white font-semibold" onClick={handlePrint}>Print</button>
        </div>
      </div>
    </div>
  );
}
