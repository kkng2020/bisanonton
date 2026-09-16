import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Mengambil kredensial Supabase dari environment variables
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
const supabaseKey = (process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Kredensial Supabase tidak lengkap. Harap pastikan SUPABASE_URL dan SUPABASE_KEY telah diisi di file .env.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
console.log('⚡ Database: 100% Menggunakan Supabase Cloud');

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.join(__dirname, '..', 'data', 'movies_cache.json');

// ==========================================
// OPERASI DATA (EKSKLUSIF SUPABASE DENGAN DISK & IN-MEMORY INSTANT CACHE)
// ==========================================

let moviesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

// Load disk cache on module startup for 0ms initial response
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
    if (Array.isArray(parsed) && parsed.length > 0) {
      moviesCache = parsed;
      cacheTimestamp = Date.now();
      console.log(`⚡ Loaded ${moviesCache.length} movies from disk cache (0ms instant startup)`);
    }
  }
} catch (err) {
  console.warn('⚠️ Disk cache read warning:', err.message);
}

function saveCacheToDisk(data) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️ Disk cache write warning:', err.message);
  }
}

export function invalidateMovieCache() {
  moviesCache = null;
  cacheTimestamp = 0;
  // Segera refresh cache di background
  refreshCacheFromSupabase().catch(console.warn);
}

async function refreshCacheFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      moviesCache = data;
      cacheTimestamp = Date.now();
      saveCacheToDisk(data);
      return data;
    }
  } catch (e) {
    console.warn('Background Supabase refresh error:', e.message);
  }
  return moviesCache;
}

// Background sync on startup to guarantee fresh data
refreshCacheFromSupabase().catch(() => {});

// 1. Dapatkan Semua Film / Serial (Dengan In-Memory & Disk Instant Cache)
export async function getAllMovies(filters = {}) {
  const isDefaultQuery = (!filters.type || filters.type === 'all') && !filters.search;
  
  // Return dari cache memori jika ada (super cepat 0ms)
  if (isDefaultQuery && moviesCache && moviesCache.length > 0) {
    // Jika cache sudah lebih dari 60 detik, refresh di background tanpa memblokir request
    if (Date.now() - cacheTimestamp > CACHE_TTL_MS) {
      refreshCacheFromSupabase().catch(console.warn);
    }
    return moviesCache;
  }

  let query = supabase.from('movies').select('*').order('created_at', { ascending: false });

  if (filters.type && filters.type !== 'all') {
    query = query.eq('type', filters.type);
  }

  if (filters.search) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${q},genre.ilike.${q},description.ilike.${q}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Supabase getAllMovies error:', error.message);
    // Jika ada fallback cache, gunakan fallback
    if (moviesCache) return moviesCache;
    throw error;
  }

  const results = data || [];
  if (isDefaultQuery) {
    moviesCache = results;
    cacheTimestamp = Date.now();
    saveCacheToDisk(results);
  }

  return results;
}

// 2. Dapatkan Film Berdasarkan ID
export async function getMovieById(id) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.warn(`Supabase getMovieById (${id}) warning:`, error.message);
    return null;
  }

  return data;
}

// 3. Tambah Film / Serial Baru
export async function createMovie(movieData) {
  const newMovie = {
    id: movieData.id || `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    title: movieData.title || 'Tanpa Judul',
    description: movieData.description || '',
    cover_url: movieData.cover_url || '',
    backdrop_url: movieData.backdrop_url || movieData.cover_url || '',
    type: movieData.type || 'movie',
    year: movieData.year ? Number(movieData.year) : new Date().getFullYear(),
    genre: movieData.genre || 'Favorit',
    stream_url: movieData.stream_url || '',
    episodes: Array.isArray(movieData.episodes) ? movieData.episodes : [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('movies')
    .insert([newMovie])
    .select()
    .single();

  if (error) {
    console.error('Supabase createMovie error:', error.message);
    throw error;
  }

  invalidateMovieCache();
  return data;
}

// 4. Update Film / Serial
export async function updateMovie(id, updateData) {
  const payload = {
    ...updateData,
    updated_at: new Date().toISOString()
  };
  if (payload.year !== undefined) payload.year = Number(payload.year);

  const { data, error } = await supabase
    .from('movies')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateMovie error:', error.message);
    throw error;
  }

  invalidateMovieCache();
  return data;
}

// 5. Hapus Film / Serial
export async function deleteMovie(id) {
  const { error } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteMovie error:', error.message);
    throw error;
  }

  invalidateMovieCache();
  return true;
}
