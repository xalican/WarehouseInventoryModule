import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';
import {
  Box,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  InputAdornment,
  Badge,
  Popover,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddShoppingCart as EntryIcon,
  ReceiptLong as ReceiptIcon,
  MenuBook as BookIcon,
  Category as CategoryIcon,
  Warehouse as WarehouseIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  VpnKey as KeyIcon,
  Translate as TranslateIcon,
  AttachMoney as AttachMoneyIcon,
  Visibility,
  VisibilityOff,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const TurkishFlag = () => (
  <svg width="22" height="15" viewBox="0 0 1200 800" style={{ borderRadius: 3, display: 'inline-block', verticalAlign: 'middle', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
    <rect width="1200" height="800" fill="#E30A17"/>
    <circle cx="425" cy="400" r="200" fill="#ffffff"/>
    <circle cx="475" cy="400" r="160" fill="#E30A17"/>
    <polygon points="583.33,400 706.74,440.1 630.46,335.1 630.46,464.9 706.74,359.9" fill="#ffffff"/>
  </svg>
);

const UKFlag = () => (
  <svg width="22" height="15" viewBox="0 0 60 30" style={{ borderRadius: 3, display: 'inline-block', verticalAlign: 'middle', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
    <clipPath id="s_uk"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="t_uk"><path d="M30,15 m-30,0 l60,30 m0,-30 l-60,30 h60 v-30 z"/></clipPath>
    <g clipPath="url(#s_uk)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 l60,30 m0,-30 l-60,30" stroke="#fff" strokeWidth="6"/>
      <path d="M0,0 l60,30 m0,-30 l-60,30" stroke="#C8102E" strokeWidth="4" clipPath="url(#t_uk)"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
    </g>
  </svg>
);

const USFlag = () => (
  <svg width="22" height="15" viewBox="0 0 741 390" style={{ borderRadius: 3, display: 'inline-block', verticalAlign: 'middle', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
    <rect width="741" height="390" fill="#b22234"/>
    <path d="M0,30H741M0,90H741M0,150H741M0,210H741M0,270H741M0,330H741" stroke="#fff" strokeWidth="30"/>
    <rect width="296.4" height="210" fill="#3c3b6e"/>
  </svg>
);

const EUFlag = () => (
  <svg width="22" height="15" viewBox="0 0 810 540" style={{ borderRadius: 3, display: 'inline-block', verticalAlign: 'middle', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>
    <rect width="810" height="540" fill="#003399"/>
    <circle cx="405" cy="270" r="140" fill="none" stroke="#FFCC00" strokeWidth="10" strokeDasharray="1 73"/>
  </svg>
);

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { currency, setCurrency, rates } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar Collapse state
  const [collapsed, setCollapsed] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchor, setLangAnchor] = useState(null);
  const [currAnchor, setCurrAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);

  // Critical stock notification list
  const [criticalNotifications, setCriticalNotifications] = useState([]);
  const [totalCriticalCount, setTotalCriticalCount] = useState(0);

  // Change Password Dialog State
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [mevcutParola, setMevcutParola] = useState('');
  const [yeniParola, setYeniParola] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Read Notifications State (Persisted in localStorage)
  const [notificationsRead, setNotificationsRead] = useState(() => {
    return localStorage.getItem('notificationsRead') === 'true';
  });

  const handleMarkAllRead = () => {
    setNotificationsRead(true);
    localStorage.setItem('notificationsRead', 'true');
  };

  // Global Keyboard Shortcuts (Alt+N: New Voucher, Alt+S: Search / Dashboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        navigate('/fis-olustur');
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        navigate('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Fetch critical items for notification bell
  useEffect(() => {
    const fetchCriticals = async () => {
      try {
        const res = await api.get('/hareketler/stok-durum', { params: { kritik: true, pageSize: 5 } });
        setCriticalNotifications(res.data.items || []);
        const newCount = res.data.totalCount || 0;
        setTotalCriticalCount(newCount);
      } catch (err) {
        console.error('Bildirimler çekilemedi:', err);
      }
    };
    fetchCriticals();
  }, [location.pathname]);

  // CATEGORIZED MENU GROUPS
  const menuGroups = [
    {
      groupTitle: t('menuGroupStock'),
      items: [
        { text: t('stockStatus'), icon: <DashboardIcon />, path: '/', roles: ['Admin', 'DepoSorumlusu', 'DepoPersoneli', 'Goruntuleyici'] },
        { text: t('materials'), icon: <CategoryIcon />, path: '/malzemeler', roles: ['Admin', 'DepoSorumlusu'] },
        { text: t('warehouses'), icon: <WarehouseIcon />, path: '/depolar', roles: ['Admin', 'DepoSorumlusu'] },
      ],
    },
    {
      groupTitle: t('menuGroupTransactions'),
      items: [
        { text: t('newTransaction'), icon: <EntryIcon />, path: '/fis-olustur', roles: ['Admin', 'DepoSorumlusu', 'DepoPersoneli'] },
        { text: t('transactionsList'), icon: <ReceiptIcon />, path: '/hareketler', roles: ['Admin', 'DepoSorumlusu', 'DepoPersoneli', 'Goruntuleyici'] },
        { text: t('kartoteks'), icon: <BookIcon />, path: '/kartoteks', roles: ['Admin', 'DepoSorumlusu', 'DepoPersoneli', 'Goruntuleyici'] },
      ],
    },
    {
      groupTitle: t('menuGroupAnalysis'),
      items: [
        { text: t('reports'), icon: <AssessmentIcon />, path: '/raporlar', roles: ['Admin', 'DepoSorumlusu', 'Goruntuleyici'] },
      ],
    },
    {
      groupTitle: t('menuGroupUser'),
      items: [
        { text: t('myProfile'), icon: <PersonIcon />, path: '/profil', roles: ['Admin', 'DepoSorumlusu', 'DepoPersoneli', 'Goruntuleyici'] },
      ],
    },
  ];

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLangOpen = (e) => setLangAnchor(e.currentTarget);
  const handleLangClose = () => setLangAnchor(null);

  const handleCurrOpen = (e) => setCurrAnchor(e.currentTarget);
  const handleCurrClose = () => setCurrAnchor(null);

  const handleNotifOpen = (e) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);

  const handleSelectLang = (newLang) => {
    setLang(newLang);
    handleLangClose();
  };

  const handleSelectCurr = (newCurr) => {
    setCurrency(newCurr);
    handleCurrClose();
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleOpenChangePass = () => {
    handleMenuClose();
    setMevcutParola('');
    setYeniParola('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setPassError('');
    setPassSuccess('');
    setChangePassOpen(true);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!mevcutParola || !yeniParola) {
      setPassError(lang === 'tr' ? 'Lütfen tüm alanları doldurunuz.' : 'Please fill all fields.');
      return;
    }

    try {
      await api.post('/auth/change-password', { mevcudParola: mevcutParola, yeniParola });
      setPassSuccess(lang === 'tr' ? 'Şifreniz başarıyla güncellendi.' : 'Password updated successfully.');
      setTimeout(() => {
        setChangePassOpen(false);
      }, 1500);
    } catch (err) {
      setPassError(err.response?.data?.message || (lang === 'tr' ? 'Şifre değiştirme başarısız oldu.' : 'Failed to update password.'));
    }
  };

  const userRole = user?.rol || user?.Rol || 'Admin';

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'error';
      case 'DepoSorumlusu': return 'primary';
      case 'DepoPersoneli': return 'success';
      default: return 'default';
    }
  };

  const sidebarWidth = collapsed ? 76 : 260;

  return (
    // ROOT LAYOUT CONTAINER: FIXES FULL 100VH VIEWPORT & PREVENTS PAGE BODY SCROLL
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', bgcolor: '#f8fafc' }}>
      
      {/* 1. LEFT SIDEBAR: 100% FIXED AT 100VH HEIGHT - NEVER MOVES OR SHIFTS ON PAGE SCROLL */}
      <Box
        sx={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          bgcolor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: '4px 0 10px rgba(0,0,0,0.05)',
          zIndex: 1200,
          transition: 'width 0.25s ease, min-width 0.25s ease',
        }}
      >
        {/* Brand Logo Header & Collapse Toggle Button */}
        <Box sx={{ p: collapsed ? 1.5 : 2.2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <WarehouseIcon fontSize="small" />
            </Box>
            {!collapsed && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: 0.6, lineHeight: 1.1, color: '#ffffff', fontSize: '0.95rem' }}>
                  DEPO & STOK
                </Typography>
                <Typography variant="caption" sx={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.8 }}>
                  ERP PORTALI v2.4
                </Typography>
              </Box>
            )}
          </Box>

          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', '&:hover': { bgcolor: '#1e293b', color: '#ffffff' } }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        {/* Sleek Premium User Strip */}
        {!collapsed && (
          <Box
            sx={{
              p: 1.8,
              mx: 1.5,
              my: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.85) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              }}
            >
              {user?.adSoyad?.charAt(0) || user?.kullaniciAdi?.charAt(0) || 'A'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', width: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.adSoyad || user?.kullaniciAdi || 'Alican Canbolat'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
                <Chip
                  label={userRole}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    bgcolor: 'rgba(59,130,246,0.2)',
                    color: '#60a5fa',
                    borderRadius: 1,
                  }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  ● Live
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* CATEGORIZED MENU GROUPS */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
          {menuGroups.map((group, idx) => {
            const hasVisibleChild = group.items.some((item) => item.roles.includes(userRole));
            if (!hasVisibleChild) return null;

            return (
              <Box key={idx} sx={{ mb: 2 }}>
                {!collapsed && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#64748b',
                      letterSpacing: 1.2,
                      px: 1.5,
                      mb: 0.8,
                      display: 'block',
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.groupTitle}
                  </Typography>
                )}

                <List disablePadding>
                  {group.items.map((item) => {
                    if (!item.roles.includes(userRole)) return null;
                    const isSelected = location.pathname === item.path;

                    const buttonContent = (
                      <ListItemButton
                        onClick={() => navigate(item.path)}
                        selected={isSelected}
                        sx={{
                          borderRadius: 2.5,
                          py: 1.1,
                          px: collapsed ? 1.5 : 1.8,
                          justifyContent: collapsed ? 'center' : 'initial',
                          transition: 'all 0.2s ease-in-out',
                          position: 'relative',
                          borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent',
                          background: isSelected ? 'linear-gradient(90deg, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0.06) 100%) !important' : 'transparent',
                          color: isSelected ? '#60a5fa' : '#94a3b8',
                          boxShadow: isSelected ? '0 2px 10px rgba(37,99,235,0.15)' : 'none',
                          '&:hover': {
                            bgcolor: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                            color: '#ffffff',
                            '& .MuiListItemIcon-root': { color: isSelected ? '#60a5fa' : '#38bdf8' },
                          },
                        }}
                      >
                        <ListItemIcon sx={{ color: isSelected ? '#60a5fa' : '#64748b', minWidth: collapsed ? 0 : 36, justifySelf: 'center', transition: 'color 0.2s' }}>
                          {item.icon}
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{ fontSize: '0.86rem', fontWeight: isSelected ? 700 : 500 }}
                          />
                        )}
                      </ListItemButton>
                    );

                    return (
                      <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                        {collapsed ? (
                          <Tooltip title={item.text} placement="right" arrow>
                            {buttonContent}
                          </Tooltip>
                        ) : (
                          buttonContent
                        )}
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            );
          })}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.07)' }} />
        <Box sx={{ p: collapsed ? 1 : 1.5, flexShrink: 0 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              py: 1,
              px: collapsed ? 1.5 : 1.8,
              justifyContent: collapsed ? 'center' : 'initial',
              color: '#94a3b8',
              transition: 'all 0.15s',
              '&:hover': {
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                '& .MuiListItemIcon-root': { color: '#f87171' },
              },
            }}
          >
            <ListItemIcon sx={{ color: '#64748b', minWidth: collapsed ? 0 : 36 }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary={t('logout')}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
              />
            )}
          </ListItemButton>
        </Box>
      </Box>

      {/* 2. RIGHT MAIN AREA: TAKES REMAINING WIDTH & HAS ITS OWN INNER SCROLLBAR */}
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        
        {/* Top Header Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            color: '#1e293b',
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0,
          }}
        >
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
              Depo & Stok ERP Portalı
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              
              {/* GLOBAL BELL NOTIFICATIONS BUTTON 🔔 */}
              <Tooltip title="Canlı Kritik Stok Bildirimleri">
                <IconButton onClick={handleNotifOpen} sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
                  <Badge badgeContent={notificationsRead ? 0 : totalCriticalCount} color="error" max={999}>
                    <NotificationsIcon sx={{ color: !notificationsRead && totalCriticalCount > 0 ? '#dc2626' : '#64748b' }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Popover
                open={Boolean(notifAnchor)}
                anchorEl={notifAnchor}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { width: 380, borderRadius: 3, p: 2, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="error" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc2626' }}>
                      Kritik Stok ({totalCriticalCount})
                    </Typography>
                  </Box>

                  {!notificationsRead && totalCriticalCount > 0 ? (
                    <Button
                      size="small"
                      onClick={handleMarkAllRead}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', py: 0.2, px: 1, color: '#2563eb' }}
                    >
                      ✓ Tümünü Okundu Yap
                    </Button>
                  ) : (
                    <Chip label="✓ Okundu" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                  )}
                </Box>
                <Divider sx={{ mb: 1.5 }} />

                {criticalNotifications.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                    Şu an kritik seviyenin altında ürün bulunmamaktadır. 🎉
                  </Typography>
                ) : (
                  criticalNotifications.map((item, idx) => (
                    <Box
                      key={idx}
                      onClick={() => {
                        handleNotifClose();
                        navigate(`/kartoteks?malzemeId=${item.malzemeId}&depoId=${item.depoId}`);
                      }}
                      sx={{
                        p: 1.2,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: '#fff5f5',
                        border: '1px solid #fecaca',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#fee2e2', transform: 'translateX(2px)' },
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#991b1b', fontSize: '0.82rem' }}>
                        {item.malzemeKodu} - {item.malzemeAdi}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600, display: 'block', mt: 0.3 }}>
                        📍 {item.depoAdi} | Mevcut: {item.bakiye} {item.birim} (Limit: {item.kritikStokSeviyesi})
                      </Typography>
                    </Box>
                  ))
                )}
                <Button
                  fullWidth
                  size="small"
                  onClick={() => {
                    handleNotifClose();
                    navigate('/');
                  }}
                  sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
                >
                  Tüm {totalCriticalCount} Kritik Ürünü Stok Durumunda Gör →
                </Button>
              </Popover>

              {/* Currency Selector */}
              <Button
                onClick={handleCurrOpen}
                variant="outlined"
                size="small"
                sx={{
                  height: 38,
                  borderRadius: '20px',
                  borderColor: '#cbd5e1',
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  px: 1.8,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#2563eb',
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                  },
                }}
              >
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  {currency === 'TRY' ? <TurkishFlag /> : currency === 'USD' ? <USFlag /> : <EUFlag />}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
                  {currency === 'TRY' ? 'TRY (₺)' : currency === 'USD' ? 'USD ($)' : 'EUR (€)'}
                </Typography>
              </Button>

              <Menu
                anchorEl={currAnchor}
                open={Boolean(currAnchor)}
                onClose={handleCurrClose}
                PaperProps={{ sx: { borderRadius: 3, p: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', mt: 1 } }}
              >
                <MenuItem onClick={() => handleSelectCurr('TRY')} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.85rem', my: 0.2, gap: 1 }}>
                  <TurkishFlag /> Türk Lirası (₺ - TRY)
                </MenuItem>
                <MenuItem onClick={() => handleSelectCurr('USD')} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.85rem', my: 0.2, gap: 1 }}>
                  <USFlag /> Amerikan Doları ($ - USD) &nbsp;
                  <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800 }}>
                    [1 $ = {rates.USD} ₺]
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => handleSelectCurr('EUR')} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.85rem', my: 0.2, gap: 1 }}>
                  <EUFlag /> Euro (€ - EUR) &nbsp;
                  <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 800 }}>
                    [1 € = {rates.EUR} ₺]
                  </Typography>
                </MenuItem>
              </Menu>

              {/* Language Selector */}
              <Button
                onClick={handleLangOpen}
                variant="outlined"
                size="small"
                sx={{
                  height: 38,
                  borderRadius: '20px',
                  borderColor: '#cbd5e1',
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  px: 1.8,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#2563eb',
                    bgcolor: '#eff6ff',
                    color: '#2563eb',
                  },
                }}
              >
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                  {lang === 'tr' ? <TurkishFlag /> : <UKFlag />}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.82rem' }}>
                  {lang === 'tr' ? 'TR' : 'EN'}
                </Typography>
              </Button>

              <Menu
                anchorEl={langAnchor}
                open={Boolean(langAnchor)}
                onClose={handleLangClose}
                PaperProps={{ sx: { borderRadius: 3, p: 0.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', mt: 1 } }}
              >
                <MenuItem onClick={() => handleSelectLang('tr')} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.85rem', my: 0.2, gap: 1 }}>
                  <TurkishFlag /> Türkçe (TR)
                </MenuItem>
                <MenuItem onClick={() => handleSelectLang('en')} sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.85rem', my: 0.2, gap: 1 }}>
                  <UKFlag /> English (EN)
                </MenuItem>
              </Menu>

              <IconButton onClick={handleMenuOpen} sx={{ ml: 0.5 }}>
                <Avatar sx={{ bgcolor: '#2563eb', width: 38, height: 38, fontWeight: 'bold' }}>
                  {user?.adSoyad?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {user?.adSoyad || user?.kullaniciAdi} ({userRole})
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleMenuClose(); navigate('/profil'); }}>
                  <ListItemIcon fontSize="small">
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profilim
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon fontSize="small">
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  {t('logout')}
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* PAGE CONTENT OUTLET: INNER SCROLLABLE CONTAINER */}
        <Box component="main" sx={{ p: 3, flexGrow: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Change Password Dialog */}
      <Dialog
        open={changePassOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setChangePassOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.1rem', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 1.8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('changePassword')}
          <IconButton size="small" onClick={() => setChangePassOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleChangePasswordSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            {passError && <Alert severity="error" sx={{ mb: 2 }}>{passError}</Alert>}
            {passSuccess && <Alert severity="success" sx={{ mb: 2 }}>{passSuccess}</Alert>}

            <TextField
              margin="dense"
              fullWidth
              size="small"
              type={showCurrentPassword ? 'text' : 'password'}
              label={t('currentPassword')}
              value={mevcutParola}
              onChange={(e) => setMevcutParola(e.target.value)}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              margin="dense"
              fullWidth
              size="small"
              type={showNewPassword ? 'text' : 'password'}
              label={t('newPassword')}
              value={yeniParola}
              onChange={(e) => setYeniParola(e.target.value)}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={() => setChangePassOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 4, py: 1, fontSize: '0.95rem' }}
            >
              {t('updatePassword')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default MainLayout;
