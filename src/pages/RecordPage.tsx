import RecordingScreen from "@/components/RecordingScreen";
import { useNavigate } from "react-router-dom";

export default function RecordPage() {
  const navigate = useNavigate();
  return <RecordingScreen onOpenArchive={() => navigate("/archive")} />;
}

