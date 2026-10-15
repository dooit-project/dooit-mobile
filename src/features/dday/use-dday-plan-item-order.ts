import { useEffect, useState } from 'react';

import type { DdayPlanItem } from './dday-plan-items';
import { readDdayPlanItemOrder, writeDdayPlanItemOrder } from './dday-plan-item-order-store';

export function applyDdayPlanItemOrder(items: DdayPlanItem[], keys: string[]) {
  const positions = new Map(keys.map((key, index) => [key, index]));
  return [...items].sort(
    (left, right) =>
      (positions.get(left.key) ?? keys.length) - (positions.get(right.key) ?? keys.length),
  );
}

export function useDdayPlanItemOrder(scope: string, goalId: number) {
  const [keys, setKeys] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(true);
  useEffect(() => {
    let active = true;
    void readDdayPlanItemOrder(scope, goalId)
      .catch(() => [])
      .then((savedKeys) => {
        if (!active) return;
        setKeys(savedKeys);
        setIsRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [scope, goalId]);
  const save = async (nextKeys: string[]) => {
    await writeDdayPlanItemOrder(scope, goalId, nextKeys);
    setKeys([...nextKeys]);
  };
  return { keys, isRestoring, save };
}
