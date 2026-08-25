import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  LockOutlined as LockIcon,
  Person as PersonIcon,
  VpnKey as KeyIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
} from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [parola, setParola] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const demoUsers = [
    { username: 'admin', pass: 'Admin123!', role: 'Admin (Yönetici)', color: 'error' },
    { username: 'sorumlu', pass: 'Sorumlu123!', role: 'Depo Sorumlusu', color: 'primary' },
    { username: 'personel', pass: 'Personel123!', role: 'Depo Personeli', color: 'success' },
    { username: 'goruntuleyici', pass: 'Goruntuleyici123!', role: 'Görüntüleyici', color: 'default' },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('rememberedUser');
    const savedPass = localStorage.getItem('rememberedPass');
    if (savedUser) {
      setKullaniciAdi(savedUser);
      if (savedPass) {
        setParola(savedPass);
      }
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!kullaniciAdi || !parola) {
      setError('Lütfen kullanıcı adı ve parolanızı giriniz.');
      return;
    }

    setLoading(true);
    try {
      await login(kullaniciAdi, parola);
      if (rememberMe) {
        localStorage.setItem('rememberedUser', kullaniciAdi);
        localStorage.setItem('rememberedPass', parola);
      } else {
        localStorage.removeItem('rememberedUser');
        localStorage.removeItem('rememberedPass');
      }
      navigate('/');
    } catch (err) {
      if (!err.response || err.code === 'ERR_NETWORK') {
        setError('⚠️ API Sunucusuna (Port 5078) Ulaşılamıyor! Lütfen arka plan sunucusunu kontrol ediniz.');
      } else {
        setError(err.response?.data?.message || 'Giriş başarısız. Kullanıcı adı veya parola hatalı!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (username, pass) => {
    setKullaniciAdi(username);
    setParola(pass);
    setError('');
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotMessage(`'${forgotUser}' için şifre sıfırlama talebiniz sistem yöneticisine iletildi.`);
    setTimeout(() => {
      setForgotOpen(false);
      setForgotMessage('');
    }, 2500);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0f172a',
        p: 2,
      }}
    >
      <Card
        elevation={10}
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            bgcolor: '#1e293b',
            color: '#ffffff',
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#2563eb',
              width: 56,
              height: 56,
              margin: '0 auto 12px auto',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
            }}
          >
            <LockIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>
            DEPO & STOK ERP
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
            Güvenli Giriş Portalı
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              margin="normal"
              label="Kullanıcı Adı"
              value={kullaniciAdi}
              onChange={(e) => setKullaniciAdi(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              type={showPassword ? 'text' : 'password'}
              label="Parola"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        title={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              required
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={<Typography variant="body2">Beni Hatırla</Typography>}
              />
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setForgotUser(kullaniciAdi);
                  setForgotOpen(true);
                }}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Şifremi Unuttum?
              </Button>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 3,
                py: 1.4,
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'none',
                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              }}
            >
              {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* DEMO QUICK LOGIN BUTTONS */}
          <Box sx={{ pt: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 0.5, display: 'block', mb: 1.5, textAlign: 'center' }}>
              ⚡ HIZLI DEMO GİRİŞ HESAPLARI (TEK TIKLA DOLDUR)
            </Typography>

            <Grid container spacing={1}>
              {demoUsers.map((item) => (
                <Grid item xs={6} key={item.username}>
                  <Paper
                    elevation={0}
                    onClick={() => handleFillDemo(item.username, item.pass)}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      textAlign: 'center',
                      bgcolor: '#f8fafc',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: '#eff6ff',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                      {item.username}
                    </Typography>
                    <Chip
                      label={item.role}
                      size="small"
                      color={item.color}
                      sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, mt: 0.3 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog
        open={forgotOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setForgotOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Şifre Sıfırlama Talebi
          <IconButton size="small" onClick={() => setForgotOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleForgotSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            {forgotMessage && <Alert severity="success" sx={{ mb: 2 }}>{forgotMessage}</Alert>}
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Kullanıcı adınızı girerek sistem yöneticisine şifre sıfırlama talebi gönderebilirsiniz:
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Kullanıcı Adınız"
              value={forgotUser}
              onChange={(e) => setForgotUser(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setForgotOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>Vazgeç</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 3 }}>Talebi Gönder</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Login;
