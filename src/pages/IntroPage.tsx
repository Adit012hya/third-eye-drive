import IntroScreen from "@/components/IntroScreen";
import { useNavigate } from "react-router-dom";

export default function IntroPage() {
  const navigate = useNavigate();
  return <IntroScreen onComplete={() => navigate("/record")} />;
}

