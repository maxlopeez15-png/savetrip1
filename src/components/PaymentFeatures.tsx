import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, CreditCard, LockKeyhole, ShieldCheck, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSavetrip, type LinkedCard } from "@/lib/savetrip";
import { createProviderPayment, isProviderConfigured, PAYMENT_ENVIRONMENT, validateProviderCard } from "@/lib/paymentApi";
import { getInvestmentPlan } from "@/lib/investmentPlans";

type BrickForm = { token: string; payment_method_id?: string; issuer_id?: string; last_four_digits?: string; payer?: Record<string, unknown> };

declare global { interface Window { MercadoPago?: new (key: string, options?: Record<string, unknown>) => { bricks: () => { create: (type: string, options: Record<string, unknown>) => Promise<{ unmount: () => void }> } } } }

function ProviderCardBrick({ amount, onSubmit, containerId }: { amount: number; onSubmit: (form: BrickForm) => Promise<void>; containerId: string }) {
  const brickRef = useRef<{ unmount: () => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let cancelled = false;
    const mount = async () => {
      const MercadoPago = window.MercadoPago;
      if (!MercadoPago) { setStatus("error"); return; }
      const mp = new MercadoPago(import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY, { locale: "es-MX" });
      brickRef.current = await mp.bricks().create("cardPayment", {
        initialization: { amount: Math.max(1, amount) },
        customization: { visual: { style: { theme: "default" } }, paymentMethods: { maxInstallments: 1 } },
        callbacks: { onReady: () => !cancelled && setStatus("ready"), onSubmit: async (formData: BrickForm) => onSubmit(formData), onError: () => !cancelled && setStatus("error") },
      });
    };
    if (!isProviderConfigured) { setStatus("error"); return; }
    const existingScript = document.getElementById("mercadopago-sdk");
    if (window.MercadoPago) void mount();
    else if (existingScript) existingScript.addEventListener("load", () => void mount(), { once: true });
    else { const script = document.createElement("script"); script.id = "mercadopago-sdk"; script.src = "https://sdk.mercadopago.com/js/v2"; script.onload = () => void mount(); script.onerror = () => setStatus("error"); document.head.appendChild(script); }
    return () => { cancelled = true; brickRef.current?.unmount(); brickRef.current = null; };
  }, [amount, containerId, onSubmit]);
  return <div><div id={containerId} className="min-h-[86px] rounded-2xl border border-line bg-white p-2" />{status === "error" && <p className="mt-2 text-xs leading-5 text-slate-500">Mercado Pago Card Payment Brick is unavailable. Configure the public key and use SANDBOX or PRODUCTION; raw card fields are intentionally not accepted here.</p>}{status === "ready" && <p className="mt-2 flex items-center gap-1.5 text-xs text-teal"><ShieldCheck size={13} /> Card data is handled by Mercado Pago</p>}</div>;
}

export function CardLinkModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { linkCard } = useSavetrip();
  const [message, setMessage] = useState(""); const [success, setSuccess] = useState<LinkedCard | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setMessage(""); setSuccess(null); } }, [open]);
  if (!open) return null;
  const submit = async (formData: BrickForm) => {
    setBusy(true); setMessage("");
    try {
      const result = await validateProviderCard({ token: formData.token, paymentMethodId: formData.payment_method_id, issuerId: formData.issuer_id, last4: formData.last_four_digits });
      const card = { ...result.card, expirationMonth: undefined, expirationYear: undefined };
      linkCard(card); setSuccess(card);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Card verification could not be completed."); } finally { setBusy(false); }
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={(event) => event.stopPropagation()}>{success ? <div className="success-state"><div className="success-burst"><Check size={28} /></div><p className="eyebrow text-mint">CARD VERIFIED</p><h2 className="mt-1 font-display text-2xl font-bold text-navy">{success.brand}</h2><p className="mt-2 text-sm text-slate-500">{success.issuerName || "Issuer unavailable"}</p><p className="mt-1 text-sm font-semibold text-navy">{success.last4 ? `•••• ${success.last4}` : "Last four digits unavailable"}</p><p className="secure-note mt-5"><ShieldCheck size={14} /> Provider-side validation completed. Sensitive card data was not stored.</p></div> : <><div className="mb-6 flex items-start justify-between"><div><p className="eyebrow text-teal">{PAYMENT_ENVIRONMENT} · MERCADO PAGO</p><h2 className="mt-1 font-display text-2xl font-bold text-navy">Link a card</h2><p className="mt-2 text-sm text-slate-500">Use Mercado Pago's hosted Card Payment Brick. PulsePass never sees the full number or CVV.</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{isProviderConfigured ? <><ProviderCardBrick amount={1} containerId="pulsepass-card-link-brick" onSubmit={submit} />{busy && <p className="mt-4 text-sm font-semibold text-teal">Validating with Mercado Pago…</p>}{message && <p className="form-error mt-4">{message}</p>}</> : <ConfigurationNotice />}</>}</div></div>;
}

function ConfigurationNotice() { return <div className="rounded-3xl border border-gold/30 bg-gold-pale p-5"><p className="flex items-center gap-2 text-sm font-bold text-navy"><LockKeyhole size={16} /> Mercado Pago is not connected</p><p className="mt-2 text-sm leading-6 text-slate-600">Configure the server credentials and the public key before entering payment data. The current environment is {PAYMENT_ENVIRONMENT}; no card is considered verified in this state.</p><a href="/admin/payments" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal">Configure Mercado Pago <ArrowRight size={15} /></a></div>; }

export function ContributionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate(); const { user, addConfirmedContribution } = useSavetrip(); const [amount, setAmount] = useState("250"); const [selectedPlanId, setSelectedPlanId] = useState(user.investmentPlanId); const [status, setStatus] = useState<"review" | "processing" | "success" | "failed">("review"); const [error, setError] = useState(""); const [xpEarned, setXpEarned] = useState(0);
  const card = user.linkedCards.find((item) => item.verified && item.status !== "rejected"); const plan = getInvestmentPlan(selectedPlanId);
  useEffect(() => { if (open) { setStatus("review"); setError(""); setSelectedPlanId(user.investmentPlanId); } }, [open, user.investmentPlanId]);
  if (!open) return null;
  const submit = async (formData: BrickForm) => {
    setStatus("processing"); setError("");
    try { const result = await createProviderPayment({ token: formData.token, paymentMethodId: formData.payment_method_id, payer: formData.payer, amount: Number(amount), userId: user.id, investmentPlanId: selectedPlanId, idempotencyKey: `${user.id}-${Date.now()}` }); if (result.paymentStatus !== "approved") { setStatus("failed"); setError(`Mercado Pago returned: ${result.paymentStatus || "not approved"}. Savings balance was not updated.`); return; } const contribution = { ...result.contribution, userId: user.id, paymentMethodBrand: card?.brand, paymentMethodLast4: card?.last4, status: "approved" as const }; const progress = addConfirmedContribution(contribution); setXpEarned(progress.xpEarned); setStatus("success"); } catch (err) { setStatus("failed"); setError(err instanceof Error ? err.message : "Payment could not be processed. Savings balance was not updated."); }
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={(event) => event.stopPropagation()}>{status === "success" ? <div className="success-state"><div className="success-burst"><Check size={28} /></div><p className="eyebrow text-mint">CONTRIBUTION SUCCESSFUL</p><h2 className="mt-1 font-display text-3xl font-bold text-navy">+{new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number(amount) || 0)}</h2><p className="mt-2 text-slate-500">Plan: {plan.name} · {plan.illustrativeAnnualReturn.toFixed(1)}% illustrative annual return</p><div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-mint-pale px-4 py-3 text-sm font-semibold text-teal"><Zap size={16} fill="currentColor" /> +{xpEarned} XP earned</div><p className="mt-4 text-xs text-slate-500">Provider confirmation was received before updating your balance.</p><Button onClick={onClose} className="primary-button mt-5 w-full">Done</Button></div> : <><div className="mb-6 flex items-start justify-between"><div><p className="eyebrow">CONTRIBUTION REVIEW</p><h2 className="mt-1 font-display text-2xl font-bold text-navy">Add savings</h2><p className="mt-2 text-sm text-slate-500">Review the plan and payment details before sending.</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{status === "review" && <><label className="field-label">Amount<input autoFocus type="number" min={plan.minimumContribution} value={amount} onChange={(event) => setAmount(event.target.value)} className="field-input amount-input" /></label><label className="field-label mt-4">Investment plan<select className="field-input" value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>{["conservative", "balanced", "growth", "aggressive"].map((id) => { const item = getInvestmentPlan(id); return <option key={id} value={id}>{item.name} · {item.illustrativeAnnualReturn.toFixed(1)}% illustrative</option>; })}</select></label><div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Payment method</span><span className="font-semibold text-navy">{card ? `${card.brand} •••• ${card.last4 || "····"}` : "None linked"}</span></div><div className="mt-2 flex justify-between"><span className="text-slate-500">Risk</span><span className="font-semibold text-navy">{plan.riskLevel}</span></div></div><p className="secure-note mt-4"><ShieldCheck size={14} /> Projected returns are not guaranteed. Actual returns may vary.</p>{card && isProviderConfigured ? <><p className="mt-5 text-sm font-bold text-navy">Confirm securely with Mercado Pago</p><ProviderCardBrick amount={Number(amount) || 1} containerId="pulsepass-contribution-brick" onSubmit={submit} /></> : <><ConfigurationNotice /><Button onClick={() => { onClose(); navigate("/settings?linkCard=1"); }} className="primary-button mt-5 w-full">{card ? "Configure Mercado Pago" : "Link a verified card"} <ArrowRight size={16} /></Button></>}</>}{status === "processing" && <p className="rounded-2xl bg-mint-pale p-4 text-sm font-bold text-teal">Processing payment… Do not close this window.</p>}{status === "failed" && <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-bold text-red-700">Payment failed or was rejected</p><p className="mt-1 text-sm leading-5 text-red-600">{error}</p><p className="mt-2 text-xs text-red-600">No savings balance, XP, streak, or micro-goal was updated.</p><Button onClick={() => setStatus("review")} variant="outline" className="mt-3">Review again</Button></div>}</>}</div></div>;
}

export function CardList({ onLink }: { onLink: () => void }) {
  const { user, removeCard } = useSavetrip();
  return <div className="payment-methods"><div className="flex items-start justify-between gap-3"><div><p className="card-kicker text-teal"><CreditCard size={15} /> PAYMENT METHODS</p><h3 className="mt-2 font-display text-xl font-bold text-navy">Verified cards</h3></div><Button onClick={onLink} variant="outline" className="small-outline"><span>+</span> Link a card</Button></div>{user.linkedCards.length === 0 ? <div className="empty-payment"><CreditCard size={21} /><div><strong>No verified card</strong><p>Mercado Pago validates card data inside its hosted component.</p></div><button onClick={onLink} className="font-bold text-teal">Link a card</button></div> : <div className="linked-card-list">{user.linkedCards.map((card) => <div className="linked-card" key={card.id}><span className="linked-card-icon"><CreditCard size={18} /></span><div><strong>{card.brand} {card.last4 ? `•••• ${card.last4}` : "· digits unavailable"}</strong><small>{card.issuerName || "Issuer unavailable"} · <span className="text-teal">{card.verified ? "Provider verified" : "Pending"}</span></small></div><div className="card-actions"><button onClick={onLink} className="change-card">Add</button><button onClick={() => removeCard(card.id)} className="remove-card">Remove</button></div></div>)}</div>}<p className="secure-note mt-4"><ShieldCheck size={14} /> Full card number, CVV, and provider tokens never enter PulsePass storage.</p></div>;
}
