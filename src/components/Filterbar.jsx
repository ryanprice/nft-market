import React, {useState} from "react";
import { styled } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import SearchIcon from '@mui/icons-material/Search';
import {alpha, Button, ButtonGroup, Select} from "@mui/material";
import { wmovrContractAddress, zoomContractAddress } from '../constants'

const Container = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column'
}))

const FilterRow = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  margin: '12px 0',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  color: 'white',

  '& .button-rarity': {
    color: 'white'
  }
}));

const FilterControls = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
}))

const SortControls = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  margin: '0 16px',
  flexWrap: 'wrap',
  alignItems: 'center',
  fontSize: '18px',

  '& .button-sortby-addon': {
    width: '30px'
  },

  '& .sort-component': {
    borderRight: '2px solid white',
    padding: '0 8px',
    lineHeight: '18px',

},

  '& .sort-component-selected': {
    borderRight: '2px solid white',
    textDecoration: 'underline',
    padding: '0px 8px',
    lineHeight: '18px',
  },

  '& .sort-component:hover': {
    textDecoration: 'underline',
    cursor: 'pointer'
  },

  '& .last-column': {
    borderRight: 'none! important'
  },
}))

const SearchHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',

  '& .live-header': {
    color: 'white',
    fontWeight: 500,
    fontSize: '32px',
    lineHeight: '47px',

    '& span': {
      fontWeight: 300
    }
  },
}))

const StyledSelect = styled(Select)(({ theme }) => ({
  marginRight: '12px',
  color: 'white',
  border: 'none',
  fontFamily: 'Oswald',
  fontSize: '18px',
  '& svg': {
    fill: 'white',
  },
}));

const Search = styled('div')(({ theme }) => ({
  display: 'flex',
  position: 'relative',
  color: 'white',
  borderRadius: theme.shape.borderRadius,
  border: '1px solid white',
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  fontFamily: 'Oswald',
  '& .MuiInputBase-input': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',

    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

const Filterbar = ( { onFilterChanged, filters, onSortByChanged, sortBy, totalCount }) => {

  const [sortField, setSortField] = useState('');

  const sortColumnSelected = ( sortField ) => {
    setSortField(sortField)
    onSortByChanged({
      field: sortField
    })
  }

  return (
    <Container >
      <SearchHeader>
        <div className={'live-header'}>
          Live Now - <span>{totalCount ? totalCount + " items" : 'No auctions'}</span>
        </div>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search"
            inputProps={{ 'aria-label': 'search' }}
            onChange={(e) => onFilterChanged({ keyword: e.target.value })}
          />
        </Search>
      </SearchHeader>


      <FilterRow>
        <FilterControls>
          <StyledSelect
            value={filters.token}
            onChange={(e) => onFilterChanged({token: e.target.value}) }
            displayEmpty
          >
            <MenuItem value={''}>Coin Type</MenuItem>
            <MenuItem value={wmovrContractAddress}>WMOVR</MenuItem>
            <MenuItem value={zoomContractAddress}>ZOOM</MenuItem>
          </StyledSelect>

          <StyledSelect
            value={filters.rarity}
            onChange={(e) => onFilterChanged({ rarity: e.target.value })}
            displayEmpty
          >
            <MenuItem value={''}>Rarity</MenuItem>
            <MenuItem value={'Epic'}>Epic</MenuItem>
            <MenuItem value={'Rare'}>Rare</MenuItem>
            <MenuItem value={'Uncommon'}>Uncommon</MenuItem>
            <MenuItem value={'Common'}>Common</MenuItem>
          </StyledSelect>

          <StyledSelect
            value={filters.cardType}
            onChange={(e) => onFilterChanged({ cardType: e.target.value })}
            displayEmpty
          >
            <MenuItem value={''}>Card Type</MenuItem>
            <MenuItem value={'Store'}>Store</MenuItem>
            <MenuItem value={'Booster'}>Booster</MenuItem>
          </StyledSelect>
        </FilterControls>

        <SortControls>
          <div>Sort:</div>
          <div className={ sortField === 'auctionEnd' ? 'sort-component-selected' : 'sort-component' } onClick={() => sortColumnSelected('auctionEnd')}>Ending Soon</div>
          <div className={ sortField === 'posted' ? 'sort-component-selected' : 'sort-component' } onClick={() => sortColumnSelected('posted')}>Just Posted</div>
          <div className={ sortField === 'popularity' ? 'sort-component-selected last-column' : 'sort-component last-column' } onClick={() => sortColumnSelected('popularity')}>Popular</div>
        </SortControls>
      </FilterRow>
    </Container>
  );
};

export default Filterbar;
