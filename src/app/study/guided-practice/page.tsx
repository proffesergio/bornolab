import {StudyPractice} from "@/components/study-practice";
import {SectionTitle} from "@/components/ui";
import Link from "next/link";
export const metadata={title:"Guided practice — BornoLab Study"};
export default function GuidedPractice(){return <div><Link href="/study" className="mb-4 inline-block text-sm text-cyan-700">← Study Hub</Link><SectionTitle kicker="Study / Guided practice" title="Step-by-step practice" desc="Follow a topic, revise with flashcards, then test what you remember."/><StudyPractice/></div>;}
