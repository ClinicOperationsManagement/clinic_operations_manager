import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  useTheme,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true);
      if (user?._id) {
        await userService.updateUser(user._id, profileData);
        await authService.getMe();
        setSnackbar({
          open: true,
          message: 'Profile updated successfully!',
          severity: 'success',
        });
      }
      handleClose();
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.error || 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordLoading(true);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setSnackbar({
          open: true,
          message: 'New passwords do not match',
          severity: 'error',
        });
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setSnackbar({
          open: true,
          message: 'New password must be at least 8 characters',
          severity: 'error',
        });
        return;
      }

      await authService.changePassword(passwordData);
      setSnackbar({
        open: true,
        message: 'Password changed successfully. Logging out...',
        severity: 'success',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.error || 'Failed to change password',
        severity: 'error',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const isDark = theme.palette.mode === 'dark';

  const cardStyle = {
    borderRadius: 4,
    boxShadow: isDark
      ? '0 6px 20px rgba(0, 0, 0, 0.6)'
      : '0 6px 20px rgba(0, 0, 0, 0.1)',
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isDark
        ? '0 10px 25px rgba(80, 70, 200, 0.3)'
        : '0 10px 25px rgba(103, 58, 183, 0.15)',
    },
  };

  const buttonStyle = {
    background: theme.palette.primary.main,
    color: '#fff',
    fontWeight: 600,
    borderRadius: 2,
    py: 1.2,
    textTransform: 'none',
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        p: 5,
        background: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          fontWeight: 800,
          mb: 2,
        }}
      >
        Profile Settings
      </Typography>

      <Grid container spacing={4} sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Profile Info */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Profile Information
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" fontWeight={600}>
                  Name: <Typography component="span">{user?.name}</Typography>
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  Email: <Typography component="span">{user?.email}</Typography>
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  Role: <Typography component="span">{user?.role || 'User'}</Typography>
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  Phone: <Typography component="span">{user?.phone || 'N/A'}</Typography>
                </Typography>
              </Box>

              <Button sx={{ ...buttonStyle, mt: 3 }} onClick={handleOpen} fullWidth>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Password */}
        <Grid item xs={12} md={6}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Change Password
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  fullWidth
                />

                <Divider />

                <TextField
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  fullWidth
                  helperText="Minimum 8 characters"
                />

                <TextField
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  fullWidth
                  error={
                    passwordData.confirmPassword !== '' &&
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                  helperText={
                    passwordData.confirmPassword !== '' &&
                    passwordData.newPassword !== passwordData.confirmPassword
                      ? 'Passwords do not match'
                      : ''
                  }
                />

                <Button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  sx={buttonStyle}
                  fullWidth
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </Button>

                <Typography
                  variant="caption"
                  textAlign="center"
                  sx={{ color: 'text.secondary', mt: 1 }}
                >
                  You will be logged out after changing your password.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Full Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={profileLoading}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Toast */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
