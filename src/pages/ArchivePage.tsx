import ArchiveScreen from "@/components/ArchiveScreen";
import { useNavigate } from "react-router-dom";

export default function ArchivePage() {
  const navigate = useNavigate();
  return <ArchiveScreen onBack={() => navigate("/record")} />;
}

