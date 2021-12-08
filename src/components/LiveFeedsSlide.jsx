import * as React from 'react';
import { forwardRef, useState } from 'react';
import LiveFeedItem from './LiveFeedItem';
import { styled } from '@mui/material';
import Button from '@mui/material/Button';
import { TransitionGroup } from 'react-transition-group';
import Collapse from '@mui/material/Collapse';
import moment from 'moment';
import PubSub from 'pubsub-js';
import { EVENT_TYPES, QUERY_KEYS } from '../constants';
import { useFetchLiveFeeds } from '../hooks/useLiveFeeds';
import { useQueryClient } from 'react-query';

const Container = styled('div')(({ theme }) => ({
  zIndex: 1,
  margin: '12px 12px 12px 0px',
  padding: '16px',
  width: '392px',
  overflowY: 'auto',
  border: '1px solid #FFFFFF',
  borderRadius: '5px',

  background: 'linear-gradient(110.99deg, #000033 100%, #100238 100%)',

  [theme.breakpoints.down('md')]: {
    borderRadius: '0px',
    margin: '0 0 0 -12px',
  },
}));

const FlexDiv = styled('div')({
  display: 'flex',
  justifyContent: 'flex-end',
});

const FilterBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  flex: 'auto',

  '& .filter-label': {
    color: 'white',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
}));

const FilterItemText = styled('div')(({ color, selected, splitter }) => ({
  color: color ? color : 'white',
  textDecoration: selected ? 'underline' : '',
  padding: '0 8px',
  borderRight: splitter === 'true' ? '1px solid white' : '',
  lineHeight: splitter === 'true' ? '20px' : '',

  '&:hover': {
    cursor: 'pointer',
  },
}));

const StyledButton = styled(Button)({
  fontWeight: 'bold',
  color: 'white',
  fontFamily: 'Oswald',
});

const CloseButton = styled(Button)(({ theme }) => ({
  display: 'none',
  fontWeight: 'bold',
  color: 'white',
  fontFamily: 'Oswald',

  [theme.breakpoints.down('md')]: {
    display: 'flex',
  },
}));

const LiveFeedsSlide = (props, ref) => {
  const [filters, setFilters] = useState({
    my: true,
    general: true,
  });
  const { hidelivefeeds } = props;
  const queryClient = useQueryClient();

  const clearAll = () => {
    // dispatch(Actions.resetNotifications(true))
    queryClient.setQueryData(
      [QUERY_KEYS.liveFeeds, { filterKey: 'MyAlerts' }],
      []
    );
    queryClient.setQueryData(
      [QUERY_KEYS.liveFeeds, { filterKey: 'General' }],
      []
    );
    queryClient.setQueryData(
      [QUERY_KEYS.liveFeeds, { filterKey: 'newMyAlerts' }],
      0
    );
    queryClient.setQueryData(
      [QUERY_KEYS.liveFeeds, { filterKey: 'newGeneral' }],
      0
    );
  };

  const toggleFilter = (key) => {
    setFilters({
      ...filters,
      [key]: !filters[key],
    });
  };
  
  const { data: generalAlerts } = useFetchLiveFeeds('General');
  const { data: myAlerts } = useFetchLiveFeeds('MyAlerts');
  const { data: newMyAlerts } = useFetchLiveFeeds('newMyAlerts');
  const { data: newGeneral } = useFetchLiveFeeds('newGeneral');

  return (
    <Container ref={ref}>
      <FlexDiv>
        <FilterBar>
          <FilterItemText className={'filter-label'}>
            VIEW:
          </FilterItemText>
          <FilterItemText
            selected={filters.my}
            splitter={'true'}
            color={'#41f7f8'}
            onClick={() => toggleFilter('my')}
          >
            My Alerts
          </FilterItemText>
          <FilterItemText
            selected={filters.general}
            color={'#ff59e8'}
            onClick={() => toggleFilter('general')}
          >
            General Alerts
          </FilterItemText>
        </FilterBar>

        <StyledButton onClick={clearAll}>Clear All</StyledButton>
        {hidelivefeeds && (
          <CloseButton onClick={hidelivefeeds}>Close</CloseButton>
        )}
      </FlexDiv>
      {filters.my && myAlerts && (
        <TransitionGroup>
          {myAlerts.map((event, index) => (
            <Collapse key={myAlerts.length - index}>
              <LiveFeedItem
                type={event.type}
                content={event.content}
                timestamp={event.timestamp}
                highlight={index < newMyAlerts ? 'true' : 'false'}
              />
            </Collapse>
          ))}
        </TransitionGroup>
      )}

      {filters.general && generalAlerts && (
        <TransitionGroup>
          {generalAlerts.map((event, index) => (
            <Collapse key={generalAlerts.length - index}>
              <LiveFeedItem
                type={event.type}
                content={event.content}
                timestamp={event.timestamp}
                highlight={index < newGeneral ? 'true' : 'false'}
              />
            </Collapse>
          ))}
        </TransitionGroup>
      )}
    </Container>
  );
};

export default forwardRef(LiveFeedsSlide);
