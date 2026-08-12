import { useParams } from "react-router-dom";
import PlaceholderPage from "../../components/PlaceholderPage";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <PlaceholderPage
      title="Product Detail"
      description={`Product ${id ?? ""} detail page with variants, reviews, and inventory state coming soon.`}
    />
  );
}
