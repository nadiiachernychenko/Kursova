import { useEffect, useState } from "react";
import { getShopItems } from "./eduApi";

export function useShop() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getShopItems();
        setItems(list);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { items, loading };
}