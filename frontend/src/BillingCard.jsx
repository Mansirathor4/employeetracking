import React from "react";

const billingData = [
  { client: "Acme Corp", invoice: "#INV-1023", amount: "$2,500", status: "Pending", due: "2026-02-15" },
  { client: "Globex Ltd", invoice: "#INV-1024", amount: "$1,800", status: "Paid", due: "2026-01-30" },
  { client: "Initech", invoice: "#INV-1025", amount: "$3,200", status: "Pending", due: "2026-02-20" },
];

const statusColors = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function BillingCard() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-purple-700">Pricing & Billing</h2>
      <div className="flex flex-col gap-4">
        {billingData.map((bill, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-4 shadow flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="font-semibold text-gray-800 text-lg">{bill.client}</div>
            <div className="text-sm text-gray-500">Invoice: {bill.invoice}</div>
            <div className="text-sm text-gray-500">Amount: {bill.amount}</div>
            <div className={`text-xs px-2 py-1 rounded-full font-bold ${statusColors[bill.status]}`}>{bill.status}</div>
            <div className="text-sm text-gray-500">Due: {bill.due}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
