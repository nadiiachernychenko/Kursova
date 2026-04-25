import { useCallback, useState } from "react";
import { getEduProfile } from "./eduApi";

export function useEduProfile() {
  const [points, setPoints] = useState(0);
  const [expertUnlocked, setExpertUnlocked] = useState(false);
  const [expertLevel, setExpertLevel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getEduProfile();
      setPoints(Number(data.points_total ?? 0));
      setExpertUnlocked(!!data.expert_unlocked);
      setExpertLevel(Number(data.expert_level ?? 0));
      setErrorText(null);
    } catch (e: any) {
      setErrorText(e?.message ?? "Помилка");
    } finally {
      setLoading(false);
    }
  }, []);

  return { points, expertUnlocked, expertLevel, loading, errorText, refresh };
}