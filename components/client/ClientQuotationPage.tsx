"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { getClientQuotationPortal, submitClientQuotationResponseDirect } from "@/services/api/client/client-portal.service";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { 
  FileText, 
  Calendar, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  Building,
  Info
} from "lucide-react";

export function ClientQuotationPage({ token }: { token: string }) {
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState<"boq" | "terms">("boq");
  
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-quotation-portal", token],
    queryFn: () => getClientQuotationPortal(token)
  });

  const responseMutation = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "revision_requested") => 
      submitClientQuotationResponseDirect(token, decision, reason),
    onSuccess: (status) => {
      let msg = "";
      if (status === "approved") msg = "Thank you! You have approved this quotation.";
      else if (status === "rejected") msg = "You have rejected this quotation.";
      else if (status === "revision_requested") msg = "Revision request submitted. We will get back to you shortly.";
      
      setToast({ message: msg, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["client-quotation-portal", token] });
    },
    onError: (error) => {
      setToast({ message: (error as Error).message || "An error occurred.", type: "error" });
    },
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-4 border-cyan-200 border-t-cyan-700 animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Retrieving quotation details...</p>
        </div>
      </main>
    );
  }

  if (isError || !data || !data.valid) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Link Expired or Invalid</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            This secure link has expired, has been deactivated, or is invalid. Please contact Skill Engineering to receive a new link.
          </p>
        </div>
      </main>
    );
  }

  const { quotation, client } = data;
  const isPendingResponse = quotation.status === "client_sent" || quotation.status === "sent_to_client";

  const getStatusMessage = () => {
    switch (quotation.status) {
      case "approved":
        return {
          title: "Quotation Approved",
          desc: "You have approved this quotation. Our team will proceed with the next steps to start the project.",
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        };
      case "rejected":
        return {
          title: "Quotation Rejected",
          desc: "You have declined this quotation. If you did this by mistake, please contact our team.",
          bg: "bg-red-50 border-red-200 text-red-800",
          icon: <XCircle className="h-6 w-6 text-red-600" />
        };
      case "revision_requested":
        return {
          title: "Revision Requested",
          desc: "A revision has been requested. We are reviewing your feedback and will submit an updated version soon.",
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />
        };
      default:
        return null;
    }
  };

  const statusBanner = getStatusMessage();

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      {/* Brand Header Banner */}
      <header className="bg-slate-900 text-white py-8 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center font-bold text-white text-lg tracking-wider">S</span>
              <span className="font-semibold text-lg tracking-wider">SKILL ENGINEERING</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">Quotations & Project Estimations Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Status:</span>
            <StatusBadge status={quotation.status} className="text-xs font-semibold px-3 py-1" />
          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid gap-8 lg:grid-cols-3 items-start">
        
        {/* Left 2 Columns: Quotation Details & BOQ */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Toast Notification */}
          {toast && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-md animate-fade-in ${
              toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />}
              <div>
                <p className="font-semibold text-sm">{toast.message}</p>
              </div>
            </div>
          )}

          {/* Status banner */}
          {statusBanner && (
            <div className={`p-5 rounded-xl border flex gap-4 ${statusBanner.bg}`}>
              <div className="shrink-0">{statusBanner.icon}</div>
              <div>
                <h3 className="font-bold text-sm leading-tight">{statusBanner.title}</h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{statusBanner.desc}</p>
              </div>
            </div>
          )}

          {/* Quotation Header Card */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-50/50 rounded-bl-full -z-0"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-cyan-700 font-semibold text-sm">
                  <FileText className="h-4 w-4" />
                  <span>Quotation Document</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">{quotation.code}</h1>
                <p className="text-slate-500 text-xs mt-0.5">Version {quotation.version}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">Valid Until</p>
                    <p className="font-semibold text-slate-800">{new Date(quotation.validUntil).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-slate-400 text-xs">Guarantee</p>
                    <p className="font-semibold text-slate-800">100% Quality</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-500 text-xs">Subtotal</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{formatCurrency(quotation.subtotal)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-500 text-xs">Discount</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{formatCurrency(quotation.discount)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-500 text-xs">Taxes & Levies</p>
                <p className="text-sm font-semibold text-slate-800 mt-1">{formatCurrency(quotation.taxTotal)}</p>
              </div>
              <div className="p-3 bg-cyan-50/70 border border-cyan-100 rounded-xl">
                <p className="text-cyan-800 text-xs font-semibold">Grand Total</p>
                <p className="text-base font-extrabold text-cyan-950 mt-1">{formatCurrency(quotation.grandTotal)}</p>
              </div>
            </div>
          </section>

          {/* Interactive Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab("boq")} 
              className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
                activeTab === "boq" 
                  ? "border-cyan-600 text-cyan-700" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Bill of Quantities (BOQ)
            </button>
            <button 
              onClick={() => setActiveTab("terms")} 
              className={`px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
                activeTab === "terms" 
                  ? "border-cyan-600 text-cyan-700" 
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Terms & Exclusions
            </button>
          </div>

          {/* Tab content: BOQ Table */}
          {activeTab === "boq" ? (
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {quotation.boqLines.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No line items available in this quotation.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-4 px-5">Section</th>
                        <th className="py-4 px-5">Description</th>
                        <th className="py-4 px-5 text-right">Qty</th>
                        <th className="py-4 px-5 text-center">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {quotation.boqLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5 font-semibold text-slate-700 align-top max-w-[150px] truncate">
                            {line.section}
                          </td>
                          <td className="py-4 px-5 text-slate-600 whitespace-pre-wrap max-w-md leading-relaxed align-top">
                            {line.itemName || line.description}
                          </td>
                          <td className="py-4 px-5 text-right font-bold text-slate-800 align-top">
                            {line.qty}
                          </td>
                          <td className="py-4 px-5 text-center text-slate-500 align-top">
                            {line.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : (
            /* Tab content: Notes and Exclusions */
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              {quotation.paymentTerms && (
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Payment Terms</h3>
                  <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl">
                    {quotation.paymentTerms}
                  </div>
                </div>
              )}
              {quotation.notes && (
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Notes & Exclusions</h3>
                  <div className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-xl">
                    {quotation.notes}
                  </div>
                </div>
              )}
              {!quotation.paymentTerms && !quotation.notes && (
                <div className="text-slate-500 text-sm text-center py-6">
                  No payment terms or exclusions specified in this quotation.
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right 1 Column: Client Details & Response Actions */}
        <div className="space-y-6">
          {/* Client Details Panel */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="h-4 w-4 text-slate-500" />
              <span>Customer Information</span>
            </h3>
            
            <div className="space-y-3.5 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Client Name / Company</p>
                <p className="font-semibold text-slate-800 mt-0.5">{client.name}</p>
              </div>
              {client.contactPerson && client.contactPerson !== client.name && (
                <div>
                  <p className="text-slate-400 text-xs">Contact Person</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{client.contactPerson}</p>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{client.phone}</span>
                </div>
              )}
            </div>
          </section>

          {/* Action Responses Card */}
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span>Quotation Response</span>
            </h3>

            {isPendingResponse ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Please review the document, BOQ lines, and terms. You can approve this quotation, request a revision, or reject it using the panel below.
                </p>
                
                <div>
                  <label htmlFor="remarks" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Response Remarks / Feedbacks
                  </label>
                  <textarea
                    id="remarks"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter any comments, request alterations, or reasons for rejection here..."
                    className="w-full min-h-[100px] text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid gap-2.5">
                  <button 
                    onClick={() => responseMutation.mutate("approved")}
                    disabled={responseMutation.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Approve Quotation</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (!reason.trim()) {
                        setToast({ message: "Please enter a reason or description of the requested revisions in the remarks field.", type: "error" });
                        return;
                      }
                      responseMutation.mutate("revision_requested");
                    }}
                    disabled={responseMutation.isPending}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Request Revision</span>
                  </button>

                  <button 
                    onClick={() => {
                      if (!reason.trim()) {
                        setToast({ message: "Please provide a reason for rejecting the quotation in the remarks field.", type: "error" });
                        return;
                      }
                      responseMutation.mutate("rejected");
                    }}
                    disabled={responseMutation.isPending}
                    className="w-full bg-white border border-red-200 hover:bg-red-50 disabled:bg-slate-50 text-red-600 font-bold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Reject Quotation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    This quotation has already been processed. No further response actions are available from this portal link.
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Final Outcome:</span>
                    <div className="mt-1">
                      <StatusBadge status={quotation.status} className="font-semibold" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

      </div>
    </main>
  );
}
