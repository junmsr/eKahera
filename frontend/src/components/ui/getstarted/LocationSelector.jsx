import React, { useState, useEffect } from "react";
import { getRegions, getProvinces, getCities, getBarangays } from "../../../lib/locationApi";

export default function LocationSelector({ form, errors, handleLocationChange }) {
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegions = async () => {
      setLoading((l) => ({ ...l, regions: true }));
      setError(null);
      try {
        const data = await getRegions();
        setRegions(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load regions. Please check your connection and try again.");
      } finally {
        setLoading((l) => ({ ...l, regions: false }));
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    if (form.region) {
      const fetchProvinces = async () => {
        setLoading((l) => ({ ...l, provinces: true }));
        try {
          const data = await getProvinces(form.region);
          setProvinces(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading((l) => ({ ...l, provinces: false }));
        }
      };
      fetchProvinces();
    }
  }, [form.region]);

  useEffect(() => {
    if (form.province) {
      const fetchCities = async () => {
        setLoading((l) => ({ ...l, cities: true }));
        try {
          const data = await getCities(form.province);
          setCities(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading((l) => ({ ...l, cities: false }));
        }
      };
      fetchCities();
    }
  }, [form.province]);

  useEffect(() => {
    if (form.city) {
      const fetchBarangays = async () => {
        setLoading((l) => ({ ...l, barangays: true }));
        try {
          const data = await getBarangays(form.city);
          setBarangays(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading((l) => ({ ...l, barangays: false }));
        }
      };
      fetchBarangays();
    }
  }, [form.city]);

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const selectedOption = e.target.options[e.target.selectedIndex];
    const locationName = selectedOption ? selectedOption.text : '';
    handleLocationChange(name, value, locationName);
  };

  return (
    <div className="grid gap-4">
      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Region <span className="text-red-500">*</span>
        </label>
        <select
          name="region"
          value={form.region}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          style={{ borderColor: errors.region ? '#ef4444' : '' }}
          disabled={loading.regions}
        >
          <option value="">{loading.regions ? 'Loading...' : 'Select Region'}</option>
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        {errors.region && (
          <p className="text-red-500 text-sm mt-1">{errors.region}</p>
        )}
        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Province <span className="text-red-500">*</span>
        </label>
        <select
          name="province"
          value={form.province}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          style={{ borderColor: errors.province ? '#ef4444' : '' }}
          disabled={!form.region || loading.provinces}
        >
          <option value="">{loading.provinces ? 'Loading...' : 'Select Province'}</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
        {errors.province && (
          <p className="text-red-500 text-sm mt-1">{errors.province}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          City/Municipality <span className="text-red-500">*</span>
        </label>
        <select
          name="city"
          value={form.city}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          style={{ borderColor: errors.city ? '#ef4444' : '' }}
          disabled={!form.province || loading.cities}
        >
          <option value="">{loading.cities ? 'Loading...' : 'Select City/Municipality'}</option>
          {cities.map((city) => (
            <option key={city.code} value={city.code}>
              {city.name}
            </option>
          ))}
        </select>
        {errors.city && (
          <p className="text-red-500 text-sm mt-1">{errors.city}</p>
        )}
      </div>

      <div>
        <label className="block mb-1 text-sm text-gray-700 font-medium">
          Barangay <span className="text-red-500">*</span>
        </label>
        <select
          name="barangay"
          value={form.barangay}
          onChange={handleSelectChange}
          className="w-full px-3 py-2 border border--gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          style={{ borderColor: errors.barangay ? '#ef4444' : '' }}
          disabled={!form.city || loading.barangays}
        >
          <option value="">{loading.barangays ? 'Loading...' : 'Select Barangay'}</option>
          {barangays.map((barangay) => (
            <option key={barangay.code} value={barangay.code}>
              {barangay.name}
            </option>
          ))}
        </select>
        {errors.barangay && (
          <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
        )}
      </div>
    </div>
  );
}
