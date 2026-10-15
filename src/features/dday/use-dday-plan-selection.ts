import { useEffect, useState } from 'react';

import { readDdayPlanSelection, writeDdayPlanSelection } from './dday-plan-selection-store';

export function useDdayPlanSelection(scope: string | null) {
  const [selection, setSelection] = useState<{
    scope: string | null;
    id: number | null;
    ready: boolean;
  }>({ scope: null, id: null, ready: false });

  useEffect(() => {
    if (scope === null) return;
    let active = true;
    void readDdayPlanSelection(scope)
      .catch(() => null)
      .then((id) => {
        if (!active) return;
        // A user selection made while storage was loading takes precedence.
        setSelection((current) =>
          current.scope === scope && current.ready ? current : { scope, id, ready: true },
        );
      });
    return () => {
      active = false;
    };
  }, [scope]);

  const selectGoal = (id: number | null) => {
    setSelection({ scope, id, ready: true });
    if (scope !== null) void writeDdayPlanSelection(scope, id).catch(() => undefined);
  };

  return {
    selectedId: selection.scope === scope ? selection.id : null,
    isRestoring: scope !== null && (selection.scope !== scope || !selection.ready),
    selectGoal,
  };
}
