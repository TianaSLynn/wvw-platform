import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShoppingBag, Star, Gift } from "lucide-react";

export const metadata: Metadata = { title: "WVW Store" };

const ITEMS = [
  { name: "WVW Premium Polo", desc: "Navy embroidered polo shirt — professional and comfortable", category: "Apparel", points: 500, emoji: "👔" },
  { name: "Quarter-Zip Pullover", desc: "Soft fleece quarter-zip with embroidered WVW logo", category: "Apparel", points: 650, emoji: "🧥" },
  { name: "WVW Notebook Set", desc: "Premium hardcover notebooks with branded pen set", category: "Office", points: 150, emoji: "📓" },
  { name: "Insulated Travel Mug", desc: "24oz stainless steel travel mug with WVW branding", category: "Accessories", points: 120, emoji: "☕" },
  { name: "Backpack", desc: "Professional laptop backpack with WVW embroidery", category: "Accessories", points: 400, emoji: "🎒" },
  { name: "WVW Hat", desc: "Classic structured cap — navy with gold embroidery", category: "Apparel", points: 130, emoji: "🧢" },
  { name: "Gift Card — Restaurant", desc: "$50 dining experience gift card", category: "Rewards", points: 175, emoji: "🍽️" },
  { name: "Wellness Kit", desc: "Curated wellness items: essential oils, journal, relaxation tools", category: "Wellness", points: 250, emoji: "🌿" },
];

const CATEGORIES = ["All", "Apparel", "Accessories", "Office", "Wellness", "Rewards"];

const POINTS_PER_RECOGNITION = 50;

export default async function StorePage() {
  const user = await requireUser();

  const recognitionsReceived = await db.recognition.count({
    where: {
      orgId: user.orgId,
      toName: { contains: user.firstName, mode: "insensitive" },
    },
  });

  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const thisMonthCount = await db.recognition.count({
    where: {
      orgId: user.orgId,
      toName: { contains: user.firstName, mode: "insensitive" },
      createdAt: { gte: thisMonthStart },
    },
  });

  const pointsBalance = recognitionsReceived * POINTS_PER_RECOGNITION;
  const thisMonthPoints = thisMonthCount * POINTS_PER_RECOGNITION;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="WVW Store"
        subtitle="Redeem your recognition points for branded merchandise and rewards"
        icon={ShoppingBag}
        iconBg="bg-gold/10 border-gold/20"
        iconColor="text-gold"
      />

      {/* Points balance */}
      <div className="section-card p-5 bg-gradient-to-r from-gold/5 to-amber-500/5 border-gold/20 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
          <Star size={24} className="text-gold" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Your Points Balance</p>
          <p className="text-3xl font-bold gradient-text-gold">{pointsBalance.toLocaleString()} pts</p>
          <p className="text-xs text-muted-foreground">
            {recognitionsReceived > 0
              ? `${recognitionsReceived} recognition${recognitionsReceived !== 1 ? "s" : ""} received · ${POINTS_PER_RECOGNITION} pts each`
              : "Earn points by receiving recognition from teammates"}
          </p>
        </div>
        {thisMonthPoints > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">This month</p>
            <p className="text-xl font-bold text-foreground">+{thisMonthPoints} pts</p>
          </div>
        )}
      </div>

      {/* Category filters (static — filtering would need client component) */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <span
            key={cat}
            className={`text-xs px-3 py-1.5 rounded-full border ${cat === "All" ? "bg-navy-900 text-white border-navy-900" : "bg-muted text-muted-foreground border-border"}`}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {ITEMS.map((item) => {
          const canAfford = pointsBalance >= item.points;
          return (
            <div key={item.name} className="section-card p-4 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">{item.emoji}</div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.desc}</p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Points</p>
                  <p className={`text-lg font-bold ${canAfford ? "text-gold" : "text-muted-foreground"}`}>
                    {item.points.toLocaleString()}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.category}</span>
              </div>
              <button
                type="button"
                className={`w-full text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors ${canAfford ? "btn-gold" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                disabled={!canAfford}
              >
                <Gift size={12} />
                {canAfford ? "Redeem" : "Insufficient Points"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
