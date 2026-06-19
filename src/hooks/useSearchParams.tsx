import { useRouter, useSearch } from "@tanstack/react-router";

function useSearchParams() {
  const searchParams = useSearch({ strict: false });
  const router = useRouter();

  const setSearchParams = (params: Record<string, unknown>) => {
    void router.navigate({
      to: ".",
      search: { ...searchParams, ...params },
    });
  };

  return [searchParams, setSearchParams] as const;
}

export { useSearchParams };
