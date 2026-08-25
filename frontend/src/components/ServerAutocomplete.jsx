import React, { useState, useEffect, useRef } from 'react';
import { Autocomplete, TextField, CircularProgress, Typography, Box } from '@mui/material';
import api from '../api/client';

/**
 * ServerAutocomplete - 5 Milyon+ Kayıtta Ultra Hızlı & Sıfır Donma Garantili Arama Bileşeni
 * 
 * Mimarî İlkeler:
 * 1. Debounce (300ms): Her harf basışında sorgu atmaz, yazma bittikten 300ms sonra tek sorgu atar.
 * 2. Min Karakter Sınırı (Min 2 Harf): 5 milyon verinin hepsini indirmez!
 * 3. SQL Server-Side Take(20): Veritabanından sadece en alakalı İLK 20 KAYIT çekilir (RAM yükü 0).
 */
const ServerAutocomplete = ({
  fetchUrl = '/malzemeler',
  label = 'Malzeme Ara...',
  placeholder = 'Aramak için yazın... (Örn: reg, pe, van)',
  value,
  onChange,
  getOptionLabel = (opt) => (typeof opt === 'string' ? opt : `${opt.kod || ''} - ${opt.ad || opt.kod || ''}`),
  fullWidth = true,
  size = 'small',
  minChars = 2,
  limit = 20,
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const timerRef = useRef(null);

  useEffect(() => {
    // Eğer 2 harften az yazıldıysa veritabanını hiç yorma
    if (!inputValue || inputValue.trim().length < minChars) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // DEBOUNCE: Kullanıcı tuşlara basarken her harfte sorgu atmaz!
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(fetchUrl, {
          params: {
            q: inputValue.trim(),
            pageSize: limit, // 5 Milyon kayıt olsa bile veritabanından SADECE 20 KAYIT çekilir!
          },
        });
        setOptions(res.data.items || res.data || []);
      } catch (err) {
        console.error('ServerAutocomplete hatası:', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms bekleme süresi

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputValue, fetchUrl, minChars, limit]);

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      onInputChange={(event, newInputValue) => setInputValue(newInputValue)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id || option.kod === val.kod}
      filterOptions={(x) => x} // Sunucu zaten filtrelenmiş 20 kaydı getirdiği için istemci taraflı ekstra filtreleme yapmaz
      slotProps={{
        paper: {
          sx: {
            minWidth: 380,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            borderRadius: 2,
            '& .MuiAutocomplete-option': {
              py: 1.2,
              px: 2,
              fontSize: '0.9rem',
              fontWeight: 600,
              borderBottom: '1px solid #f1f5f9',
            },
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          InputLabelProps={{ style: { fontWeight: 700 } }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="primary" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      noOptionsText={
        inputValue.length < minChars
          ? `En az ${minChars} harf yazınız...`
          : 'Eşleşen ürün bulunamadı.'
      }
    />
  );
};

export default ServerAutocomplete;
