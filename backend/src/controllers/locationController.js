const fetch = require('node-fetch');

const PSGC_BASE_URL = 'https://psgc.cloud/api';

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
  }
  return response.json();
};

exports.getLocations = async (req, res) => {
  try {
    const regions = await fetchJson(`${PSGC_BASE_URL}/regions`);
    const provinces = await fetchJson(`${PSGC_BASE_URL}/provinces`);
    const citiesMunicipalities = await fetchJson(`${PSGC_BASE_URL}/cities-municipalities`);
    const barangays = await fetchJson(`${PSGC_BASE_URL}/barangays`);

    const structuredData = {};

    // Initialize regions
    regions.forEach(region => {
      structuredData[region.name] = {
        code: region.code,
        provinces: {}
      };
    });

    // Populate provinces within regions
    provinces.forEach(province => {
      const regionCode = province.code.substring(0, 2) + '00000000'; // Extract region code
      const region = Object.values(structuredData).find(r => r.code === regionCode);
      if (region) {
        region.provinces[province.name] = {
          code: province.code,
          citiesMunicipalities: {}
        };
      }
    });

    // Populate cities/municipalities within provinces
    citiesMunicipalities.forEach(cityMun => {
      const provinceCode = cityMun.code.substring(0, 4) + '000000'; // Extract province code
      Object.values(structuredData).forEach(region => {
        const province = Object.values(region.provinces).find(p => p.code === provinceCode);
        if (province) {
          province.citiesMunicipalities[cityMun.name] = {
            code: cityMun.code,
            barangays: []
          };
        }
      });
    });

    // Populate barangays within cities/municipalities
    barangays.forEach(barangay => {
      const cityMunCode = barangay.code.substring(0, 7) + '000'; // Extract city/municipality code
      Object.values(structuredData).forEach(region => {
        Object.values(region.provinces).forEach(province => {
          const cityMun = Object.values(province.citiesMunicipalities).find(cm => cm.code === cityMunCode);
          if (cityMun) {
            cityMun.barangays.push({
              name: barangay.name,
              code: barangay.code
            });
          }
        });
      });
    });

    res.json(structuredData);

  } catch (error) {
    console.error('Error fetching or structuring location data:', error);
    res.status(500).json({ error: 'Failed to retrieve location data' });
  }
};