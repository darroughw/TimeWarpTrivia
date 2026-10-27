"use client";

import LivePlayFlow from "../_game/LivePlayFlow";
import MockPlayFlow from "../_game/MockPlayFlow";
import AmbientBackground from "@/components/phone/AmbientBackground";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import styles from "./page.module.scss";

export default function PlayPage() {
  return (
    <div className={styles.shell}>
      <div className={styles.frame}>
        <AmbientBackground />
        {isSupabaseConfigured ? <LivePlayFlow /> : <MockPlayFlow />}
      </div>
    </div>
  );
}
