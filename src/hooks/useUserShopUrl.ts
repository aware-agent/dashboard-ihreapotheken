import { useMemo } from 'react';
import { useUserProfile } from './useUser';
import { useFacilities } from './useFacilities';
import { EXTERNAL_URLS } from '@/config/urls';

export const useUserShopUrl = () => {
  const { data: user, isLoading: isUserLoading, isError: isUserError } = useUserProfile();
  const preferredFacilityId = user?.preferredFacilityId ?? null;

  // Fetch all facilities and filter by preferredFacilityId (as code) client-side
  const { facility: matchedFacility, isLoading: isFacilitiesLoading, isError: isFacilitiesError } =
    useFacilities(preferredFacilityId);

  const isLoading = isUserLoading || isFacilitiesLoading;
  const isError = isUserError || isFacilitiesError;

  const url = useMemo(() => {
    const language = user?.language ?? null;


    if (!isError && language && matchedFacility) {
      const url = new URL(`${EXTERNAL_URLS.SHOP}/${language.toLowerCase()}/shop/${matchedFacility.facilityCode}`);
      return url;
    }
    else {
      return new URL(`${EXTERNAL_URLS.SHOP}/shop/`);
    }
  }, [user?.language, user?.preferredFacilityId, matchedFacility, isError]);

  return {
    url,
    isLoading,
  };
};
