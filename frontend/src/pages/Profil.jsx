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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* PROFIL BANNER & USER IDENTITY CARD */}
      <Paper
        elevation={0}
        sx={{
          p: 3.5,
          mb: 3.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(15,23,42,0.15)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              sx={{
                width: 92,
                height: 92,
                bgcolor: '#2563eb',
                fontSize: '2.2rem',
                fontWeight: 800,
                boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                border: '3px solid #ffffff',
              }}
            >
              {getInitials(adSoyad || kullaniciAdi)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#ffffff', mb: 0.5 }}>
              {adSoyad || kullaniciAdi}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mt: 1 }}>
              <Chip
                icon={<BadgeIcon sx={{ color: '#60a5fa !important', fontSize: '1rem' }} />}
                label={`@${kullaniciAdi}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#93c5fd', fontWeight: 700 }}
              />
              <Chip
                icon={<ShieldIcon sx={{ color: '#34d399 !important', fontSize: '1rem' }} />}
                label={rolAd || (lang === 'en' ? 'Admin' : 'Yönetici')}
                sx={{ bgcolor: 'rgba(52,211,153,0.15)', color: '#6ee7b7', fontWeight: 800 }}
              />
              {createdAt && (
                <Chip
                  icon={<CalendarIcon sx={{ color: '#cbd5e1 !important', fontSize: '0.9rem' }} />}
                  label={`${t('createdDateLabel')} ${createdAt}`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontSize: '0.78rem' }}
                />
              )}
              <Chip
                label={`🟢 ${t('activeSession')}`}
                sx={{ bgcolor: 'rgba(16,185,129,0.2)', color: '#34d399', fontWeight: 800, fontSize: '0.75rem' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 2 SÜTUNLU ZENGİN PROFİL DASHBOARD DÜZENİ */}
      <Grid container spacing={3.5}>
        
        {/* SOL SÜTUN (Kişisel Bilgiler & Hızlı Not Defteri) */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            
            {/* Kart 1: Kişisel Bilgiler */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PersonIcon color="primary" /> {t('profileTitle')}
                </Typography>

                {profileSuccess && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>{profileSuccess}</Alert>}
                {profileError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{profileError}</Alert>}

                <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label={t('fullNameLabel')}
                    value={adSoyad}
                    onChange={(e) => setAdSoyad(e.target.value)}
                    placeholder={lang === 'en' ? 'e.g. John Doe' : 'Örn: Alican Canbolat'}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label={t('emailAddressLabel')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john.doe@depostok.com"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label={t('username')}
                        value={kullaniciAdi}
                        disabled
                        helperText={t('usernameFixedLabel')}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label={t('systemRoleLabel')}
                        value={rolAd}
                        disabled
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ pt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={profileSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      disabled={profileSubmitting}
                      sx={{ py: 1.2, px: 3.5, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, fontSize: '0.95rem' }}
                    >
                      {profileSubmitting ? (lang === 'en' ? 'Saving...' : 'Kaydediliyor...') : t('updateProfileBtn')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Kart 2: Kullanıcı Hızlı Not Defteri & Hatırlatıcı */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NoteIcon sx={{ color: '#d97706' }} /> {t('quickNotesTitle')}
                  </Typography>
                  {noteSavedMessage && (
                    <Chip label={`✓ ${t('noteSavedBadge')}`} size="small" color="success" sx={{ fontWeight: 700 }} />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('quickNotesSub')}
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={t('quickNotesPlaceholder')}
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotes}
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 3 }}
                >
                  {t('saveNoteBtn')}
                </Button>
              </CardContent>
            </Card>

          </Box>
        </Grid>

        {/* SAĞ SÜTUN (Parola Değiştirme, Sistem Metrikleri & Tercihler) */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            
            {/* Kart 3: Parola & Güvenlik Ayarları */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LockIcon color="secondary" /> {t('passSecurityTitle')}
                </Typography>

                {passSuccess && <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>{passSuccess}</Alert>}
                {passError && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{passError}</Alert>}

                <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth
                    type={showMevcut ? 'text' : 'password'}
                    label={t('currentPassLabel')}
                    value={mevcutParola}
                    onChange={(e) => setMevcutParola(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#64748b' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowMevcut(!showMevcut)} edge="end">
                              {showMevcut ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Divider sx={{ my: 0.5 }} />

                  <TextField
                    fullWidth
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
                            <LockIcon sx={{ color: '#2563eb' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowYeni(!showYeni)} edge="end">
                              {showYeni ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    type={showYeniTekrar ? 'text' : 'password'}
                    label={t('confirmNewPassLabel')}
                    value={yeniParolaTekrar}
                    onChange={(e) => setYeniParolaTekrar(e.target.value)}
                    required
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckIcon sx={{ color: yeniParola && yeniParola === yeniParolaTekrar ? '#059669' : '#64748b' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowYeniTekrar(!showYeniTekrar)} edge="end">
                              {showYeniTekrar ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Box sx={{ pt: 1 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="secondary"
                      startIcon={passSubmitting ? <CircularProgress size={20} color="inherit" /> : <LockIcon />}
                      disabled={passSubmitting}
                      sx={{ py: 1.2, px: 3, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, fontSize: '0.95rem' }}
                    >
                      {passSubmitting ? (lang === 'en' ? 'Updating...' : 'Güncelleniyor...') : t('changePassBtn')}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Kart 4: Sistem & Güvenlik Metrikleri */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <SecurityIcon sx={{ color: '#059669' }} /> {t('sessionSecurityTitle')}
                </Typography>

                <List disablePadding sx={{ '& .MuiListItem-root': { py: 1, px: 0 } }}>
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}><SpeedIcon sx={{ color: '#2563eb' }} /></ListItemIcon>
                    <ListItemText
                      primary={t('sessionTypeTitle')}
                      secondary={t('sessionTypeDesc')}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.86rem' }}
                      secondaryTypographyProps={{ fontSize: '0.78rem' }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}><StorageIcon sx={{ color: '#d97706' }} /></ListItemIcon>
                    <ListItemText
                      primary={t('dbEncryptTitle')}
                      secondary={t('dbEncryptDesc')}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.86rem' }}
                      secondaryTypographyProps={{ fontSize: '0.78rem' }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}><WarehouseIcon sx={{ color: '#059669' }} /></ListItemIcon>
                    <ListItemText
                      primary={t('authRegionsTitle')}
                      secondary={t('authRegionsDesc')}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.86rem' }}
                      secondaryTypographyProps={{ fontSize: '0.78rem' }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon sx={{ minWidth: 36 }}><LanguageIcon sx={{ color: '#7c3aed' }} /></ListItemIcon>
                    <ListItemText
                      primary={t('activeLangCurrTitle')}
                      secondary={`${lang === 'tr' ? 'Türkçe' : 'English'} | ${currency}`}
                      primaryTypographyProps={{ fontWeight: 700, fontSize: '0.86rem' }}
                      secondaryTypographyProps={{ fontSize: '0.78rem' }}
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
