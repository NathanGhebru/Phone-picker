import phones from "@/data/phones.json";
import plans from "@/data/plans.json";
import { VoiceMatchClient } from "./voice-match-client";

export default function Home() {
  const phoneNames = Object.fromEntries(phones.map((phone) => [phone.id, phone.name]));
  const planNames = Object.fromEntries(plans.map((plan) => [plan.id, plan.name]));

  return <VoiceMatchClient phoneNames={phoneNames} planNames={planNames} />;
}
