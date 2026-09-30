import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSavetrip, type LinkedCard } from "@/lib/savetrip";
import { ArrowRight, Check, CreditCard, LockKeyhole, Mail, RefreshCw, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { ContributionModal as SecureContributionModal, CardLinkModal as SecureCardLinkModal, CardList as SecureCardList } from "@/components/PaymentFeatures";

export function ContributionModal(props: { open: boolean; onClose: () => void }) { return <SecureContributionModal {...props} />; }

export function CardLinkModal(props: { open: boolean; onClose: () => void }) { return <SecureCardLinkModal {...props} />; }

export const CardList = SecureCardList;

export function PremiumPreview({ title = "Advanced Retirement Scenarios" }: { title?: string }) {
  const navigate = useNavigate();
  return <div className="premium-preview"><div><span className="premium-spark"><Sparkles size={17} /></span></div><div className="min-w-0 flex-1"><p className="eyebrow text-gold">PREMIUM PREVIEW</p><h3 className="mt-1 font-display text-xl font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-5 text-slate-500">Compare multiple futures and see which monthly move changes the map.</p><div className="preview-bars"><span /><span /><span /></div></div><Button onClick={() => navigate("/premium")} className="primary-button shrink-0">Explore Premium <ArrowRight size={15} /></Button></div>;
}
