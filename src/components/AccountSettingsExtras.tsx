import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CardLinkModal, CardList } from "@/components/PulsePassFeatures";
import { useSavetrip } from "@/lib/savetrip";
import { ArrowRight, Check, Crown, Sparkles } from "lucide-react";

export function AccountSettingsExtras() {
  const { user } = useSavetrip(); const [searchParams, setSearchParams] = useSearchParams(); const [showCard, setShowCard] = useState(false); const [showPremiumNotice, setShowPremiumNotice] = useState(false);
  useEffect(() => { if (searchParams.get("linkCard") === "1") { setShowCard(true); setSearchParams({}, { replace: true }); } }, [searchParams, setSearchParams]);
  return <>
    <div className="profile-strip"><div><p className="card-kicker text-teal">ACCOUNT PROFILE</p><strong>{user.email || "No email added"}</strong><span>Account email and membership status</span></div><button className="profile-edit-link" onClick={() => document.getElementById("financial-profile")?.scrollIntoView({ behavior: "smooth" })}>Edit financial profile <ArrowRight size={14} /></button></div>
    <div className="settings-extra-grid">
      <CardList onLink={() => setShowCard(true)} />
      <div className="subscription-card"><div className="subscription-top"><span className="premium-spark"><Crown size={17} /></span><span className={user.isPremium ? "premium-status" : "free-status"}>{user.isPremium ? "PREMIUM MEMBER" : "CURRENT PLAN"}</span></div><h3 className="mt-3 font-display text-xl font-bold text-navy">PulsePass {user.isPremium ? "Premium ✦" : "Free"}</h3><p className="mt-2 text-sm leading-5 text-slate-500">{user.isPremium ? "Advanced scenarios, analytics, and more room to personalize your journey." : "Your core retirement habit loop is active and ready to grow."}</p>{user.isPremium ? <div className="premium-check"><Check size={14} /> Premium features unlocked</div> : <Button onClick={() => setShowPremiumNotice(true)} className="primary-button mt-5 w-full">Upgrade to Premium <ArrowRight size={15} /></Button>}</div>
    </div>
    {showPremiumNotice && <div className="inline-premium-note"><Sparkles size={16} /><span>Unlock advanced projections, scenarios, themes, and multiple cards from the Premium screen.</span><button onClick={() => window.location.href = "/premium"}>Explore <ArrowRight size={14} /></button></div>}
    <CardLinkModal open={showCard} onClose={() => setShowCard(false)} />
  </>;
}
