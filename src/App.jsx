import DialogSource from '@mui/material/Dialog';
import useBlockchain from './hooks/useBlockchain';
import zoombiesLogo from './assets/zoombies_head.svg';
import liveFeedIcon from './assets/live-feed.png';
import React, { useContext, useEffect, useState } from 'react';
import Navbar from 'components/Navbar';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Home from 'pages/Home';
import NewListing from 'pages/NewListing';
import ViewListing from 'pages/ViewListing';
import { Button, Drawer, Slide } from '@mui/material';
import LiveFeedsSlide from './components/LiveFeedsSlide';
import { styled, useMediaQuery } from '@mui/material';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

import HelpPage from './pages/Help';
import Profile from 'pages/Profile';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NotificationAddon from './components/NotificationAddon';
import AuctionArchive from 'pages/AuctionArchive';
import watchMarketEvents from 'utils/setupWatcher';
import PubSub from 'pubsub-js';
import { useQueryClient } from 'react-query';
import { v4 as uuidv4 } from 'uuid';
import {
  EVENT_TYPES,
  marketContractAddress,
  QUERY_KEYS,
  wmovrContractAddress,
  zoomContractAddress,
} from './constants';
import { ethers } from 'ethers';
import moment from 'moment';
import { useFetchLiveFeeds } from './hooks/useLiveFeeds';
import { useFetchProfileQuery } from './hooks/useProfile';
import { store } from 'store/store';

const Container = styled('div')({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const Dialog = styled(DialogSource)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  maxWidth: '500px',
});

const Logo = styled('img')({
  width: '40px',
  height: '40px',
});

const Header = styled('div')({
  height: '75px',
  background: '#301748',
  display: 'flex',
  alignItems: 'center',

  fontWeight: '500',
  fontSize: '16px',
  color: 'white',

  '& img': {
    width: '60px',
    margin: '0 10px',
  },

  '& .btn-livefeed': {
    width: '48px',
    height: '48px',
    marginLeft: 'auto',
    marginRight: '32px',
  },
});

const Footer = styled('div')({
  height: '0px',
});

const Body = styled('div')({
  flex: 1,
  display: 'flex',
  minHeight: 0,
  background: 'linear-gradient(110.99deg, #000033 0%, #100238 100%)',
  position: 'relative',

  '& .permanent-drawer': {
    position: 'relative',
  },
});

const Content = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,

  padding: '16px 8px 16px 16px',
  display: 'flex',
  background: 'linear-gradient(110.99deg, #000033 0%, #100238 100%)',

  [theme.breakpoints.down('md')]: {
    padding: '8px',
  },
}));

const HamburgerMenuButton = styled('div')(() => ({
  position: 'relative',
  display: 'flex',
  flex: 'auto',
  justifyContent: 'flex-end',
  padding: '16px',
}));

const NavbarContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '100%',
}));

const App = () => {
  const {
    selectors: { isApprovalModalOpen },
    actions: { setIsApprovalModalOpen },
  } = useBlockchain();

  const isDesktop = useMediaQuery('(min-width:1024px)');
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const queryClient = useQueryClient();

  // const showSlider = () => {
  //   if (checked) {
  //     // dispatch (Actions.resetNotifications(false))
  //     queryClient.setQueryData([QUERY_KEYS.liveFeeds, { filterKey: "newMyAlerts" }], 0)
  //     queryClient.setQueryData([QUERY_KEYS.liveFeeds, { filterKey: "newGeneral" }], 0)
  //   }
  //   setChecked(!checked)
  //   if (!isDesktop) {
  //     setShowMenu(false)
  //   }
  // };

  // const hideNavbar = () => {

  //   if (!isDesktop) {
  //     setShowMenu(false)
  //     setChecked(false)
  //   }
  // }

  const { state } = useContext(store);
  const {
    wallet: { address },
    contracts: { MarketContract },
  } = state;

  const { isLoading, data: myAuctions } = useFetchProfileQuery(address);

  const addLiveFeedItem = (liveFeedItem, filterKey) => {
    const liveFeeds = queryClient.getQueryData([
      QUERY_KEYS.liveFeeds,
      { filterKey },
    ]);
    const uuid = uuidv4();

    const newItem = {
      _id: uuid,
      type: liveFeedItem.type,
      timestamp: Date.now() / 1000,
      content: {
        blockNumber: uuid, //should be removed when settle eventscraper is completed
        currency:
          liveFeedItem.saleToken === zoomContractAddress
            ? 'ZOOM'
            : liveFeedItem.saleToken === wmovrContractAddress
            ? 'WMOVR'
            : '',
        ...liveFeedItem,
      },
    };

    if (liveFeeds) {
      queryClient.setQueryData(
        [QUERY_KEYS.liveFeeds, { filterKey }],
        [newItem, ...liveFeeds]
      );
    } else {
      queryClient.setQueryData(
        [QUERY_KEYS.liveFeeds, { filterKey }],
        [newItem]
      );
    }

    const newCount = queryClient.getQueryData([
      QUERY_KEYS.liveFeeds,
      { filterKey: 'new' + filterKey },
    ]);
    queryClient.setQueryData(
      [QUERY_KEYS.liveFeeds, { filterKey: 'new' + filterKey }],
      typeof newCount === 'string' ? parseInt(newCount) + 1 : newCount + 1
    );
  };

  const getBidType = (liveFeedItem) => {
    const condition = (bid) => {
      return bid.itemNumber === liveFeedItem.itemNumber;
    };

    if (myAuctions.bids.some(condition)) {
      return 'myoutbid';
    }
    if (liveFeedItem.bidder === address) {
      return 'mybid';
    }
    if (myAuctions.listings.some(condition)) {
      return 'mybidon';
    }
    return 'bid';
  };

  const getSettleType = (liveFeedItem) => {
    const condition = (item) => {
      return item.itemNumber === liveFeedItem.itemNumber;
    };

    if (myAuctions.bids.some(condition)) {
      return 'settlemybid';
    }
    if (liveFeedItem.winner === address) {
      return 'win';
    }
    if (
      myAuctions.listings.some(condition) ||
      liveFeedItem.seller === address
    ) {
      return 'sold';
    }
    return 'settle';
  };

  useEffect(() => {
    setIsMobileDrawerOpen(isDesktop);
    const tokenNewAuction = PubSub.subscribe(
      EVENT_TYPES.ItemListed,
      (msg, data) => {
        const newAuction = data;
        let filterKey = '';

        if (newAuction.lister === address) {
          filterKey = 'MyAlerts';
          newAuction['type'] = 'mynew';
        } else {
          filterKey = 'General';
          newAuction['type'] = 'new';
        }

        addLiveFeedItem(newAuction, filterKey);
      }
    );

    const tokenBid = PubSub.subscribe(EVENT_TYPES.Bid, async (msg, data) => {
      const bid = data;
      let filterKey = '';

      const bidType = getBidType(bid);

      console.log('bidType', bidType);
      let listingItem = myAuctions.listings.find(
        (listing) => listing.itemNumber === bid.itemNumber
      );
      if (listingItem === undefined) {
        listingItem = await MarketContract.getListItem(bid.itemNumber);
      }

      bid['type'] = bidType;
      bid['saleToken'] = listingItem.saleToken;
      if (bidType === 'bid') {
        filterKey = 'General';
      } else {
        filterKey = 'MyAlerts';
      }
      addLiveFeedItem(bid, filterKey);
    });

    const tokenSettled = PubSub.subscribe(EVENT_TYPES.Settled, async (msg, data) => {
      const settleData = data
      let filterKey = ""

      const settleType = getSettleType(settleData)

      console.log("settleType", settleType)
      let listingItem = myAuctions.listings.find( ( listing ) => listing.itemNumber === settleData.itemNumber)
      if (listingItem === undefined) {
        listingItem = await MarketContract.getListItem(settleData.itemNumber)
      }

      settleData["type"] = settleType
      settleData["saleToken"] = listingItem.saleToken
      if (settleType === "settle") {
        filterKey = "General"
      } else {
        filterKey = "MyAlerts"
      }
      addLiveFeedItem(settleData, filterKey)
    })

    return () => {
      PubSub.unsubscribe(tokenNewAuction);
      PubSub.unsubscribe(tokenBid);
      PubSub.unsubscribe(tokenSettled);
    };
  }, [queryClient, isDesktop, address, myAuctions, MarketContract]);

  // const toggleMenu = () => {
  //   setShowMenu(!showMenu)
  // }

  // const NotificationButtonComponent = () => {
  //   return (
  //     <NotificationButton>
  //       <Button onClick={showSlider} className={'btn-livefeed'}><img src={liveFeedIcon} alt={"Live Feed"}/>
  //       <NotificationAddon clickAction={showSlider}/>
  //       </Button>
  //     </NotificationButton>
  //   )
  // }

  // const ToggleMenu = () => {
  const LiveFeedButton = () => {
    return (
      <Button
        onClick={() => setIsLiveFeedOpen((prevState) => !prevState)}
        className={'btn-livefeed'}
      >
        <img src={liveFeedIcon} alt={'Live Feed'} />
        <NotificationAddon onClick={() => setIsLiveFeedOpen((prevState) => !prevState)}/>
      </Button>
    );
  };

  const MobileHamburgerMenu = () => {
    return (
      <HamburgerMenuButton>
        {isMobileDrawerOpen ? (
          <>
            <FontAwesomeIcon
              icon={faTimes}
              size="lg"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <NotificationAddon onClick={() => setIsMobileDrawerOpen(false)}/>
          </>
        ) : (
          <>
            <FontAwesomeIcon
              icon={faBars}
              size="lg"
              onClick={() => setIsMobileDrawerOpen(true)}
            />
            <NotificationAddon onClick={() => setIsMobileDrawerOpen(true)}/>
          </>

        )}
        <NotificationAddon/>
      </HamburgerMenuButton>
    );
  };

  return (
    <Container>
      <Router>
        <Header>
          <img src={zoombiesLogo} alt={'ZOOM'} />
          <h1>Zoombies Market</h1>
          {isDesktop ? <LiveFeedButton /> : <MobileHamburgerMenu />}
        </Header>
        <Body>
          {/* {
            showMenu && (
              <Slide direction="right" in={showMenu} mountOnEnter unmountOnExit>
                <NavbarContainer>
                  <Navbar togglelivefeeds={() => showSlider()} hidenavbar={() => hideNavbar()}/>
                </NavbarContainer>
              </Slide>
            )
          } */}

          <Drawer
            classes={{
              paper: 'permanent-drawer',
            }}
            open={isMobileDrawerOpen}
            variant={isDesktop ? 'permanent' : 'temporary'}
            onClose={() => setIsMobileDrawerOpen(false)}
          >
            <NavbarContainer>
              <Navbar
                toggleLiveFeeds={() => setIsLiveFeedOpen(true)}
                hideNavbar={() => setIsMobileDrawerOpen(false)}
              />
            </NavbarContainer>
          </Drawer>
          <Content>
            <Switch>
              <Route path="/new" component={NewListing} />
              <Route path="/listing/:id" component={ViewListing} />
              <Route path="/help" component={HelpPage} />
              <Route path="/profile" component={Profile} />
              <Route path="/archives" component={AuctionArchive} />
              <Route path="/" component={Home} />
            </Switch>
          </Content>
          {isLiveFeedOpen && (
            <Slide
              direction="left"
              in={isLiveFeedOpen}
              mountOnEnter
              unmountOnExit
            >
              <LiveFeedsSlide hidelivefeeds={() => setIsLiveFeedOpen(false)} />
            </Slide>
          )}
          {/* <Drawer
            anchor="right"
            open={isLiveFeedOpen}
            onClose={() => setIsLiveFeedOpen(false)}
          >
            <LiveFeedsSlide hideLiveFeeds={() => setIsLiveFeedOpen(false)} />
          </Drawer> */}
        </Body>
        <Footer />
        <Dialog
          open={isApprovalModalOpen}
          onClose={() => setIsApprovalModalOpen(false)}
        >
          <Logo
            src={'https://cryptoz.cards/assets/cryptokeeper_logo_binance.png'}
          />
        </Dialog>
      </Router>
    </Container>
  );
};

export default App;
