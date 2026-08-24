import Layout from "@/components/layout/Layout";
import { getMasterDashboardStats } from "@/services/dashboard.service";
import DashboardContent from "./_components/DashboardContent";

export default async function MasterDashboardPage() {
  let stats = null;
  let error = "";

  try {
    stats = await getMasterDashboardStats();
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load dashboard data.";
  }

  return (
    <Layout>
      <DashboardContent stats={stats} error={error} />
    </Layout>
  );
}
