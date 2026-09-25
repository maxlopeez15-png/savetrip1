import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardLinkModal, CardList } from "@/components/PaymentFeatures";
import { PersonaImagePicker } from "@/components/PersonaImagePicker";
import { formatMoney, useSavetrip } from "@/lib/savetrip";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";

export function AccountSettingsExtras() {
  const { user } = useSavetrip(); const [searchParams, setSearchParams] = useSearchParams(); const [showCard, setShowCard] = useState(false); const [showPremiumNotice, setShowPremiumNotice] = useState(false);
  useEffect(() => { if (searchParams.get("linkCard") === "1") { setShowCard(true); setSearchParams({}, { replace: true }); } }, [searchParams, setSearchParams]);
  const isAdmin = user.email === "max@pulsepass.demo" || user.email === "admin@pulsepass.demo";
  return <>
    <PersonaImagePicker />
    <div className="profile-strip"><div><p className="card-kicker text-teal">ACCOUNT PROFILE</p><strong>{user.email || "No email added"}</strong><span>Account email and membership status</span></div><button className="profile-edit-link" onClick={() => document.getElementById("financial-profile")?.scrollIntoView({ behavior: "smooth" })}>Edit financial profile <ArrowRight size={14} /></button></div>
    {isAdmin && <a href="/admin/payments" className="mb-6 flex items-center justify-between rounded-[26px] border border-teal/20 bg-white p-5 text-left"><div><p className="card-kicker text-teal">ADMIN · BUSINESS SETTINGS</p><strong className="mt-2 block font-display text-xl text-navy">Mercado Pago payments</strong><span className="mt-1 block text-sm text-slate-500">Connect the authorized seller account and review confirmed payment metrics.</span></div><ArrowRight size={17} className="text-teal" /></a>}
    <div className="settings-extra-grid">
      <CardList onLink={() => setShowCard(true)} />
      <div className="subscription-card"><div className="subscription-top"><span className="premium-spark"><Crown size={17} /></span><span className={user.isPremium ? "premium-status" : "free-status"}>{user.isPremium ? "PREMIUM MEMBER" : "CURRENT PLAN"}</span></div><h3 className="mt-3 font-display text-xl font-bold text-navy">PulsePass {user.isPremium ? "Premium ✦" : "Free"}</h3><p className="mt-2 text-sm leading-5 text-slate-500">{user.isPremium ? "Advanced scenarios, analytics, and more room to personalize your journey." : "Your core retirement habit loop is active and ready to grow."}</p>{user.isPremium ? <div className="premium-check"><Check size={14} /> Premium features unlocked</div> : <Button onClick={() => setShowPremiumNotice(true)} className="primary-button mt-5 w-full">Upgrade to Premium <ArrowRight size={15} /></Button>}</div>
    </div>
    <div className="mt-6 rounded-[26px] border border-line bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="card-kicker text-teal">CONTRIBUTION HISTORY</p><h3 className="mt-2 font-display text-xl font-bold text-navy">Account activity</h3></div><span className="text-xs font-semibold text-slate-400">Provider-confirmed records</span></div>{user.contributions.length === 0 ? <p className="mt-5 text-sm leading-6 text-slate-500">No contributions recorded yet. Successful payments will appear here after Mercado Pago confirmation.</p> : <div className="mt-5 space-y-3">{user.contributions.slice().reverse().map((contribution) => <div key={contribution.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4"><div><strong className="text-sm text-navy">{formatMoney(contribution.amount)}</strong><p className="mt-1 text-xs text-slate-500">{contribution.paymentMethodBrand || "Mercado Pago"} {contribution.paymentMethodLast4 ? `•••• ${contribution.paymentMethodLast4}` : ""} · {new Date(contribution.createdAt).toLocaleDateString("es-MX")}</p></div><span className="rounded-full bg-mint-pale px-3 py-1 text-xs font-bold capitalize text-teal">{contribution.status}</span></div>)}</div>}</div>
    {showPremiumNotice && <div className="inline-premium-note"><Sparkles size={16} /><span>Unlock advanced projections, scenarios, themes, and multiple cards from the Premium screen.</span><button onClick={() => window.location.href = "/premium"}>Explore <ArrowRight size={14} /></button></div>}
    <CardLinkModal open={showCard} onClose={() => setShowCard(false)} />
  </>;
}
