
const BASE_URL = 'https://psgc.cloud/api';

export async function getRegions() {
  const res = await fetch(`${BASE_URL}/regions`);
  if (!res.ok) throw new Error('Failed to fetch regions');
  return res.json();
}

export async function getProvinces(regionCode) {
  const res = await fetch(`${BASE_URL}/regions/${regionCode}/provinces`);
  if (!res.ok) throw new Error('Failed to fetch provinces');
  return res.json();
}

export async function getCities(provinceCode) {
  const res = await fetch(`${BASE_URL}/provinces/${provinceCode}/cities-municipalities`);
  if (!res.ok) throw new Error('Failed to fetch cities');
  return res.json();
}

export async function getBarangays(cityCode) {
  const res = await fetch(`${BASE_URL}/cities-municipalities/${cityCode}/barangays`);
  if (!res.ok) throw new Error('Failed to fetch barangays');
  return res.json();
}
