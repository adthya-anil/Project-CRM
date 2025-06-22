import * as React from 'react';
import { supabase } from '../../supabaseClient'; 
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';



export default function DropDown({ id, value, table, option,column }) {
    const options = option;
    
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  
  // Initialize with the value prop if available, otherwise null (loading state)
  const [selectedIndex, setSelectedIndex] = React.useState(() => {
    if (value && typeof value === 'string') {
      const index = options.findIndex(opt => opt.toLowerCase() === value.toLowerCase());
      return index !== -1 ? index : null;
    }
    return null;
  });

  // Only fetch from database if we don't have a value prop
  React.useEffect(() => {
    // If we already have a value from props, don't fetch
    if (value && typeof value === 'string') {
      const index = options.findIndex(opt => opt.toLowerCase() === value.toLowerCase());
      setSelectedIndex(index !== -1 ? index : 1);
      return;
    }

    // Only fetch if no value provided
    const fetchColumn = async () => {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching temperature:', error.message);
        setSelectedIndex(1); // Default to Warm on error
        return;
      }

      const index = options.findIndex((opt) => opt.toLowerCase() === ((data && data[column]) || '').toLowerCase());
      setSelectedIndex(index !== -1 ? index : 1);
    };

    fetchColumn();
  }, [id, table, value,column]);

  const handleClick = async (value = options[selectedIndex]) => {
    const { error } = await supabase
      .from(table)
      .update({ [column]: value })
      .eq('id', id);

    if (error) {
      console.error('Error updating temperature:', error.message);
    } else {
      console.log(`Updated lead ${id} to temperature: ${value}`);
    }
  };

  const handleMenuItemClick = (event, index) => {
    const selectedValue = options[index];
    setSelectedIndex(index);
    setOpen(false);
    handleClick(selectedValue);
  };

  const handleToggle = () => setOpen((prevOpen) => !prevOpen);
  
  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  // Show loading state until we have a valid selectedIndex
  if (selectedIndex === null) {
    return <Button variant="outlined" size="small" disabled>Loading...</Button>;
  }

  return (
    <>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="split button dropdown"
      >
        <Button sx={{borderRadius: '5px' }}
          color={
            (options[selectedIndex] === 'Hot' || options[selectedIndex] === 'Idle') ? 'error' :
            (options[selectedIndex] === 'Warm' || options[selectedIndex] === 'Converting') ? 'warning' :
            options[selectedIndex] === 'Converted' ? 'success' :
            'info' // for Cold
          }
        >
          {options[selectedIndex]}
        </Button>
        <Button sx={{borderRadius: '5px'}}
          size="small"
          onClick={handleToggle}
          color={
            (options[selectedIndex] === 'Hot' || options[selectedIndex] === 'Idle') ? 'error' :
            (options[selectedIndex] === 'Warm' || options[selectedIndex] === 'Converting') ? 'warning' :
            options[selectedIndex] === 'Converted' ? 'success' :
            'info' // for Cold
          }
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select temperature"
          aria-haspopup="menu"
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 1300 }} // Increased z-index to appear above DataGrid
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        //disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}