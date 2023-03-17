// share/hooks/useFetchWithLoading.ts
import { useCallback, useRef, useState } from "react";

import { FetchingState, FetchFun } from "./types";

/**
 * @param fetchFun
 * @returns {[FetchFun<T>, isLoadingInProgress, isLoaded]}
 */
const useFetchWithLoading = <T = unknown>(fetchFun: FetchFun<T>): [FetchFun<T>, ...FetchingState] => {
  const [isLoading, setIsLoading] = useState(false);
  const isLoadedRef = useRef(false);

  const fetchWithLoading = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchFun();
    isLoadedRef.current = true;
    setIsLoading(false);

    return res;
  }, [fetchFun]);

  return [fetchWithLoading, isLoading, isLoadedRef.current];
};

export default useFetchWithLoading;
