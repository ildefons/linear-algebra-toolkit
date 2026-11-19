import { type CalcRequest, type CalcResult, createActor } from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";

/** Run a linear algebra calculation through the backend canister. */
export function useCalculate() {
  const { actor } = useActor(createActor);
  return useMutation<CalcResult, Error, CalcRequest>({
    mutationFn: async (request: CalcRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.calculate(request);
    },
  });
}
