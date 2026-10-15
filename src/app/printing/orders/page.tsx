import { requireMember } from "@/lib/guards";
import { redirect } from "next/navigation";
import { PrintOrders } from "@/components/printing/orders";
export const metadata = { title: "My Print Orders | BornoLab", robots: { index: false, follow: false } };
export default async function Page(){if(!await requireMember())redirect("/login?next=/printing/orders");return <PrintOrders/>;}
