import { useCallback, useEffect, useState } from "react";
import { getEduProfile } from "./eduApi";

export function useEduProfile() {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setErrorText(null);
      const проф = await getEduProfile();
      setPoints(Number(проф?.points_total ?? 0));
    } catch (e: any) {
      setErrorText(e?.message ?? "Не вдалося завантажити профіль");
      setPoints(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { points, loading, errorText, refresh };
}
