import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  TablePagination,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Warehouse as WarehouseIcon,
  Domain as DomainIcon,
  Engineering as FieldIcon,
  DeleteSweep as ScrapIcon,
  Business as BuildingIcon,
  Apps as AppsIcon,
  Storefront as StoreIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

// Dynamic Warehouse Icon Assignee (Yeni depo eklenince otomatik ikon atanır)
const getDepoIcon = (kodOrName) => {
  const str = (kodOrName || '').toLowerCase();
  if (str.includes('mrk') || str.includes('merkez')) return <BuildingIcon fontSize="small" />;
  if (str.includes('blg') || str.includes('bölge')) return <DomainIcon fontSize="small" />;
  if (str.includes('sha') || str.includes('saha')) return <FieldIcon fontSize="small" />;
  if (str.includes('hrd') || str.includes('hurda')) return <ScrapIcon fontSize="small" />;
  return <StoreIcon fontSize="small" />;
};

const HareketListesi = () => {
  const { t } = useLanguage();
  const { formatMoney } = useCurrency();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const [depolar, setDepolar] = useState([]);
  const [selectedTip, setSelectedTip] = useState('');
  const [selectedDepo, setSelectedDepo] = useState('');
  const [selectedBolge, setSelectedBolge] = useState(null);

  const regionalDepolar = useMemo(() => {
    const map = {};
    depolar.forEach((d) => {
      const rName = d.bolge || 'Marmara Bölgesi';
      if (!map[rName]) {
        map[rName] = {
          regionName: rName,
          depots: [],
        };
      }
      map[rName].depots.push(d);
    });
    return Object.values(map);
  }, [depolar]);

  // Detail Modal
  const [selectedHareket, setSelectedHareket] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Cancel Modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [iptalNedeni, setIptalNedeni] = useState('');
  const [cancelError, setCancelError] = useState('');

  const fetchHareketler = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        pageSize: pageSize,
      };
      if (selectedTip) params.tip = selectedTip;
      if (selectedDepo) params.depoId = selectedDepo;

      const [res, dRes] = await Promise.all([
        api.get('/hareketler', { params }),
        api.get('/depolar'),
      ]);

      setItems(res.data.items || []);
      setTotalCount(res.data.totalCount || 0);
      setDepolar(dRes.data || []);
    } catch (err) {
      console.error('Hareketler çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHareketler();
  }, [selectedTip, selectedDepo, page, pageSize]);

  const handleOpenDetail = async (id) => {
    try {
      const res = await api.get(`/hareketler/${id}`);
      setSelectedHareket(res.data);
      setDetailOpen(true);
    } catch (err) {
      console.error('Hareket detay alınamadı:', err);
    }
  };

  const handleOpenCancel = (id) => {
    setCancelId(id);
    setIptalNedeni('');
    setCancelError('');
    setCancelOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!iptalNedeni.trim()) {
      setCancelError('Lütfen bir iptal gerekçesi yazınız.');
      return;
    }

    try {
      await api.post(`/hareketler/${cancelId}/iptal`, { iptalNedeni });
      setCancelOpen(false);
      fetchHareketler();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'İptal işlemi başarısız.');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filter Bar - INTERACTIVE WAREHOUSE ICON CHIPS */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
            
            {/* Hareket Tipi Seçici Dropdown */}
            <Box sx={{ width: '100%', maxWidth: 360 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t('movementType')}
                value={selectedTip}
                onChange={(e) => {
                  setSelectedTip(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">Tüm Hareket Tipleri (Giriş, Çıkış, Transfer)</MenuItem>
                <MenuItem value={1}>{t('inboundMovement')}</MenuItem>
                <MenuItem value={2}>{t('outboundMovement')}</MenuItem>
                <MenuItem value={3}>{t('transferMovement')}</MenuItem>
              </TextField>
            </Box>

            {/* BÖLGESEL DEPO LOKASYON FİLTRESİ (2-TIER REGIONAL DEPOT FILTER - 100+ DEPO İÇİN ÖLÇEKLENEBİLİR) */}
            <Box sx={{ width: '100%', p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 650, color: '#64748b', display: 'block', mb: 1.2 }}>
                🏢 DEPO LOKASYON FİLTRESİ (ÖNCE BÖLGE, SONRA DEPO SEÇİNİZ):
              </Typography>

              {/* AŞAMA 1: BÖLGE SEÇİMİ CHIP'LERİ */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: selectedBolge ? 1.5 : 0 }}>
                <Chip
                  label="🏢 Tüm Depolar & Bölgeler"
                  clickable
                  color={!selectedBolge && !selectedDepo ? 'primary' : 'default'}
                  variant={!selectedBolge && !selectedDepo ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedBolge(null);
                    setSelectedDepo('');
                    setPage(0);
                  }}
                  sx={{ fontWeight: 600, borderRadius: 2 }}
                />

                {regionalDepolar.map((reg, idx) => (
                  <Chip
                    key={idx}
                    icon={<LocationIcon fontSize="small" />}
                    label={`${reg.regionName} (${reg.depots.length})`}
                    clickable
                    color={selectedBolge === reg.regionName ? 'primary' : 'default'}
                    variant={selectedBolge === reg.regionName ? 'filled' : 'outlined'}
                    onClick={() => {
                      setSelectedBolge(reg.regionName);
                      setSelectedDepo('');
                      setPage(0);
                    }}
                    sx={{ fontWeight: 600, borderRadius: 2 }}
                  />
                ))}
              </Box>

              {/* AŞAMA 2: SEÇİLEN BÖLGEYE AİT DEPOLAR */}
              {selectedBolge && (
                <Box sx={{ pt: 1.2, borderTop: '1px dashed #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ width: '100%', fontWeight: 600, color: '#2563eb', mb: 0.5 }}>
                    📍 {selectedBolge} İçindeki Depolar:
                  </Typography>
                  {regionalDepolar
                    .find((r) => r.regionName === selectedBolge)
                    ?.depots.map((dItem) => {
                      const isSelected = selectedDepo === dItem.id.toString() || selectedDepo === dItem.id;
                      return (
                        <Chip
                          key={dItem.id}
                          icon={getDepoIcon(dItem.kod || dItem.ad)}
                          label={`${dItem.kod} - ${dItem.ad}`}
                          clickable
                          color={isSelected ? 'success' : 'default'}
                          variant={isSelected ? 'filled' : 'outlined'}
                          onClick={() => {
                            setSelectedDepo(isSelected ? '' : dItem.id.toString());
                            setPage(0);
                          }}
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                      );
                    })}
                </Box>
              )}
            </Box>

          </Box>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table
              size="small"
              sx={{
                minWidth: 650,
                '& .MuiTableCell-root': {
                  py: 0.7,
                  px: 1.8,
                  fontSize: '0.86rem',
                },
              }}
            >
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('receiptNo')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('movementType')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('date')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('sourceWarehouse')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('targetWarehouse')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('createdUser')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('status')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {t('noRecords')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id} hover sx={{ opacity: row.isIptal ? 0.6 : 1 }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.fisNo}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.hareketTipiAd}
                          size="small"
                          color={row.hareketTipi === 1 ? 'success' : row.hareketTipi === 2 ? 'error' : 'primary'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>{new Date(row.tarih).toLocaleDateString('tr-TR')}</TableCell>

                      {/* İkonlu Kaynak Depo Rozeti */}
                      <TableCell>
                        {row.kaynakDepoAd ? (
                          <Chip
                            icon={getDepoIcon(row.kaynakDepoAd)}
                            label={row.kaynakDepoAd}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, bgcolor: '#ffffff' }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>

                      {/* İkonlu Hedef Depo Rozeti */}
                      <TableCell>
                        {row.hedefDepoAd ? (
                          <Chip
                            icon={getDepoIcon(row.hedefDepoAd)}
                            label={row.hedefDepoAd}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, bgcolor: '#ffffff' }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>

                      <TableCell>{row.olusturanKullanici}</TableCell>
                      <TableCell align="center">
                        {row.isIptal ? (
                          <Chip label={t('cancelled')} color="error" size="small" variant="outlined" />
                        ) : (
                          <Chip label={t('completed')} color="success" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Detay İncele">
                          <IconButton color="primary" size="small" onClick={() => handleOpenDetail(row.id)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {!row.isIptal && (
                          <Tooltip title="Fişi İptal Et">
                            <IconButton color="error" size="small" onClick={() => handleOpenCancel(row.id)}>
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 50, 100]}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </>
        )}
      </TableContainer>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2 }}>
          Fiş Detayı - {selectedHareket?.fisNo}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedHareket && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{t('movementType')}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{selectedHareket.hareketTipiAd}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{t('date')}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{new Date(selectedHareket.tarih).toLocaleDateString('tr-TR')}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{t('sourceWarehouse')}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {selectedHareket.kaynakDepoAd ? (
                      <Chip icon={getDepoIcon(selectedHareket.kaynakDepoAd)} label={selectedHareket.kaynakDepoAd} size="small" />
                    ) : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">{t('targetWarehouse')}</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {selectedHareket.hedefDepoAd ? (
                      <Chip icon={getDepoIcon(selectedHareket.hedefDepoAd)} label={selectedHareket.hedefDepoAd} size="small" />
                    ) : '-'}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t('movementItems')}</Typography>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('materials')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{t('quantity')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{t('unitPrice')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{t('lineTotal')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedHareket.kalemler.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{k.malzemeKodu} - {k.malzemeAdi}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{k.miktar} {k.birim}</TableCell>
                      <TableCell align="right">{formatMoney(k.birimFiyat)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(k.toplamTutar)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setDetailOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2 }}>
          Fiş İptal Onayı
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Bu fişi iptal etmek üzeresiniz. Lütfen bir iptal gerekçesi belirtiniz:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="İptal Gerekçesi"
            value={iptalNedeni}
            onChange={(e) => setIptalNedeni(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setCancelOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubmit}
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 4, py: 1.2, fontSize: '0.95rem' }}
          >
            İptal Et
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HareketListesi;
