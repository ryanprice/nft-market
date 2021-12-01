import { useQuery } from 'react-query';
import axios from 'axios';
import { ethers } from 'ethers';
import { apiEndpoint, QUERY_KEYS } from '../constants';

const getUserProfiles = async (userAddress) => {
  if (!ethers.utils.isAddress(userAddress)) {
    console.error('Address is invalid.');
    return null;
  }

  const response = await axios.get(`${apiEndpoint}/profile/${userAddress}`);

  if (response.status !== 200) {
    console.error(response.statusText);
    throw new Error('Failed to get profile.');
  }

  return response.data;
};

export const useFetchProfileQuery = (userAddress) =>
  useQuery({
    queryKey: [QUERY_KEYS.profile, { userAddress }],
    queryFn: () => getUserProfiles(userAddress),
    ...{
      refetchOnWindowFocus: false,
    },
  });
