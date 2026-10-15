import { useEffect, useState } from 'react';

import type { DdayGoalResponse } from '@/types';

import { readDdayGoalOrder, writeDdayGoalOrder } from './dday-goal-order-store';

export function applyDdayGoalOrder(goals: DdayGoalResponse[], ids: number[]) {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return [...goals].sort(
    (left, right) =>
      (positions.get(left.id) ?? ids.length) - (positions.get(right.id) ?? ids.length),
  );
}

export function useDdayGoalOrder(scope: string) {
  const [ids, setIds] = useState<number[]>([]);
  const [isRestoring, setIsRestoring] = useState(true);
  useEffect(() => {
    let active = true;
    void readDdayGoalOrder(scope)
      .catch(() => [])
      .then((savedIds) => {
        if (!active) return;
        setIds(savedIds);
        setIsRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [scope]);

  const save = async (nextIds: number[]) => {
    await writeDdayGoalOrder(scope, nextIds);
    setIds([...nextIds]);
  };
  return { ids, isRestoring, save };
}
