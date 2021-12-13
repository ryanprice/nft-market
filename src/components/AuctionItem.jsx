import React, { useContext, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faClock } from '@fortawesome/free-regular-svg-icons';
import {
  faHeart as faHeartSolid,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import movrLogo from '../assets/movr_logo.png';
import zoomCoin from '../assets/zoombies_coin.svg';
import { Button, CircularProgress, Modal, styled, Grid } from '@mui/material';
import {
  cardImageBaseURL,
  marketContractAddress,
  wmovrContractAddress,
  zoomContractAddress,
} from '../constants';
import { useTheme } from 'styled-components';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { store } from '../store/store';
import { ethers } from 'ethers';
import OfferDialog from './OfferDialog';
import { useFetchBids } from 'hooks/useBids';
import { useNextMonthDisabled } from '@mui/lab/internal/pickers/hooks/date-helpers-hooks'

const Container = styled(Grid)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',

  background: '#5A5A5A',
  border: '1px solid #FFFFFF',
  boxSizing: 'border-box',
  borderRadius: '4px',
  flex: 'none',
  alignSelf: 'stretch',
  flexGrow: 0,
  margin: '24px 0px',
  // height: '296px',

  '& .meta-header-cards-tip': {
    fontSize: '14px',
    '& span': {
      padding: '0 4px 0 0 ',
    },
  },

  '& .meta-header-bids': {
    color: '#838383',
  },
});

const ModalContent = styled('div')({
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  background: 'white',
  borderRadius: '8px',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',

  '& > *': {
    margin: '5px 0',
  },
});

const MetaDiv = styled(Grid)(({ theme }) => ({
  backgroundColor: 'white',
  display: 'flex',
  flexDirection: 'column',
  padding: '8px',
  minHeight: '272px',
  width: '232px',

  '& .meta-content-coin-icon': {
    width: '24px',
    height: '24px',
  },
  [theme.breakpoints.down('sm')]: {
    width: '100%',
  },
}));

const MetaHeader = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  borderBottom: 'solid 1px #c4c4c4',

  '& .meta-header-left': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    '& .meta-header-title': {
      fontSize: '24px',
    },

    '& .meta-header-title:hover': {
      color: '#D400BD',
      cursor: 'pointer',
      textDecoration: 'underline',
    },
  },
  '& .meta-header-right': {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

const MetaContent = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

const CardImage = styled('img')({
  width: '177px',
  height: '270px',
});

const MetaContentBidAmount = styled('div')({
  display: 'flex',
  alignItems: 'center',
  fontSize: '24px',
  lineHeight: '1rem',
  margin: '6px 0 0 -4px',

  '& .meta-content-coin-text': {
    alignItems: 'flex-end',
    fontSize: '18px',
    padding: '6px 0 0 4px',
  },
});

const MetaContentRow = styled('div')({
  margin: '8px 0',
  display: 'flex',
  flexDirection: 'column',

  '& button': {
    fontFamily: 'Oswald',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: '18px',
    lineHeight: '27px',
    color: 'white',
    backgroundColor: '#D400BD',

    display: 'flex',
    alignItems: 'flex-end',
  },
});

const MetaContentTip = styled('div')({
  fontSize: '12px',
  lineHeight: '1rem',
  color: '#838383',
});

const MetaContentTime = styled('div')({
  display: 'flex',
  alignItems: 'center',
  lineHeight: '1rem',
  '& .meta-content-remaining-time': {
    margin: '0 0 0 4px',
  },
});

const MetaContentButtonSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',

  marginTop: 'auto',
  marginBottom: 0,
  justifyContent: 'end',

  '& button': {
    fontFamily: 'Oswald',
    fontStyle: 'normal',
    fontSize: '18px',
    lineHeight: '27px',
    color: 'white',

    display: 'flex',
    alignItems: 'flex-end',
    textTransform: 'capitalize',
    fontWeight: '400',
    justifyContent: 'flex-start',
  },

  '& .button-bid': {
    marginBottom: '2px',
    backgroundColor: '#D400BD',
    width: '100%',
    padding: '6px 8px',
  },

  '& .button-more-info': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#474747',
  },
});

const DetailCardsDiv = styled(Grid)(({ theme }) => ({
  flex: 1,
  margin: '0 12px',
  overflowX: 'auto',
}));

const CardsContainer = styled('div')(({ theme }) => ({
  flexGrow: '1',

  display: 'flex',
  minWidth: '177px',
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

const AuctionItem = ({ content }) => {
  const {
    state: { contracts, wallet, zoomIncrement, wmovrIncrement },
  } = useContext(store);
  const history = useHistory();
  const [favorite, setFavorite] = useState(false);
  const [remainingTime, setRemainingTime] = useState('');
  const [bidInProgress, setBidInProgress] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const theme = useTheme();

  const auctionItem = content;
  const { itemNumber, highestBid } = auctionItem;
  const coinType =
    auctionItem.saleToken === zoomContractAddress
      ? 'ZOOM'
      : auctionItem.saleToken === wmovrContractAddress
      ? 'WMOVR'
      : '';
  const minIncrement =
    auctionItem.saleToken === zoomContractAddress
      ? zoomIncrement
      : auctionItem.saleToken === wmovrContractAddress
      ? wmovrIncrement
      : 0;

  const {
    data
  } = useFetchBids(itemNumber);

  useEffect(() => {
    const updateRemainingTime = () => {
      const timeDiff = moment.unix(auctionItem.auctionEnd).diff(moment()) / 1000;
  
      const remainingDays = Math.floor(timeDiff / (3600 * 24));
      const remainingHours = Math.floor((timeDiff % (3600 * 24)) / 3600);
      const remainingMinutes = Math.floor((timeDiff % 3600) / 60);
      const remainingSeconds = Math.floor(timeDiff % 60);
  
      setRemainingTime(
        formatTwoPlace(remainingDays) +
          'd ' +
          formatTwoPlace(remainingHours) +
          'h ' +
          formatTwoPlace(remainingMinutes) +
          'm ' +
          formatTwoPlace(remainingSeconds) +
          's '
      );
    };

    const interval = setInterval(() => {
      updateRemainingTime();
    }, 1000);

    return () => clearInterval(interval)
  }, [auctionItem.auctionEnd])

  const formatTwoPlace = (value) => {
    if (value > 9) {
      return value;
    } else {
      return '0' + value;
    }
  };

  const handleConfirmBid = async (amount) => {
    const { itemNumber } = auctionItem;
    let { currency } = auctionItem;
    let currencyContract;

    if (currency === undefined) {
      currency = auctionItem.saleToken === zoomContractAddress ? "ZOOM" : (auctionItem.saleToken === wmovrContractAddress ? "WMOVR" : "");
    }
    if (
      parseFloat(amount) <
      Math.max(
        auctionItem?.highestBid + parseFloat(minIncrement),
        auctionItem?.minAmount + parseFloat(minIncrement)
      )
    ) {
      throw new Error(`Invalid amount valid : ${amount}`);
    }

    switch (currency) {
      case 'ZOOM':
        currencyContract = contracts.ZoomContract;
        break;
      case 'WMOVR':
        currencyContract = contracts.WMOVRContract;
        break;
      default:
        throw new Error(`Unhandled currency type: ${currency}`);
    }

    const weiAmount = ethers.utils.parseEther(amount.toString());

    const approveTx = await currencyContract.approve(
      marketContractAddress,
      weiAmount
    );
    setApprovalModalOpen(true);
    await approveTx.wait();
    setApprovalModalOpen(false);
    setBidInProgress(true);
    const bidTx = await contracts.MarketContract.bid(
      parseInt(itemNumber),
      weiAmount
    );
    await bidTx.wait();
    setBidInProgress(false);
    // getOffers();
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
  };

  const gotoAuction = () => {
    history.push(`/listing/${auctionItem.itemNumber}`);
  };

  return (
    <Container key={auctionItem._id} container>
      <MetaDiv>
        <MetaHeader>
          <div className={'meta-header-left'}>
            <div className={'meta-header-title'} onClick={gotoAuction}>
              Auction #{itemNumber}
            </div>
            {favorite ? (
              <FontAwesomeIcon
                icon={faHeartSolid}
                color={'rgba(255, 0, 0, 0.87)'}
                size="lg"
                onClick={toggleFavorite}
              />
            ) : (
              <FontAwesomeIcon
                icon={faHeart}
                color={'rgba(0, 0, 0, 0.87)'}
                size="lg"
                onClick={toggleFavorite}
              />
            )}
          </div>
          <div className={'meta-header-right'}>
            <div className={'meta-header-cards-tip'}>
              <span style={{ color: theme.colors.epic }}>
                {
                  auctionItem.cards.filter((card) => {
                    return card.rarity.toLowerCase() === 'epic';
                  }).length
                }
                E
              </span>
              <span style={{ color: theme.colors.rare }}>
                {
                  auctionItem.cards.filter((card) => {
                    return card.rarity.toLowerCase() === 'rare';
                  }).length
                }
                R
              </span>
              <span style={{ color: theme.colors.uncommon }}>
                {
                  auctionItem.cards.filter((card) => {
                    return card.rarity.toLowerCase() === 'uncommon';
                  }).length
                }
                U
              </span>
              <span style={{ color: theme.colors.common }}>
                {
                  auctionItem.cards.filter((card) => {
                    return card.rarity.toLowerCase() === 'common';
                  }).length
                }
                C
              </span>
            </div>
            <div className={'meta-header-bids'}>
              {data?.length > 0 ? data.length : 'No'} bids
            </div>
          </div>
        </MetaHeader>
        <MetaContent>
          <MetaContentRow>
            <MetaContentBidAmount>
              <img
                className={'meta-content-coin-icon'}
                src={coinType === 'ZOOM' ? zoomCoin : movrLogo}
                alt="WMOVR"
                loading="lazy"
              />
              <span>
                {Math.round(parseFloat(highestBid) * 10000) / 10000 + ' '}
              </span>
              <span className={'meta-content-coin-text'}>{coinType}</span>
            </MetaContentBidAmount>
            <MetaContentTip>Highest Bid</MetaContentTip>
          </MetaContentRow>
          <MetaContentRow>
            <MetaContentTime>
              <FontAwesomeIcon icon={faClock} size="lg" />
              <span className={'meta-content-remaining-time'}>
                {moment().isBefore(moment.unix(auctionItem.auctionEnd))
                  ? remainingTime
                  : moment
                      .unix(auctionItem.auctionEnd)
                      .format('MM/DD/YYYY, h:mm:ss A')}
              </span>
            </MetaContentTime>
            <MetaContentTip>Remaining time</MetaContentTip>
          </MetaContentRow>
          <MetaContentButtonSection>
            <OfferDialog
              currency={coinType}
              minAmount={
                Math.max(
                  parseFloat(auctionItem.highestBid),
                  parseFloat(auctionItem.minPrice)
                ) + parseFloat(minIncrement)
              }
              maxAmount={
                coinType === 'ZOOM'
                  ? parseFloat(wallet.zoomBalance)
                  : parseFloat(wallet.wmovrBalance)
              }
              onConfirm={handleConfirmBid}
              disabled={moment().isAfter(moment.unix(auctionItem.auctionEnd)) || bidInProgress || auctionItem.lister === wallet.address}
              mylisting={auctionItem.lister === wallet.address}
              quickBid
            />
            <Button className={'button-more-info'} onClick={gotoAuction}>
              More Info
              <FontAwesomeIcon icon={faChevronRight} size="sm" />
            </Button>
          </MetaContentButtonSection>
        </MetaContent>
      </MetaDiv>

      <DetailCardsDiv>
        <CardsContainer>
          {auctionItem?.cards ? (
            auctionItem.cards.map((card) => (
              <CardImage
                key={card.id}
                src={cardImageBaseURL + '/' + card.id}
                alt={'CARD ' + card.id}
                loading="lazy"
              />
            ))
          ) : (
            <CircularProgress />
          )}
        </CardsContainer>
        {/*{auctionItem.cards && <Pagination count={Math.ceil(auctionItem.cards.length / 20)} className={"pagination-bar"} variant="outlined" shape="rounded" onChange={handleCardsTablePageChanged}/>}*/}
      </DetailCardsDiv>

      <Modal
        open={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
      >
        <ModalContent>
          <div>Please wait for the Approval to complete.</div>
          <CircularProgress />
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AuctionItem;
