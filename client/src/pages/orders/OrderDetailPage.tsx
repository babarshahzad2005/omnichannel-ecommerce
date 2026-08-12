import { useParams } from "react-router-dom";
import PlaceholderPage from "../../components/PlaceholderPage";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PlaceholderPage
      title="Order Tracking"
      description={`Live order updates and shipment tracking for order ${id ?? ""} coming soon.`}
    />
  );
}
