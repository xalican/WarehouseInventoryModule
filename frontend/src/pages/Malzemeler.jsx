import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Autocomplete,
  TablePagination,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  AccountTree as TreeIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

const STANDARDIZED_UNITS = [
  { value: 'Adet', label: 'Adet (Pcs)' },
  { value: 'Metre', label: 'Metre (Meter)' },
  { value: 'Kg', label: 'Kg (Kilogram)' },
  { value: 'Paket', label: 'Paket (Package)' },
  { value: 'Kutu', label: 'Kutu (Box)' },
  { value: 'Litre', label: 'Litre (Liter)' },
  { value: 'Ton', label: 'Ton' },
  { value: 'Set', label: 'Set' },
  { value: 'Rulo', label: 'Rulo (Roll)' },
  { value: 'Plaka', label: 'Plaka (Plate)' },
];

const Malzemeler = () => {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const [gruplar, setGruplar] = useState([]);
  const [allMalzemeler, setAllMalzemeler] = useState([]);
  const [selectedGrup, setSelectedGrup] = useState('');
  const [selectedMalzeme, setSelectedMalzeme] = useState(null);
  const [search, setSearch] = useState('');

  // Dialog State
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Form State with Extended Properties
  const [kod, setKod] = useState('');
  const [selectedAdOption, setSelectedAdOption] = useState(null);
  const [customAdInput, setCustomAdInput] = useState('');
  const [birim, setBirim] = useState('Adet');
  const [malzemeGrubuId, setMalzemeGrubuId] = useState('');
  const [markaModel, setMarkaModel] = useState('');
  const [teknikOzellik, setTeknikOzellik] = useState('');
  const [kritikStokSeviyesi, setKritikStokSeviyesi] = useState(10);
  const [maxStokSeviyesi, setMaxStokSeviyesi] = useState(500);
  const [aciklama, setAciklama] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic Birimler State & Quick Add Birim Modal State
  const [birimlerList, setBirimlerList] = useState([]);
  const [addBirimOpen, setAddBirimOpen] = useState(false);
  const [yeniBirimAd, setYeniBirimAd] = useState('');
  const [yeniBirimSembol, setYeniBirimSembol] = useState('');
  const [birimError, setBirimError] = useState('');

  // Category Tree & Sub-Category Modal States
  const [addGrupOpen, setAddGrupOpen] = useState(false);
  const [yeniGrupAd, setYeniGrupAd] = useState('');
  const [yeniGrupParentId, setYeniGrupParentId] = useState('');
  const [grupError, setGrupError] = useState('');

  // Tree Node Expand / Collapse State
  const [expandedNodes, setExpandedNodes] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [dropdownExpandedNodes, setDropdownExpandedNodes] = useState({});

  const toggleNodeExpand = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const toggleDropdownNode = (nodeId, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDropdownExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleToggleAllNodes = (e) => {
    e.stopPropagation();
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded = {};
    gruplar.forEach((g) => {
      newExpanded[g.id] = nextState;
    });
    setExpandedNodes(newExpanded);
  };

  // Category Tree Construction (Kök ➔ Alt Kategori ➔ Alt Alt Kategori Hiyerarşisi)
  const categoryTree = useMemo(() => {
    if (!Array.isArray(gruplar) || gruplar.length === 0) return [];

    const map = {};
    const roots = [];

    gruplar.forEach((g) => {
      if (g && g.id != null) {
        map[g.id] = { ...g, children: [] };
      }
    });

    gruplar.forEach((g) => {
      if (g && g.id != null) {
        if (g.parentId && map[g.parentId]) {
          map[g.parentId].children.push(map[g.id]);
        } else {
          roots.push(map[g.id]);
        }
      }
    });

    return roots;
  }, [gruplar]);

  const handleAddGrupSubmit = async (e) => {
    e.preventDefault();
    setGrupError('');
    if (!yeniGrupAd.trim()) {
      setGrupError('Kategori adı boş olamaz.');
      return;
    }
    try {
      await api.post('/malzemeler/gruplar', {
        ad: yeniGrupAd.trim(),
        parentId: yeniGrupParentId ? parseInt(yeniGrupParentId) : null,
      });
      setYeniGrupAd('');
      setYeniGrupParentId('');
      setAddGrupOpen(false);
      fetchMalzemeler();
    } catch (err) {
      setGrupError(err.response?.data?.message || 'Kategori eklenirken bir hata oluştu.');
    }
  };

  const fetchBirimler = async () => {
    try {
      const res = await api.get('/birimler');
      if (res.data && res.data.length > 0) {
        setBirimlerList(res.data);
      }
    } catch (err) {
      console.warn('Dinamik birimler çekilemedi, varsayılan birimler kullanılıyor:', err);
    }
  };

  const handleAddBirimSubmit = async (e) => {
    e.preventDefault();
    setBirimError('');
    if (!yeniBirimAd.trim()) {
      setBirimError('Birim adı boş olamaz.');
      return;
    }
    try {
      const res = await api.post('/birimler', { ad: yeniBirimAd.trim(), sembol: yeniBirimSembol.trim() });
      await fetchBirimler();
      setBirim(res.data.ad || yeniBirimAd.trim());
      setYeniBirimAd('');
      setYeniBirimSembol('');
      setAddBirimOpen(false);
    } catch (err) {
      setBirimError(err.response?.data?.message || 'Birim eklenirken bir hata oluştu.');
    }
  };

  const fetchMalzemeler = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        pageSize: pageSize,
      };
      if (selectedGrup) params.grupId = selectedGrup;
      if (selectedMalzeme) {
        params.q = selectedMalzeme.kod || selectedMalzeme.ad;
      } else if (search && search.trim().length >= 3) {
        params.q = search.trim();
      }

      const [mRes, gRes, allMRes] = await Promise.all([
        api.get('/malzemeler', { params }),
        api.get('/malzemeler/gruplar'),
        api.get('/malzemeler', { params: { pageSize: 500 } }),
      ]);

      setItems(mRes.data.items || []);
      setTotalCount(mRes.data.totalCount || 0);
      setGruplar(gRes.data || []);
      setAllMalzemeler(allMRes.data.items || []);
    } catch (err) {
      console.error('Malzemeler çekilemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMalzemeler();
    fetchBirimler();
  }, [selectedGrup, selectedMalzeme, search, page, pageSize]);

  // KATEGORİYE ÖZEL İSİM FİLTRESİ (Strict Scope: Başka Kategorinin Ürünü Gözükmez!)
  const filteredNameOptions = allMalzemeler.filter((m) => {
    if (!malzemeGrubuId) return false;
    return m.malzemeGrubuId === parseInt(malzemeGrubuId);
  });

  const handleOpenAdd = () => {
    setEditItem(null);
    const defaultGrup = gruplar.length > 0 ? gruplar[0].id : '';
    setMalzemeGrubuId(defaultGrup);
    setSelectedAdOption(null);
    setCustomAdInput('');
    setKod(`MLZ-${Date.now().toString().slice(-4)}`);
    setBirim('Adet');
    setMarkaModel('');
    setTeknikOzellik('');
    setKritikStokSeviyesi(10);
    setMaxStokSeviyesi(500);
    setAciklama('');
    setIsActive(true);
    setError('');
    setOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setMalzemeGrubuId(item.malzemeGrubuId);
    setSelectedAdOption(item);
    setCustomAdInput(item.ad);
    setKod(item.kod);
    setBirim(item.birim || 'Adet');
    setMarkaModel(item.markaModel || '');
    setTeknikOzellik(item.teknikOzellik || '');
    setKritikStokSeviyesi(item.kritikStokSeviyesi || 10);
    setMaxStokSeviyesi(item.maxStokSeviyesi || 500);
    setAciklama(item.aciklama || '');
    setIsActive(item.isActive !== false);
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const finalAd = selectedAdOption
      ? (typeof selectedAdOption === 'string' ? selectedAdOption : selectedAdOption.ad)
      : customAdInput;

    if (!malzemeGrubuId) {
      setError('Lütfen bir Malzeme Kategorisi seçiniz.');
      return;
    }
    if (!finalAd || !finalAd.trim()) {
      setError('Lütfen geçerli bir Malzeme Adı seçiniz veya yazınız.');
      return;
    }
    if (parseFloat(maxStokSeviyesi) < parseFloat(kritikStokSeviyesi)) {
      setError('Maksimum stok seviyesi, kritik stok seviyesinden küçük olamaz.');
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        await api.put(`/malzemeler/${editItem.id}`, {
          birim,
          malzemeGrubuId: parseInt(malzemeGrubuId),
          markaModel,
          teknikOzellik,
          kritikStokSeviyesi: parseFloat(kritikStokSeviyesi),
          maxStokSeviyesi: parseFloat(maxStokSeviyesi),
          aciklama,
          isActive,
        });
      } else {
        await api.post('/malzemeler', {
          kod,
          ad: finalAd.trim(),
          birim,
          malzemeGrubuId: parseInt(malzemeGrubuId),
          markaModel,
          teknikOzellik,
          kritikStokSeviyesi: parseFloat(kritikStokSeviyesi),
          maxStokSeviyesi: parseFloat(maxStokSeviyesi),
          aciklama,
        });
      }
      setOpen(false);
      fetchMalzemeler();
    } catch (err) {
      setError(err.response?.data?.message || 'İşlem başarısız oldu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Recursive Renderer for Category Dropdown Options (Expandable / Collapsible Menu Items)
  const renderCategoryOptions = (tree, depth = 0) => {
    if (!Array.isArray(tree)) return [];
    let options = [];
    tree.forEach((node) => {
      if (!node || node.id == null) return;

      const isRoot = depth === 0;
      const isSub = depth === 1;
      const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = Boolean(dropdownExpandedNodes[node.id]);

      options.push(
        <MenuItem
          key={node.id}
          value={node.id}
          sx={{
            pl: depth * 2.8 + 1.5,
            py: isRoot ? 1.1 : 0.8,
            fontWeight: isRoot ? 800 : isSub ? 700 : 600,
            fontSize: isRoot ? '0.92rem' : '0.86rem',
            color: isRoot ? '#0f172a' : isSub ? '#059669' : '#d97706',
            bgcolor: isRoot ? '#f8fafc' : 'transparent',
            borderBottom: isRoot ? '1px solid #f1f5f9' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            '&:hover': { bgcolor: '#eff6ff' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={(e) => toggleDropdownNode(node.id, e)}
                sx={{ p: 0.2, color: '#64748b', '&:hover': { bgcolor: '#cbd5e1' } }}
              >
                {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            ) : (
              <Box sx={{ width: 24 }} />
            )}

            {isRoot ? (
              <FolderIcon sx={{ color: '#2563eb', fontSize: '1.15rem' }} />
            ) : isSub ? (
              <FolderOpenIcon sx={{ color: '#059669', fontSize: '1.05rem' }} />
            ) : (
              <CategoryIcon sx={{ color: '#d97706', fontSize: '0.95rem' }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 'inherit', color: 'inherit' }}>
              {node.ad}
            </Typography>
          </Box>

          {hasChildren && (
            <Chip
              label={`${node.children.length}`}
              size="small"
              onClick={(e) => toggleDropdownNode(node.id, e)}
              sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#e2e8f0', color: '#475569', cursor: 'pointer' }}
            />
          )}
        </MenuItem>
      );

      if (hasChildren && isExpanded) {
        options = options.concat(renderCategoryOptions(node.children, depth + 1));
      }
    });
    return options;
  };

  // Recursive Renderer for Category Tree View Nodes (Modern Enterprise UI)
  const renderTreeNode = (node, depth = 0) => {
    if (!node || node.id == null) return null;
    const isSelected = selectedGrup === node.id || selectedGrup === node.id.toString();
    const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = Boolean(expandedNodes[node.id]);

    return (
      <Box key={node.id} sx={{ ml: depth > 0 ? 3 : 0, my: 0.5, position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
            py: 0.9,
            px: 2,
            borderRadius: 2,
            bgcolor: isSelected ? '#eff6ff' : '#ffffff',
            border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
            borderLeft: isSelected ? '4px solid #2563eb' : '1px solid #e2e8f0',
            cursor: 'pointer',
            width: '100%',
            maxWidth: 580,
            boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease-in-out',
            '&:hover': { bgcolor: isSelected ? '#dbeafe' : '#f8fafc', borderColor: isSelected ? '#2563eb' : '#cbd5e1' },
          }}
          onClick={() => {
            setSelectedGrup(isSelected ? '' : node.id);
            setPage(0);
          }}
        >
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={(e) => toggleNodeExpand(node.id, e)}
              sx={{
                p: 0.4,
                color: '#475569',
                bgcolor: '#f1f5f9',
                '&:hover': { bgcolor: '#cbd5e1' },
              }}
            >
              {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
            </IconButton>
          ) : (
            <Box sx={{ width: 28 }} />
          )}

          {depth === 0 ? (
            <FolderIcon sx={{ color: '#2563eb', fontSize: '1.25rem' }} />
          ) : depth === 1 ? (
            <FolderOpenIcon sx={{ color: '#059669', fontSize: '1.15rem' }} />
          ) : (
            <CategoryIcon sx={{ color: '#d97706', fontSize: '1rem' }} />
          )}

          <Typography
            variant="body2"
            sx={{
              fontWeight: depth === 0 ? 800 : depth === 1 ? 700 : 600,
              color: depth === 0 ? '#0f172a' : '#334155',
              fontSize: depth === 0 ? '0.92rem' : '0.86rem',
              flexGrow: 1,
            }}
          >
            {node.ad}
          </Typography>

          {hasChildren && (
            <Chip
              label={`${node.children.length} Alt Kategori`}
              size="small"
              sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#475569' }}
            />
          )}

          {isSelected && (
            <Chip label="🎯 Seçili Filtre" size="small" color="primary" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 800 }} />
          )}
        </Box>

        {hasChildren && isExpanded && (
          <Box sx={{ borderLeft: '2px solid #cbd5e1', ml: 2.2, pl: 1.5, mt: 0.5, mb: 0.5 }}>
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
          <TreeIcon color="primary" /> Kategori & Malzeme Kataloğu
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setAddGrupOpen(true)}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 2.5 }}
          >
            ➕ Yeni Kategori / Alt Kategori Ekle
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, px: 3, py: 1 }}
          >
            {t('addNewMaterial')}
          </Button>
        </Box>
      </Box>

      {/* 🌳 HİYERARŞİK KATEGORİ AĞACI (MODERN ENTERPRISE COLLAPSIBLE TREE) */}
      <Accordion sx={{ mb: 3, borderRadius: '12px !important', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f8fafc', borderRadius: '12px', px: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <TreeIcon sx={{ color: '#2563eb' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>
                Kategori Ağacı ({gruplar.length} Kategori)
              </Typography>
              {selectedGrup && (
                <Chip
                  label="Filtreyi Temizle"
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGrup('');
                    setPage(0);
                  }}
                  sx={{ ml: 1, fontWeight: 800 }}
                />
              )}
            </Box>

            <Button
              size="small"
              variant="outlined"
              onClick={handleToggleAllNodes}
              sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', py: 0.4, px: 1.5, borderRadius: 2 }}
            >
              {allExpanded ? '📂 Tümünü Kapat' : '📖 Tümünü Aç'}
            </Button>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          {categoryTree.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {categoryTree.map((rootNode) => renderTreeNode(rootNode, 0))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Kategori bulunamadı.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Filter Bar */}
      <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2.5,
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Malzeme Grubu Hiyerarşik Filtresi */}
            <Box sx={{ flex: '1 1 300px', minWidth: 260 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="📁 Kategori Süzgeci"
                value={selectedGrup}
                onChange={(e) => {
                  setSelectedGrup(e.target.value);
                  setPage(0);
                }}
                SelectProps={{
                  renderValue: (selectedId) => {
                    if (!selectedId) return 'Tüm Kategoriler ve Alt Kategoriler';
                    const selectedItem = gruplar.find((g) => g.id === parseInt(selectedId) || g.id === selectedId);
                    if (!selectedItem) return selectedId;
                    const parentItem = selectedItem.parentId ? gruplar.find((g) => g.id === selectedItem.parentId) : null;
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {selectedItem.parentId ? '📂' : '📁'} {selectedItem.ad}
                        </Typography>
                        {parentItem && (
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            ({parentItem.ad})
                          </Typography>
                        )}
                      </Box>
                    );
                  },
                }}
                sx={{ width: '100%' }}
              >
                <MenuItem value="">Tüm Kategoriler ve Alt Kategoriler</MenuItem>
                {renderCategoryOptions(categoryTree)}
              </TextField>
            </Box>

            {/* Malzeme Ara Autocomplete */}
            <Box sx={{ flex: '1 1 340px', minWidth: 280 }}>
              <Autocomplete
                fullWidth
                size="small"
                freeSolo
                options={allMalzemeler}
                getOptionLabel={(option) => typeof option === 'string' ? option : `${option.kod} - ${option.ad}`}
                value={selectedMalzeme}
                onInputChange={(event, newInputValue) => {
                  setSearch(newInputValue);
                  if (newInputValue.length >= 3 || newInputValue.length === 0) {
                    setPage(0);
                  }
                }}
                onChange={(event, newValue) => {
                  setSelectedMalzeme(typeof newValue === 'string' ? null : newValue);
                  setPage(0);
                }}
                ListboxProps={{
                  sx: {
                    minWidth: 380,
                    maxHeight: 300,
                    '& .MuiAutocomplete-option': { py: 1.2 },
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('searchMaterial')}
                    placeholder={t('searchMaterialPlaceholder')}
                    sx={{ width: '100%' }}
                  />
                )}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Materials Table */}
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
                minWidth: 750,
                '& .MuiTableCell-root': {
                  py: 0.7,
                  px: 1.8,
                  fontSize: '0.86rem',
                },
              }}
            >
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('materialCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('materialName')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('category')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('unit')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Marka / Model</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Teknik Özellik</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Min / Max Limit</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('status')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      {t('noRecords')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row) => (
                    <TableRow key={row.id} hover sx={{ opacity: row.isActive ? 1 : 0.55 }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{row.kod}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.ad}</TableCell>
                      <TableCell>{row.malzemeGrubuAd}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#2563eb' }}>
                        {lang === 'en' && row.birim === 'Adet' ? 'Pcs' : row.birim}
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{row.markaModel || '-'}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{row.teknikOzellik || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        <span style={{ color: '#dc2626' }}>{row.kritikStokSeviyesi}</span> / <span style={{ color: '#166534' }}>{row.maxStokSeviyesi || 1000}</span> {row.birim}
                      </TableCell>
                      <TableCell align="center">
                        {row.isActive ? (
                          <Chip label={t('active')} color="success" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Chip label={t('passive')} color="default" size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('edit')}>
                          <IconButton color="primary" size="small" onClick={() => handleOpenEdit(row)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
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

      {/* LARGE SPACIOUS DIALOG MODAL (maxWidth="lg") */}
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setOpen(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editItem ? t('editMaterialTitle') : t('newMaterialTitle')}
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent dividers sx={{ p: 3.5 }}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

            {/* FLEXBOX BASED EXPLICIT ROW-BY-ROW FORM LAYOUT (ZERO GRID BUG) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>

              {/* SATIR 1: ADIM 1 - KATEGORİ SEÇİMİ (BAĞIMSIZ TAM 100% SATIR GENİŞLİĞİ) */}
              <Box sx={{ width: '100%' }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="1. Malzeme Kategorisi Seçiniz *"
                  value={malzemeGrubuId}
                  onChange={(e) => {
                    setMalzemeGrubuId(e.target.value);
                    setSelectedAdOption(null);
                  }}
                  required
                  SelectProps={{
                    renderValue: (selectedId) => {
                      if (!selectedId) return 'Kategori Seçiniz';
                      const selectedItem = gruplar.find((g) => g.id === parseInt(selectedId) || g.id === selectedId);
                      if (!selectedItem) return selectedId;
                      const parentItem = selectedItem.parentId ? gruplar.find((g) => g.id === selectedItem.parentId) : null;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {selectedItem.parentId ? '📂' : '📁'} {selectedItem.ad}
                          </Typography>
                          {parentItem && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                              ({parentItem.ad})
                            </Typography>
                          )}
                        </Box>
                      );
                    },
                  }}
                  InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                >
                  {renderCategoryOptions(categoryTree)}
                </TextField>
              </Box>

              {/* SATIR 2: ADIM 2 - MALZEME ADI (AUTOCOMPLETE - BAĞIMSIZ TAM 100% SATIR GENİŞLİĞİ) */}
              <Box sx={{ width: '100%' }}>
                <Autocomplete
                  fullWidth
                  freeSolo
                  disabled={!malzemeGrubuId}
                  options={filteredNameOptions}
                  getOptionLabel={(option) => typeof option === 'string' ? option : `${option.kod} - ${option.ad}`}
                  filterOptions={(options, state) => {
                    if (!state.inputValue) return options;
                    const search = state.inputValue.toLowerCase();
                    return options.filter(
                      (opt) =>
                        opt.ad.toLowerCase().includes(search) ||
                        opt.kod.toLowerCase().includes(search)
                    );
                  }}
                  value={selectedAdOption}
                  onInputChange={(e, newValue) => setCustomAdInput(newValue)}
                  onChange={(e, newValue) => setSelectedAdOption(newValue)}
                  slotProps={{
                    paper: {
                      sx: {
                        width: '100%',
                        minWidth: 500,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                        borderRadius: 2.5,
                        mt: 1,
                        '& .MuiAutocomplete-option': {
                          py: 1.5,
                          px: 2.5,
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: '#0f172a',
                          whiteSpace: 'normal',
                          wordBreak: 'normal',
                          borderBottom: '1px solid #f1f5f9',
                          '&:hover': { bgcolor: '#eff6ff' },
                        },
                      },
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      label="2. Malzeme Adı Seçiniz veya Yazınız (Canlı Arama: Örn reg, pe, van) *"
                      placeholder={
                        malzemeGrubuId
                          ? `Aramak için ürün adı veya kodu yazın... [Kategorideki ${filteredNameOptions.length} adet ürün süzülür]`
                          : 'Önce 1. adımdan Malzeme Kategorisi Seçiniz...'
                      }
                      required={!editItem}
                      InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                    />
                  )}
                />
              </Box>

              {/* SATIR 3: ADIM 3 - BİRİM SEÇİMİ & MALZEME KODU (NİZAMİ İKİ EŞİT FLEX SÜTUNU) */}
              <Box sx={{ display: 'flex', gap: 2.5, width: '100%', flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 240px', display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="3. Birim Türü Seçiniz *"
                    value={birim}
                    onChange={(e) => setBirim(e.target.value)}
                    required
                    InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                  >
                    {(birimlerList.length > 0 ? birimlerList : STANDARDIZED_UNITS).map((u) => (
                      <MenuItem key={u.id || u.value} value={u.ad || u.value}>
                        {u.ad ? `${u.ad} (${u.sembol})` : u.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Tooltip title="Sistemde Olmayan Yeni Birim Türü Ekle">
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => setAddBirimOpen(true)}
                      sx={{ minWidth: 42, px: 1.5, height: 40, fontWeight: 800, borderRadius: 2, fontSize: '1rem' }}
                    >
                      +
                    </Button>
                  </Tooltip>
                </Box>

                <Box sx={{ flex: '1 1 240px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Malzeme Kodu *"
                    value={kod}
                    onChange={(e) => setKod(e.target.value)}
                    disabled={Boolean(editItem)}
                    required
                    InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                  />
                </Box>

                {editItem && (
                  <Box sx={{ flex: '1 1 200px' }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={t('cardStatus')}
                      value={isActive ? 'true' : 'false'}
                      onChange={(e) => setIsActive(e.target.value === 'true')}
                    >
                      <MenuItem value="true">🟢 {t('active')}</MenuItem>
                      <MenuItem value="false">🔴 {t('passive')}</MenuItem>
                    </TextField>
                  </Box>
                )}
              </Box>

              {/* EK ÖZELLİKLER SECTİON BAŞLIĞI */}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mt: 1, pb: 0.5, borderBottom: '2px solid #2563eb' }}>
                📋 Ek Malzeme Nitelikleri & Teknik Özellikleri
              </Typography>

              {/* MARKA / MODEL & TEKNİK ÖZELLİK (NİZAMİ İKİ EŞİT FLEX SÜTUNU) */}
              <Box sx={{ display: 'flex', gap: 2.5, width: '100%', flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 280px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Marka / Üretici / Model"
                    placeholder="Örn: Pietro Fiorentini, Wavin, Kalde"
                    value={markaModel}
                    onChange={(e) => setMarkaModel(e.target.value)}
                    InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                  />
                </Box>

                <Box sx={{ flex: '1 1 280px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Teknik Özellikler / Ölçü"
                    placeholder="Örn: DN-25 PN16, PE-80 SDR11 63mm"
                    value={teknikOzellik}
                    onChange={(e) => setTeknikOzellik(e.target.value)}
                    InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                  />
                </Box>
              </Box>

              {/* MIN STOK & MAX STOK LİMİTLERİ (NİZAMİ İKİ EŞİT FLEX SÜTUNU) */}
              <Box sx={{ display: 'flex', gap: 2.5, width: '100%', flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 280px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Kritik Stok Seviyesi (Min Limit) *"
                    value={kritikStokSeviyesi}
                    onChange={(e) => setKritikStokSeviyesi(e.target.value)}
                    required
                    InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                  />
                </Box>

                <Box sx={{ flex: '1 1 280px' }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Maksimum Stok Seviyesi (Max Limit) *"
                    value={maxStokSeviyesi}
                    onChange={(e) => setMaxStokSeviyesi(e.target.value)}
                    required
                    InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                  />
                </Box>
              </Box>

              {/* AÇIKLAMA / NOTLAR (KOMPAKT KUTU) */}
              <Box sx={{ width: '100%' }}>
                <TextField
                  fullWidth
                  size="small"
                  rows={1.5}
                  multiline
                  label="Açıklama / Teknik Notlar"
                  placeholder="Ürün kullanımı ve teknik şartname notları..."
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  InputLabelProps={{ style: { fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' } }}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none', fontWeight: 700, px: 3 }}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2.5, px: 4, py: 1.2, fontSize: '0.95rem' }}
            >
              {submitting ? 'Kaydediliyor...' : t('save')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Quick Add Unit Modal Dialog */}
      <Dialog
        open={addBirimOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setAddBirimOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ➕ Yeni Ölçü Birimi Tanımla
          <IconButton size="small" onClick={() => setAddBirimOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleAddBirimSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            {birimError && <Alert severity="error" sx={{ mb: 2 }}>{birimError}</Alert>}
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Sistemde mevcut olmayan yeni bir ölçü birimi (Örn: Galon, Varil, Palet, Koli vb.) tanımlayabilirsiniz:
            </Typography>
            <TextField
              margin="dense"
              fullWidth
              size="small"
              label="Birim Adı (Örn: Galon, Varil, Palet, Koli) *"
              value={yeniBirimAd}
              onChange={(e) => setYeniBirimAd(e.target.value)}
              required
            />
            <TextField
              margin="dense"
              fullWidth
              size="small"
              label="Kısaltma / Sembol (Örn: gal, vrl, plt)"
              value={yeniBirimSembol}
              onChange={(e) => setYeniBirimSembol(e.target.value)}
              helperText="Opsiyoneldir. Yazılmazsa Birim Adı kullanılır."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddBirimOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>
              Vazgeç
            </Button>
            <Button type="submit" variant="contained" color="secondary" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5, px: 3 }}>
              Birim Kaydet & Seç
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Quick Add Category & Sub-Category Modal Dialog */}
      <Dialog
        open={addGrupOpen}
        onClose={(event, reason) => {
          if (reason !== 'backdropClick') setAddGrupOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          ➕ Yeni Kategori veya Alt Kategori Ekle
          <IconButton size="small" onClick={() => setAddGrupOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleAddGrupSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            {grupError && <Alert severity="error" sx={{ mb: 2 }}>{grupError}</Alert>}
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              İster sıfırdan Ana Kategori (Örn: Yapı Malzemeleri), ister var olan bir kategorinin altına Alt Kategori (Örn: Yapı ➔ Borular ➔ Plastik PE Borular) ekleyebilirsiniz:
            </Typography>

            <TextField
              margin="dense"
              fullWidth
              size="small"
              label="Kategori Adı *"
              placeholder="Örn: Yapı Bakım Malzemeleri, Plastik PE Borular"
              value={yeniGrupAd}
              onChange={(e) => setYeniGrupAd(e.target.value)}
              required
            />

            <TextField
              select
              margin="dense"
              fullWidth
              size="small"
              label="Bağlı Olacağı Üst Kategori (Opsiyonel)"
              value={yeniGrupParentId}
              onChange={(e) => setYeniGrupParentId(e.target.value)}
              helperText="Boş bırakırsanız bağımsız Ana Kategori (Kök) olarak eklenir."
              sx={{ mt: 2 }}
            >
              <MenuItem value="">-- 📁 Ana Kategori (Kök Seviye) --</MenuItem>
              {renderCategoryOptions(categoryTree)}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setAddGrupOpen(false)} sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>
              Vazgeç
            </Button>
            <Button type="submit" variant="contained" color="secondary" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2.5, px: 3 }}>
              Kategoriyi Kaydet
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default Malzemeler;
