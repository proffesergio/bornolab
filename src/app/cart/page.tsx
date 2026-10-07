"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Lock } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { CheckoutModal } from "@/components/checkout-modal";
import { useLogin } from "@/components/use-login";
import { clearCart, removeFromCart, useCart } from "@/lib/cart";

/** Cart: persisted picks → single combined manual order (bKash Send Money). */
export default function CartPage() {
  const { items, total } = useCart();
  const { loggedIn } = useLogin();
  const [checkout, setCheckout] = useState(false);

  return (
    <div>
      <SectionTitle
        kicker="Cart"
        title="Your cart"
        desc="Bundle fonts & software into one manual order — pay once via bKash Send Money."
      />
      {items.length === 0 ? (
        <GlassCard className="mt-4 p-10 text-center">
          <ShoppingCart size={28} className="mx-auto text-slate-400" />
          <p className="mt-2 font-extrabold">Your cart is empty</p>
          <p className="mt-1 text-sm text-slate-500">Add premium fonts or software to check out together.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/fonts" className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white">Browse fonts</Link>
            <Link href="/software" className="glass hover-glow rounded-full px-5 py-2.5 text-sm font-bold">Browse software</Link>
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {items.map((i) => (
              <div key={i.key} className="glass flex items-center justify-between gap-2 rounded-2xl p-4">
                <span className="min-w-0">
                  <b className="block truncate">{i.itemName}</b>
                  <span className="text-[11.5px] uppercase text-slate-500">{i.itemType} • ৳{i.amountBDT}</span>
                </span>
                <button
                  onClick={() => removeFromCart(i.key)}
                  aria-label={`Remove ${i.itemName}`}
                  className="rounded-full p-2 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <GlassCard className="mt-3 flex flex-wrap items-center justify-between gap-3 p-5">
            <span>
              <span className="block text-[12px] font-bold uppercase tracking-wider text-slate-500">Total (manual payment)</span>
              <span className="text-3xl font-black">৳{total}</span>
            </span>
            <span className="flex gap-2">
              <button onClick={clearCart} className="glass hover-glow rounded-full px-4 py-2.5 text-[13px] font-bold">Clear</button>
              <button
                onClick={() => setCheckout(true)}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:brightness-110"
              >
                {loggedIn === false && <Lock size={14} />} Checkout • ৳{total}
              </button>
            </span>
          </GlassCard>
          {checkout && (
            <CheckoutModal
              open
              onClose={() => setCheckout(false)}
              itemType="font"
              itemId="cart"
              itemName={`${items.length} items`}
              amountBDT={total}
              items={items}
              onOrdered={clearCart}
            />
          )}
        </>
      )}
    </div>
  );
}
