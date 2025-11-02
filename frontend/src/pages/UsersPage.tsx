import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

const UsersPage: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'receptionist',
    phone: '',
    password: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const response = await userService.getUsers(params);
      setUsers(response.data || []);
      setTotal(response.total || 0);
      setError('');
    } catch (err: any) {
      setError(err.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || '',
        password: '',
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: '',
        name: '',
        role: 'receptionist',
        phone: '',
        password: '',
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setFormData({
      email: '',
      name: '',
      role: 'receptionist',
      phone: '',
      password: '',
    });
  };

  const handleSave = async () => {
    try {
      if (selectedUser) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
        };
        await userService.updateUser(selectedUser._id, updateData);
      } else {
        await authService.register(formData);
      }
      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      setError(err.error || 'Failed to save user');
    }
  };

  const handleDelete = async () => {
    if (selectedUser) {
      try {
        await userService.deleteUser(selectedUser._id);
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } catch (err: any) {
        setError(err.error || 'Failed to delete user');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'dentist':
        return 'primary';
      case 'receptionist':
        return 'success';
      default:
        return 'default';
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <Box p={3}>
        <Alert severity="error">
          Access denied. This page is only accessible to administrators.
        </Alert>
      </Box>
    );
  }

  // 🌈 Soft gradient background adapting to theme
  const gradientBg =
    theme.palette.mode === 'dark'
      ? 'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%)'
      : 'linear-gradient(135deg, #f9fafc 0%, #eef2f7 100%)';

  return (
    <Box
      p={3}
      sx={{
        minHeight: '100vh',
        background: gradientBg,
        backdropFilter: 'blur(10px)',
        transition: 'background 0.5s ease',
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight={600}>
          User Management
        </Typography>
        <Tooltip title="Add a new user">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenModal()}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 3px 10px rgba(0,0,0,0.5)'
                  : '0 3px 10px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 4px 15px rgba(255,255,255,0.1)'
                    : '0 4px 15px rgba(0,0,0,0.2)',
              },
            }}
          >
            Add User
          </Button>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': { borderRadius: 2 },
          }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            label="Role"
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="dentist">Dentist</MenuItem>
            <MenuItem value="receptionist">Receptionist</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 20px rgba(255,255,255,0.05)'
                  : '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(40,40,55,0.8)'
                  : '#fff',
            }}
          >
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.08)'
                        : '#f5f7fa',
                  }}
                >
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Created Date</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user._id}
                    hover
                    sx={{
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.05)'
                            : '#f9fafb',
                      },
                    }}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={getRoleColor(user.role)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" justifyContent="center" gap={1.5}>
                        <Tooltip title="Edit User">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenModal(user)}
                            sx={{
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(25,118,210,0.15)'
                                    : 'rgba(25,118,210,0.1)',
                              },
                            }}
                          >
                            <EditIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            disabled={user._id === currentUser?._id}
                            sx={{
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor:
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(211,47,47,0.15)'
                                    : 'rgba(211,47,47,0.1)',
                              },
                            }}
                          >
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}

      {/* Add/Edit User Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: 20 }}>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextField
              label="Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role *</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                label="Role *"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="dentist">Dentist</MenuItem>
                <MenuItem value="receptionist">Receptionist</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            {!selectedUser && (
              <TextField
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                helperText="Minimum 8 characters"
              />
            )}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !formData.email ||
              !formData.name ||
              !formData.role ||
              (!selectedUser && !formData.password) ||
              (!selectedUser && formData.password.length < 8)
            }
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 500,
            }}
          >
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <b>{selectedUser?.name}</b>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;
