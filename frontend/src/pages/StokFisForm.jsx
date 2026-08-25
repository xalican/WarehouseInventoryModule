import React, { useState, useEffect } from 'react';
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
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  CheckCircle as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const StokFisForm = () => {
  const { t } = useLanguage();
  const { formatMoney } = useCurrency();

  const [hareketTipi, setHareketTipi] = useState(1); // 1: Giriş, 2: Çıkış, 3: Transfer
  const [kaynakDepoId, setKaynakDepoId] = useState('');
  const [hedefDepoId, setHedefDepoId] = useState('');
  const [aciklama, setAciklama] = useState('');

  const [depolar, setDepolar] = useState([]);
  const [allMalzemeler, setAllMalzemeler] = useState([]);
  const [stokMap, setStokMap] = useState({});

  // Form rows
  const [kalemler, setKalemler] = useState([
    { malzemeId: null, miktar: 1, birimFiyat: 0, raf: '', huycre: '', malzemeDurumu: 1 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Printable Receipt Dialog State
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, mRes, sRes] = await Promise.all([
          api.get('/depolar'),
          api.get('/malzemeler', { params: { pageSize: 500 } }),
          api.get('/hareketler/stok-durum', { params: { pageSize: 5000 } }),
        ]);
        setDepolar(dRes.data);
        setAllMalzemeler(mRes.data.items || []);

        const map = {};
        (sRes.data.items || []).forEach((stok) => {
          map[`${stok.malzemeId}_${stok.depoId}`] = stok.bakiye;
        });
        setStokMap(map);
      } catch (err) {
        console.error('Master datalar çekilemedi:', err);
      }
    };
    fetchData();
  }, []);

  const handleAddRow = () => {
    setKalemler([
      ...kalemler,
      { malzemeId: null, miktar: 1, birimFiyat: 0, raf: '', huycre: '', malzemeDurumu: 1 },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (kalemler.length === 1) return;
    const newKalemler = [...kalemler];
    newKalemler.splice(index, 1);
    setKalemler(newKalemler);
  };

  const handleRowChange = (index, field, value) => {
    const newKalemler = [...kalemler];
    newKalemler[index][field] = value;
    setKalemler(newKalemler);
  };

  const isIssueOrTransfer = hareketTipi === 2 || hareketTipi === 3;

  const handleCancelForm = () => {
    setKalemler([{ malzemeId: null, miktar: 1, birimFiyat: 0, raf: '', huycre: '', malzemeDurumu: 1 }]);
    setAciklama('');
    setKaynakDepoId('');
    setHedefDepoId('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Form Validations
    if (hareketTipi === 1 && !hedefDepoId) {
      setError('Giriş hareketi için lütfen bir Hedef Depo seçiniz.');
      return;
    }
    if (hareketTipi === 2 && !kaynakDepoId) {
      setError('Çıkış hareketi için lütfen bir Kaynak Depo seçiniz.');
      return;
    }
    if (hareketTipi === 3) {
      if (!kaynakDepoId || !hedefDepoId) {
        setError('Transfer hareketi için hem Kaynak hem de Hedef Depo seçilmelidir.');
        return;
      }
      if (kaynakDepoId === hedefDepoId) {
        setError('Kaynak ve Hedef Depo aynı olamaz.');
        return;
      }
    }

    // Line Validations & Live Stock Check
    for (let i = 0; i < kalemler.length; i++) {
      const k = kalemler[i];
      if (!k.malzemeId) {
        setError(`${i + 1}. satırda malzeme seçilmemiş.`);
        return;
      }
      if (parseFloat(k.miktar) <= 0) {
        setError(`${i + 1}. satırda miktar 0'dan büyük olmalıdır.`);
        return;
      }

      // Check available balance on Output or Transfer
      if (isIssueOrTransfer && kaynakDepoId) {
        const availableBalance = stokMap[`${k.malzemeId.id}_${kaynakDepoId}`] || 0;
        if (parseFloat(k.miktar) > availableBalance) {
          setError(`${i + 1}. satırdaki miktar (${k.miktar} adet), kaynak depodaki mevcut stok bakiyesinden (${availableBalance} adet) fazla olamaz.`);
          return;
        }
      }
    }

    setLoading(true);

    const payload = {
      hareketTipi: parseInt(hareketTipi),
      kaynakDepoId: kaynakDepoId ? parseInt(kaynakDepoId) : null,
      hedefDepoId: hedefDepoId ? parseInt(hedefDepoId) : null,
      aciklama,
      kalemler: kalemler.map((k) => ({
        malzemeId: k.malzemeId.id,
        miktar: parseFloat(k.miktar),
        birimFiyat: parseFloat(k.birimFiyat || 0),
        raf: k.raf,
        huycre: k.huycre,
        malzemeDurumu: parseInt(k.malzemeDurumu),
      })),
    };

    try {
      const res = await api.post('/hareketler', payload);
      setCreatedResult(res.data);
      setSuccess(t('movementSuccess'));
      setReceiptOpen(true);

      // Reset Form
      setKalemler([{ malzemeId: null, miktar: 1, birimFiyat: 0, raf: '', huycre: '', malzemeDurumu: 1 }]);
      setAciklama('');
    } catch (err) {
      setError(err.response?.data?.message || 'Stok hareketi oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const genelToplam = kalemler.reduce((sum, item) => {
    return sum + (parseFloat(item.miktar || 0) * parseFloat(item.birimFiyat || 0));
  }, 0);

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Success Alert Banner */}
      {success && (
        <Alert
          severity="success"
          icon={<CheckIcon fontSize="inherit" />}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setReceiptOpen(true)}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {t('createReceiptBtn')}
            </Button>
          }
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {success}
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: '#0f172a' }}>
          {t('newTransaction')}
        </Typography>

        {/* ÜST BAŞLIK ALANI - SAF CSS FLEXBOX (TÜM SATIRI TAM YÜZDE YÜZ KAPLAR) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', mb: 2 }}>
          
          {/* SATIR 1: HAREKET TİPİ, KAYNAK DEPO, HEDEF DEPO (NİZAMİ 3 EŞİT FLEX SÜTUNU - %100 SATIR GENİŞLİĞİ KAPLAR) */}
          <Box sx={{ display: 'flex', gap: 2.5, width: '100%', flexWrap: 'wrap' }}>
            
            <Box sx={{ flex: '1 1 280px' }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Hareket Tipi *"
                value={hareketTipi}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setHareketTipi(val);
                  if (val === 1) setKaynakDepoId('');
                  if (val === 2) setHedefDepoId('');
                }}
                required
                InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
              >
                <MenuItem value={1}>{t('inboundMovement')}</MenuItem>
                <MenuItem value={2}>{t('outboundMovement')}</MenuItem>
                <MenuItem value={3}>{t('transferMovement')}</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ flex: '1 1 280px' }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Kaynak Depo Seçiniz *"
                value={kaynakDepoId}
                onChange={(e) => setKaynakDepoId(e.target.value)}
                disabled={hareketTipi === 1}
                required={hareketTipi === 2 || hareketTipi === 3}
                InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
              >
                <MenuItem value="">-- Kaynak Depo Seçiniz --</MenuItem>
                {depolar.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.kod} - {d.ad}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ flex: '1 1 280px' }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Hedef Depo Seçiniz *"
                value={hedefDepoId}
                onChange={(e) => setHedefDepoId(e.target.value)}
                disabled={hareketTipi === 2}
                required={hareketTipi === 1 || hareketTipi === 3}
                InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
              >
                <MenuItem value="">-- Hedef Depo Seçiniz --</MenuItem>
                {depolar.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.kod} - {d.ad}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

          </Box>

          {/* SATIR 2: AÇIKLAMA / BELGE İRSALİYE NO (TEK BAŞINA TAM 100% SATIR GENİŞLİĞİ KAPLAR) */}
          <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
              size="small"
              label="Açıklama / Belge İrsaliye No"
              placeholder="Evrak numarası, irsaliye kodu veya işlem açıklaması giriniz..."
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
            />
          </Box>

        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Kalemler Tablosu */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
            {t('movementItems')}
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
            onClick={handleAddRow}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {t('addRow')}
          </Button>
        </Box>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 0.7,
                px: 1.5,
                fontSize: '0.86rem',
              },
            }}
          >
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: hareketTipi === 3 ? '38%' : '28%' }}>{t('materials')} *</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, width: '12%' }}>{t('quantity')} *</TableCell>
                {hareketTipi !== 3 && <TableCell align="right" sx={{ fontWeight: 700, width: '14%' }}>{t('unitPrice')}</TableCell>}
                <TableCell sx={{ fontWeight: 700, width: '18%' }}>Raf / Hücre Konumu</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '14%' }}>{t('materialStatus')}</TableCell>
                {hareketTipi !== 3 && <TableCell align="right" sx={{ fontWeight: 700, width: '10%' }}>{t('lineTotal')}</TableCell>}
                <TableCell align="center" sx={{ width: '4%' }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kalemler.map((row, index) => {
                const rowTotal = (parseFloat(row.miktar || 0) * parseFloat(row.birimFiyat || 0));

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Autocomplete
                        size="small"
                        options={allMalzemeler}
                        getOptionLabel={(option) => `${option.kod} - ${option.ad}`}
                        value={row.malzemeId}
                        onChange={(e, newValue) => handleRowChange(index, 'malzemeId', newValue)}
                        ListboxProps={{ sx: { minWidth: 320 } }}
                        renderInput={(params) => (
                          <TextField {...params} label={t('searchMaterial')} placeholder="Yazarak ara..." />
                        )}
                      />
                      {isIssueOrTransfer && kaynakDepoId && row.malzemeId && (
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={`Mevcut Bakiye: ${stokMap[`${row.malzemeId.id}_${kaynakDepoId}`] || 0} Adet`}
                            size="small"
                            color={(stokMap[`${row.malzemeId.id}_${kaynakDepoId}`] || 0) > 0 ? "primary" : "error"}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', fontWeight: 700, height: 20 }}
                          />
                        </Box>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        inputProps={{ min: 0.01, step: 'any' }}
                        value={row.miktar}
                        onChange={(e) => handleRowChange(index, 'miktar', e.target.value)}
                      />
                    </TableCell>

                    {hareketTipi !== 3 && (
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, step: 'any' }}
                          value={row.birimFiyat}
                          onChange={(e) => handleRowChange(index, 'birimFiyat', e.target.value)}
                        />
                      </TableCell>
                    )}

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.8 }}>
                        <TextField
                          size="small"
                          placeholder="Raf (A-1)"
                          value={row.raf}
                          onChange={(e) => handleRowChange(index, 'raf', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                        <TextField
                          size="small"
                          placeholder="Hücre (H-4)"
                          value={row.huycre}
                          onChange={(e) => handleRowChange(index, 'huycre', e.target.value)}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={row.malzemeDurumu}
                        disabled={isIssueOrTransfer}
                        onChange={(e) => handleRowChange(index, 'malzemeDurumu', e.target.value)}
                      >
                        <MenuItem value={1}>{t('available')}</MenuItem>
                        <MenuItem value={2} disabled={isIssueOrTransfer}>
                          {t('scrap')} {isIssueOrTransfer ? `(${t('scrapNotice')})` : ''}
                        </MenuItem>
                      </TextField>
                    </TableCell>

                    {hareketTipi !== 3 && (
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatMoney(rowTotal)}
                      </TableCell>
                    )}

                    <TableCell align="center">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveRow(index)}
                        disabled={kalemler.length === 1}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer Actions & Standardized Submit & Cancel Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#64748b' }}>
              {t('grandTotal')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
              {formatMoney(genelToplam)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* İŞLEMİ İPTAL ETME (CANCEL) BUTONU */}
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={handleCancelForm}
              sx={{ textTransform: 'none', fontWeight: 700, px: 3, py: 1.2, borderRadius: 2.5 }}
            >
              {t('cancel')}
            </Button>

            {/* KAYDET (SUBMIT) BUTONU */}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={<SaveIcon />}
              sx={{ textTransform: 'none', borderRadius: 2.5, fontWeight: 800, px: 4, py: 1.2, fontSize: '0.95rem' }}
            >
              {loading ? 'Kaydediliyor...' : t('save')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Printable Receipt Dialog (Fiş Oluştur Modalı) */}
      <Dialog
        open={receiptOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setReceiptOpen(false);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('officialReceiptTitle')}</span>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button startIcon={<PrintIcon />} variant="contained" onClick={handlePrintReceipt} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
              {t('printPdfBtn')}
            </Button>
            <IconButton size="small" onClick={() => setReceiptOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {createdResult && (
            <Box sx={{ p: 2, bgcolor: '#ffffff', color: '#0f172a' }}>
              <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px solid #0f172a', pb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  DEPO & STOK YÖNETİM MODÜLÜ (YM-02)
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569' }}>
                  {t('officialReceiptSub')}
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>{t('receiptNo')}:</strong> {createdResult.fisNo}</Typography>
                  <Typography variant="body2"><strong>{t('date')}:</strong> {new Date(createdResult.tarih).toLocaleString('tr-TR')}</Typography>
                  <Typography variant="body2"><strong>{t('movementType')}:</strong> {createdResult.hareketTipiAd}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>{t('sourceWarehouse')}:</strong> {createdResult.kaynakDepoAd || '-'}</Typography>
                  <Typography variant="body2"><strong>{t('targetWarehouse')}:</strong> {createdResult.hedefDepoAd || '-'}</Typography>
                  <Typography variant="body2"><strong>{t('description')}:</strong> {createdResult.aciklama || '-'}</Typography>
                </Grid>
              </Grid>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>{t('materialCode')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('materialName')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{t('quantity')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('shelf')} / {t('cell')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{t('status')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{t('unitPrice')}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{t('lineTotal')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {createdResult.kalemler?.map((k, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{k.malzemeKodu}</TableCell>
                        <TableCell>{k.malzemeAdi}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{k.miktar} {k.birim}</TableCell>
                        <TableCell>{k.raf || '-'}/{k.huycre || '-'}</TableCell>
                        <TableCell>{k.malzemeDurumuAd}</TableCell>
                        <TableCell align="right">{formatMoney(k.birimFiyat)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatMoney(k.satirToplam)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #cbd5e1' }}>
                <Box sx={{ textAlign: 'center', width: 200 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{t('deliveredBy')}</Typography>
                  <Box sx={{ height: 40 }} />
                  <Typography variant="caption">{t('stampSignature')}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: 200 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{t('receivedBy')}</Typography>
                  <Box sx={{ height: 40 }} />
                  <Typography variant="caption">{t('stampSignature')}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setReceiptOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>
            {t('close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StokFisForm;
