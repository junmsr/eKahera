import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../../../lib/api";
import { BiMapPin, BiStore, BiPhone, BiEnvelope, BiListUl, BiMap } from "react-icons/bi";
import BusinessMap from "./BusinessMap";

export default function BusinessLocations() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRegion, setFilterRegion] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api("/api/business/public/all");
        
        if (response && response.businesses) {
          setBusinesses(response.businesses);
        } else {
          setBusinesses([]);
        }
      } catch (err) {
        console.error("Failed to fetch businesses:", err);
        setError("Failed to load business locations. Please try again later.");
        setBusinesses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  // Get unique regions for filter
  const uniqueRegions = Array.from(
    new Set(businesses.map((b) => b.region).filter(Boolean))
  ).sort();

  // Filter businesses by region
  const filteredBusinesses = filterRegion
    ? businesses.filter((b) => b.region === filterRegion)
    : businesses;

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading business locations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="py-12 text-center">
        <BiStore className="mx-auto text-6xl text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">
          No businesses are currently using eKahera.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Check back soon to see businesses in your area!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with filter and view toggle */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Find eKahera Businesses
            </h2>
            <p className="text-gray-600">
              Discover businesses using eKahera POS system in your area
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* View Toggle */}
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View:
              </label>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <BiListUl size={18} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "map"
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <BiMap size={18} />
                  <span>Map</span>
                </button>
              </div>
            </div>

            {/* Region Filter */}
            {uniqueRegions.length > 0 && (
              <div className="flex-shrink-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Region:
                </label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">All Regions</option>
                  {uniqueRegions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredBusinesses.length} of {businesses.length} businesses
        </div>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mb-8">
          <BusinessMap businesses={businesses} filterRegion={filterRegion} />
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Business Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business, index) => (
          <motion.div
            key={business.business_id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100"
          >
            {/* Business Name */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {business.business_name}
                </h3>
                {business.business_type && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                    {business.business_type}
                  </span>
                )}
              </div>
            </div>

            {/* Location Info */}
            <div className="space-y-3">
              {business.address && (
                <div className="flex items-start gap-2">
                  <BiMapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {business.address}
                    </p>
                    {business.region && (
                      <p className="text-xs text-gray-500 mt-1">
                        {business.region}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {business.mobile && (
                <div className="flex items-center gap-2">
                  <BiPhone className="text-gray-500 flex-shrink-0" size={18} />
                  <a
                    href={`tel:${business.mobile}`}
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {business.mobile}
                  </a>
                </div>
              )}

              {business.email && (
                <div className="flex items-center gap-2">
                  <BiEnvelope className="text-gray-500 flex-shrink-0" size={18} />
                  <a
                    href={`mailto:${business.email}`}
                    className="text-sm text-gray-700 hover:text-blue-600 transition-colors truncate"
                  >
                    {business.email}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

          {/* Empty state for filtered results */}
          {filteredBusinesses.length === 0 && filterRegion && (
            <div className="py-12 text-center">
              <BiMapPin className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                No businesses found in {filterRegion}
              </p>
              <button
                onClick={() => setFilterRegion("")}
                className="mt-4 text-blue-600 hover:text-blue-700 underline"
              >
                Show all businesses
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

