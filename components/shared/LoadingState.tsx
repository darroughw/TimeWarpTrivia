import ScanlineOverlay from "@/components/tv/ScanlineOverlay";
import styles from "./LoadingState.module.scss";

interface LoadingStateProps {
  message: string;
}

/** Brief in-between state — creating/joining a room before real data arrives. */
export default function LoadingState({ message }: LoadingStateProps) {
  return (
    <div className={styles.screen}>
      <ScanlineOverlay />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
