import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Menu,
  MenuItem,
  Divider,
  CssBaseline,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  LocalHospital as TreatmentIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  ManageAccounts as ManageAccountsIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  AccountCircle,
  Logout,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const drawerWidth = 240;
  const collapsedWidth = 60;

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'dentist', 'receptionist'] },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients', roles: ['admin', 'dentist', 'receptionist'] },
    { text: 'Appointments', icon: <CalendarIcon />, path: '/appointments', roles: ['admin', 'dentist', 'receptionist'] },
    { text: 'Treatments', icon: <TreatmentIcon />, path: '/treatments', roles: ['admin', 'dentist'] },
    { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices', roles: ['admin', 'dentist', 'receptionist'] },
    { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics', roles: ['admin', 'receptionist'] },
    { text: 'Users', icon: <ManageAccountsIcon />, path: '/users', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const drawerContent = (
    <Box
      sx={{
        width: collapsed ? collapsedWidth : drawerWidth,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: mode === 'dark'
          ? '#1e1e2f'
          : 'linear-gradient(180deg, #ffffff 0%, #f0f0f0 100%)',
        color: mode === 'dark' ? '#fff' : '#333',
        transition: 'width 0.3s, background 0.3s',
        boxShadow: mode === 'light' ? '2px 0 8px rgba(0,0,0,0.05)' : 'none',
      }}
      onMouseEnter={() => collapsed && setCollapsed(false)}
      onMouseLeave={() => !mobileOpen && !collapsed && setCollapsed(true)}
    >
      <Toolbar sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: 2.5 }}>
        {!collapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
            Dental Clinic
          </Typography>
        )}
      </Toolbar>

      <Divider sx={{ borderColor: mode === 'dark' ? '#333' : '#ddd' }} />

      <List sx={{ flexGrow: 1 }}>
        {filteredNavItems.map(item => {
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <Tooltip title={collapsed ? item.text : ''} placement="right">
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    minHeight: 50,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    borderRadius: 2,
                    mb: 0.5,
                    transition: 'all 0.2s ease',
                    color: isActive
                      ? mode === 'dark'
                        ? '#fff'
                        : '#1976d2'
                      : 'inherit',
                    backgroundColor: isActive
                      ? mode === 'dark'
                        ? '#333a55'
                        : '#e6f0ff'
                      : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      backgroundColor: isActive
                        ? mode === 'dark'
                          ? '#3f4866'
                          : '#dce8ff'
                        : mode === 'dark'
                          ? '#333'
                          : '#e6f0ff',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 0 : 3,
                      justifyContent: 'center',
                      color: isActive
                        ? mode === 'dark'
                          ? '#90caf9'
                          : '#1976d2'
                        : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: mode === 'dark' ? '#333' : '#ddd' }} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          backgroundColor: mode === 'dark' ? '#1e1e2f' : '#1976d2',
          transition: 'all 0.3s',
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setCollapsed(!collapsed)} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dental Clinic Management
          </Typography>

          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
          </IconButton>

          <IconButton color="inherit" onClick={handleMenuOpen}>
            <AccountCircle />
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>
              <Typography variant="body2">{user?.name}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
              <Settings fontSize="small" sx={{ mr: 1 }} />
              Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: 'width 0.3s',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)` },
          transition: 'width 0.3s',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
