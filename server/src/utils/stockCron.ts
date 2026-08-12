import cron from "node-cron";
import { releaseExpiredReservations } from "../services/inventory.service";

export const startCronJobs = (): void => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const releasedCount = await releaseExpiredReservations();

      if (releasedCount > 0) {
        console.log(`  Released ${releasedCount} expired stock reservation(s)`);
      }
    } catch (err) {
      console.error("Stock reservation cron job failed:", err);
    }
  });

  console.log("  Stock reservation cron job scheduled (every 15 minutes)");
};
