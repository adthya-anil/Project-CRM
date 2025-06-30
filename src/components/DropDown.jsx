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

export default function DropDown({ id, value, table, option, column }) {
  const options = option;

  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  const [isConverted, setIsConverted] = React.useState(false);

  const [selectedIndex, setSelectedIndex] = React.useState(() => {
    if (value && typeof value === 'string') {
      if (value.toLowerCase() === 'converted') {
        return null;
      }
      const index = options.findIndex(opt => opt.toLowerCase() === value.toLowerCase());
      return index !== -1 ? index : null;
    }
    return null;
  });

  React.useEffect(() => {
    if (value && typeof value === 'string' && value.toLowerCase() === 'converted') {
      setIsConverted(true);
      setSelectedIndex(null);
    }
  }, [value]);

  React.useEffect(() => {
    if (value && typeof value === 'string') {
      if (value.toLowerCase() === 'converted') {
        setIsConverted(true);
        setSelectedIndex(null);
        return;
      }
      const index = options.findIndex(opt => opt.toLowerCase() === value.toLowerCase());
      setSelectedIndex(index !== -1 ? index : 1);
      setIsConverted(false);
      return;
    }

    const fetchColumn = async () => {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching status:', error.message);
        setSelectedIndex(1);
        setIsConverted(false);
        return;
      }

      const statusValue = (data && data[column]) || '';

      if (statusValue.toLowerCase() === 'converted') {
        setIsConverted(true);
        setSelectedIndex(null);
        return;
      }

      const index = options.findIndex(opt => opt.toLowerCase() === statusValue.toLowerCase());
      setSelectedIndex(index !== -1 ? index : 1);
      setIsConverted(false);
    };

    fetchColumn();
  }, [id, table, value, column]);

  const handleClick = async (value = options[selectedIndex]) => {
    const { error } = await supabase
      .from(table)
      .update({ [column]: value })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error.message);
    } else {
      console.log(`Updated lead ${id} to status: ${value}`);
    }
  };

  const handleMenuItemClick = (event, index) => {
    const selectedValue = options[index];
    setSelectedIndex(index);
    setOpen(false);
    setIsConverted(selectedValue.toLowerCase() === 'converted');
    handleClick(selectedValue);
  };

  const handleToggle = () => setOpen(prevOpen => !prevOpen);

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) return;
    setOpen(false);
  };

  if (selectedIndex === null && !isConverted) {
    return <Button variant="outlined" size="small" disabled>Loading...</Button>;
  }

  return (
    <>
      <ButtonGroup
        variant="contained"
        ref={anchorRef}
        aria-label="split button dropdown"
      >
        <Button sx={{ borderRadius: '5px' }}
          color={
  isConverted ? 'success' :
  (options[selectedIndex] === 'Hot' || options[selectedIndex] === 'Idle') ? 'error' :
  (options[selectedIndex] === 'Warm' || options[selectedIndex] === 'Converting') ? 'warning' :
  'info'
}

        >
          {isConverted ? 'Converted' : options[selectedIndex]}
        </Button>
        <Button
          sx={{ borderRadius: '5px' }}
          size="small"
          onClick={handleToggle}
         color={
  isConverted ? 'success' :
  (options[selectedIndex] === 'Hot' || options[selectedIndex] === 'Idle') ? 'error' :
  (options[selectedIndex] === 'Warm' || options[selectedIndex] === 'Converting') ? 'warning' :
  'info'
}

          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select status"
          aria-haspopup="menu"
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{ zIndex: 1300 }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
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
                  {options.map((option, index) => {
                    const isConvertedOption = option.toLowerCase() === 'converted';
                    const isCurrentConverted = value?.toLowerCase() === 'converted';
                    return (
                      <MenuItem
                        key={option}
                        selected={index === selectedIndex}
                        disabled={isConvertedOption && !isCurrentConverted}
                        onClick={(event) => handleMenuItemClick(event, index)}
                      >
                        {option}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
