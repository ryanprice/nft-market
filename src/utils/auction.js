import axios from "axios";
import { ethers } from "ethers";
import moment from "moment";

import { zoomContractAddress, wmovrContractAddress } from "../constants";
import getCardData from "./getCardData";

/**
 *
 * @param {number} auctionId
 * @param marketContract
 * @param  zoombiesContract
 *
 * @returns Array of cards for an auction listing.
 */
export const getAuctionItem = async (
  auctionId,
  marketContract,
  zoombiesContract
) => {
  try {
    const item = await marketContract.getListItem(auctionId);
    console.log({ item });
    const { tokenIds, saleToken, highestBidder, seller } = item;
    const minPrice = ethers.utils.formatEther(item.minPrice);
    const highestBid = ethers.utils.formatEther(item.highestBid);

    const getCardPromise = tokenIds.map(async (token) => {
      const tokenId = token.toNumber();
      const cardData = getCardData(tokenId, zoombiesContract);
      return cardData;
    });

    const cards = await Promise.all(getCardPromise);

    const auctionEnd = item.auctionEnd.toString();
    const auctionEndDate = moment.unix(auctionEnd);

    let currency;
    if (saleToken === zoomContractAddress) {
      currency = "ZOOM";
    } else if (saleToken === wmovrContractAddress) {
      currency = "WMOVR";
    }

    return {
      id: auctionId,
      cards,
      auctionEnd: auctionEndDate,
      currency,
      minPrice,
      highestBid,
      highestBidder,
      seller,
      saleToken
    };
  } catch (err) {
    console.error(err);
  }
};

export const getAuctionListingsFromChain = async (marketContract, zoombiesContract) => {
  // TODO: filter events for all past listings
  const itemCount = await marketContract.itemCount();
  console.log({ itemCount });
  const listings = [];

  for (let i = 0; i < itemCount; i++) {
    const auctionItem = await getAuctionItem(
      i,
      marketContract,
      zoombiesContract
    );
    // filter out the settled auctions
    if (auctionItem.cards.length) {
      listings.push(auctionItem);
    }
  }

  return listings;
};

export const getAuctionListingsFromServer = async () => {
  // TODO: filter events for all past listings

  console.log("hello1")
  const resp = await axios.get('https://api.zoombies.world/listings')
  console.log("hello2")
  return resp
};
