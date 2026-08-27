import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  Alert,
  Divider,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  EditNote as NoteIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  Warehouse as WarehouseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';

export default function Profil() {
  const { user, updateUser } = useAuth();
  const { lang, t } = useLanguage();
  const { currency } = useCurrency();

  // Profile Form States
  const [adSoyad, setAdSoyad] = useState('');
  const [email, setEmail] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [rolAd, setRolAd] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form States
  const [mevcutParola, setMevcutParola] = useState('');
  const [yeniParola, setYeniParola] = useState('');
  const [yeniParolaTekrar, setYeniParolaTekrar] = useState('');
  const [showMevcut, setShowMevcut] = useState(false);
  const [showYeni, setShowYeni] = useState(false);
  const [showYeniTekrar, setShowYeniTekrar] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Quick Notepad State (Local Storage)
  const [userNotes, setUserNotes] = useState(() => {
    return localStorage.getItem('userQuickNotes') || '';
  });
  const [noteSavedMessage, setNoteSavedMessage] = useState(false);

  // Fetch Current Profile
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get('/auth/me');
      const data = res.data;
      setAdSoyad(data.adSoyad || '');
      setEmail(data.email || '');
      setKullaniciAdi(data.kullaniciAdi || '');
      setRolAd(data.rolAd || data.rol || (lang === 'en' ? 'User' : 'Kullanıcı'));
      if (data.createdAt) {
        setCreatedAt(new Date(data.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR'));
      }
    } catch (err) {
      setProfileError(lang === 'en' ? 'An error occurred while loading profile details.' : 'Profil bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [lang]);

  // Update Profile Info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    if (!adSoyad.trim()) {
      setProfileError(lang === 'en' ? 'Full Name field cannot be empty.' : 'Ad Soyad alanı boş bırakılamaz.');
      return;
    }

    try {
      setProfileSubmitting(true);
      const res = await api.put('/auth/profile', { adSoyad, email });
      setProfileSuccess(res.data?.message || (lang === 'en' ? 'Your profile information has been updated successfully.' : 'Profil bilgileriniz başarıyla güncellendi.'));
      
      if (updateUser) {
        updateUser({ adSoyad });
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || (lang === 'en' ? 'An error occurred while updating profile.' : 'Profil güncellenirken bir hata oluştu.'));
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!mevcutParola || !yeniParola || !yeniParolaTekrar) {
      setPassError(lang === 'en' ? 'Please fill in all password fields.' : 'Lütfen tüm parola alanlarını doldurunuz.');
      return;
    }

    if (yeniParola.length < 6) {
      setPassError(lang === 'en' ? 'New password must be at least 6 characters.' : 'Yeni parola en az 6 karakter olmalıdır.');
      return;
    }

    if (yeniParola !== yeniParolaTekrar) {
      setPassError(lang === 'en' ? 'New passwords do not match.' : 'Yeni parolalar eşleşmiyor.');
      return;
    }

    try {
      setPassSubmitting(true);
      const res = await api.post('/auth/change-password', {
        mevcutParola,
        yeniParola,
      });
      setPassSuccess(res.data?.message || (lang === 'en' ? 'Your password has been updated successfully.' : 'Parolanız başarıyla güncellendi.'));
      setMevcutParola('');
      setYeniParola('');
      setYeniParolaTekrar('');
    } catch (err) {
      setPassError(err.response?.data?.message || (lang === 'en' ? 'An error occurred while changing password.' : 'Parola değiştirilirken hata oluştu.'));
    } finally {
      setPassSubmitting(false);
    }
  };

  // Save Quick Notepad
  const handleSaveNotes = () => {
    localStorage.setItem('userQuickNotes', userNotes);
    setNoteSavedMessage(true);
    setTimeout(() => setNoteSavedMessage(false), 2000);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  if (profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pb: 2 }}>
      {/* PROFIL BANNER & USER IDENTITY CARD */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 16px rgba(15,23,42,0.12)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 68,
                height: 68,
                bgcolor: '#2563eb',
                fontSize: '1.5rem',
                fontWeight: 650,
                boxShadow: '0 3px 12px rgba(37,99,235,0.3)',
                border: '2px solid #ffffff',
              }}
            >
              {getInitials(adSoyad || kullaniciAdi)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" sx={{ fontWeight: 650, color: '#ffffff', mb: 0.3, fontSize: '1.2rem' }}>
              {adSoyad || kullaniciAdi}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                icon={<BadgeIcon sx={{ color: '#60a5fa !important', fontSize: '0.9rem' }} />}
                label={`@${kullaniciAdi}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#93c5fd', fontWeight: 600, fontSize: '0.78rem' }}
              />
              <Chip
                icon={<ShieldIcon sx={{ color: '#34d399 !important', fontSize: '0.9rem' }} />}
                label={rolAd || (lang === 'en' ? 'Admin' : 'Yönetici')}
                size="small"
                sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#6ee7b7', fontWeight: 600, fontSize: '0.78rem' }}
              />
              {createdAt && (
                <Chip
                  icon={<CalendarIcon sx={{ color: '#cbd5e1 !important', fontSize: '0.85rem' }} />}
                  label={`${t('createdDateLabel')} ${createdAt}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontSize: '0.75rem' }}
                />
              )}
              <Chip
                label={`🟢 ${t('activeSession')}`}
                size="small"
                sx={{ bgcolor: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 600, fontSize: '0.75rem' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 2 SÜTUNLU ZENGİN PROFİL DASHBOARD DÜZENİ */}
      <Grid container spacing={2}>
        
        {/* SOL SÜTUN (Kişisel Bilgiler & Hızlı Not Defteri) */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Kart 1: Kişisel Bilgiler */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 650, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" fontSize="small" /> {t('profileTitle')}
                </Typography>

                {profileSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>{profileSuccess}</Alert>}
                {profileError && <Alert severity="error" sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>{profileError}</Alert>}

                <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('fullNameLabel')}
                    value={adSoyad}
                    onChange={(e) => setAdSoyad(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. John Doe' : 'Örn: Alican Canbolat'}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#64748b' }} fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    label={t('emailAddressLabel')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@depostok.com"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#64748b' }} fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t('username')}
                        value={kullaniciAdi}
                        disabled
                        helperText={t('usernameFixedLabel')}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t('systemRoleLabel')}
                        value={rolAd}
                        disabled
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ pt: 0.5 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={profileSubmitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                      disabled={profileSubmitting}
                      sx={{ py: 0.8, px: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.88rem' }}
                    >
                      {profileSubmitting ? (lang === 'en' ? 'Saving...' : 'Kaydediliyor...') : t('updateProfileBtn')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Kart 2: Kullanıcı Hızlı Not Defteri & Hatırlatıcı */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 650, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NoteIcon sx={{ color: '#d97706' }} fontSize="small" /> {t('quickNotesTitle')}
                  </Typography>
                  {noteSavedMessage && (
                    <Chip label={`✓ ${t('noteSavedBadge')}`} size="small" color="success" sx={{ fontWeight: 600, height: 24, fontSize: '0.75rem' }} />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.82rem' }}>
                  {t('quickNotesSub')}
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={t('quickNotesPlaceholder')}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  sx={{ mb: 1.5 }}
                />

                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotes}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 2.5, py: 0.6, fontSize: '0.85rem' }}
                >
                  {t('saveNoteBtn')}
                </Button>
              </CardContent>
            </Card>

          </Box>
        </Grid>

        {/* SAĞ SÜTUN (Parola Değiştirme, Sistem Metrikleri & Tercihler) */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Kart 3: Parola & Güvenlik Ayarları */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 650, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LockIcon color="secondary" fontSize="small" /> {t('passSecurityTitle')}
                </Typography>

                {passSuccess && <Alert severity="success" sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>{passSuccess}</Alert>}
                {passError && <Alert severity="error" sx={{ mb: 2, py: 0.5, borderRadius: 2 }}>{passError}</Alert>}

                <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type={showMevcut ? 'text' : 'password'}
                    label={t('currentPassLabel')}
                    value={mevcutParola}
                    onChange={(e) => setMevcutParola(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#64748b' }} fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowMevcut(!showMevcut)} edge="end" size="small">
                              {showMevcut ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Divider sx={{ my: 0.2 }} />

                  <TextField
                    fullWidth
                    size="small"
                    type={showYeni ? 'text' : 'password'}
                    label={t('newPassLabel')}
                    value={yeniParola}
                    onChange={(e) => setYeniParola(e.target.value)}
                    helperText={t('minSixCharsHelp')}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#2563eb' }} fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowYeni(!showYeni)} edge="end" size="small">
                              {showYeni ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    size="small"
                    type={showYeniTekrar ? 'text' : 'password'}
                    label={t('confirmNewPassLabel')}
                    value={yeniParolaTekrar}
                    onChange={(e) => setYeniParolaTekrar(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckIcon sx={{ color: yeniParola && yeniParola === yeniParolaTekrar ? '#059669' : '#64748b' }} fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowYeniTekrar(!showYeniTekrar)} edge="end" size="small">
                              {showYeniTekrar ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Box sx={{ pt: 0.5 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      startIcon={passSubmitting ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
                      disabled={passSubmitting}
                      sx={{ py: 0.8, px: 2.5, borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.88rem' }}
                    >
                      {passSubmitting ? (lang === 'en' ? 'Updating...' : 'Güncelleniyor...') : t('changePassBtn')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Kart 4: Sistem & Güvenlik Metrikleri */}
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 650, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <SecurityIcon sx={{ color: '#059669' }} fontSize="small" /> {t('sessionSecurityTitle')}
                </Typography>

                <List disablePadding sx={{ '& .MuiListItem-root': { py: 0.6, px: 0 } }}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}><SpeedIcon sx={{ color: '#2563eb' }} fontSize="small" /></ListItemIcon>
                    <ListItemText
                      primary={t('sessionTypeTitle')}
                      secondary={t('sessionTypeDesc')}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.82rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}><StorageIcon sx={{ color: '#d97706' }} fontSize="small" /></ListItemIcon>
                    <ListItemText
                      primary={t('dbEncryptTitle')}
                      secondary={t('dbEncryptDesc')}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.82rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}><WarehouseIcon sx={{ color: '#059669' }} fontSize="small" /></ListItemIcon>
                    <ListItemText
                      primary={t('authRegionsTitle')}
                      secondary={t('authRegionsDesc')}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.82rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 32 }}><LanguageIcon sx={{ color: '#7c3aed' }} fontSize="small" /></ListItemIcon>
                    <ListItemText
                      primary={t('activeLangCurrTitle')}
                      secondary={`${lang === 'tr' ? 'Türkçe' : 'English'} | ${currency}`}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.82rem' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

          </Box>
        </Grid>

      </Grid>
    </Box>
  );
}
