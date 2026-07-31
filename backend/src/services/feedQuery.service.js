import SellProduct from "../models/SellProduct.js";
import FoundProduct from "../models/foundProductModel.js";
import Ticket from "../models/expirable_item/ticketModel.js";
import Pass from "../models/expirable_item/passModel.js";

const CATEGORY_ALIASES = {
  "Books & Documents": ["Books & Documents", "Books & Document", "Books & Stationery"],
  "Books & Document": ["Books & Documents", "Books & Document", "Books & Stationery"],
  "Books & Stationery": ["Books & Documents", "Books & Document", "Books & Stationery"],
};

export const PUBLIC_LISTING_PROJECTION = {
  _id: 1,
  name: 1,
  category: 1,
  description: 1,
  images: 1,
  sellingPrice: 1,
  price: 1,
  isNegotiable: 1,
  hasWarranty: 1,
  warrantyValue: 1,
  warrantyUnit: 1,
  usageTime: 1,
  quantity: 1,
  dateTime: 1,
  departureTime: 1,
  arrivalTime: 1,
  ticketType: 1,
  origin: 1,
  destination: 1,
  venue: 1,
  createdAt: 1,
  updatedAt: 1,
  status: 1,
  user: 1,
};

export const getModelConfig = (type) => {
  switch (type?.toLowerCase()) {
    case "sell":
      return {
        type: "sell",
        model: SellProduct,
        categoryField: "category",
        priceField: "sellingPrice",
        publicFilter: { status: "active" },
      };
    case "found":
      return {
        type: "found",
        model: FoundProduct,
        categoryField: "category",
        priceField: null,
        publicFilter: { status: "active" },
      };
    case "ticket":
      return {
        type: "ticket",
        model: Ticket,
        categoryField: "ticketType",
        priceField: "price",
        publicFilter: {
          departureTime: { $gt: new Date() },
          $or: [{ status: "active" }, { status: { $exists: false } }],
        },
      };
    case "pass":
      return {
        type: "pass",
        model: Pass,
        categoryField: "category",
        priceField: "price",
        publicFilter: {
          status: "active",
          dateTime: { $gt: new Date() },
        },
      };
    default:
      return null;
  }
};

const STOP_WORDS = new Set([
  "a", "an", "the", "in", "on", "at", "for", "with", "of", "to", "from", "by", "and", "or",
  "is", "are", "it", "this", "that", "me", "show", "find", "get", "list", "products", "items", "some"
]);

export const buildFilterQuery = (type, filters = {}) => {
  const config = getModelConfig(type);
  if (!config) return null;

  const { categoryField, priceField, publicFilter } = config;
  const filterQuery = { ...publicFilter };

  // Category
  if (filters.category && String(filters.category).trim()) {
    const normalizedCategory = String(filters.category).trim();
    const categoryOptions = CATEGORY_ALIASES[normalizedCategory] || [normalizedCategory];
    filterQuery[categoryField] = categoryOptions.length > 1 ? { $in: categoryOptions } : normalizedCategory;
  }

  // Max Price
  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice > 0 && priceField) {
    const numericMaxPrice = Number(filters.maxPrice);
    if (Number.isFinite(numericMaxPrice) && numericMaxPrice >= 0) {
      filterQuery[priceField] = { $lte: numericMaxPrice };
    }
  }

  // Negotiable
  if (filters.isNegotiable !== undefined && filters.isNegotiable !== null && filters.isNegotiable !== "") {
    filterQuery.isNegotiable = String(filters.isNegotiable).toLowerCase() === "true" || filters.isNegotiable === true;
  }

  // Warranty (sell items)
  if (filters.hasWarranty !== undefined && filters.hasWarranty !== null && filters.hasWarranty !== "" && type === "sell") {
    filterQuery.hasWarranty = String(filters.hasWarranty).toLowerCase() === "true" || filters.hasWarranty === true;
  }

  // Seats / Quantity
  if (filters.minSeats !== undefined && filters.minSeats !== null && Number(filters.minSeats) > 0) {
    const numSeats = Number(filters.minSeats);
    if (Number.isFinite(numSeats)) {
      filterQuery.quantity = { $gte: numSeats };
    }
  }

  // Date filters
  const dateFieldName = type === "ticket" ? "departureTime" : "dateTime";
  if (filters.dateAfter || filters.dateBefore) {
    const dateCond = {};
    if (filters.dateAfter) {
      const dAfter = new Date(filters.dateAfter);
      if (!isNaN(dAfter.getTime())) {
        dateCond.$gte = dAfter;
      }
    }
    if (filters.dateBefore) {
      const dBefore = new Date(filters.dateBefore);
      if (!isNaN(dBefore.getTime())) {
        dateCond.$lte = dBefore;
      }
    }
    if (Object.keys(dateCond).length > 0) {
      if (filterQuery[dateFieldName] && typeof filterQuery[dateFieldName] === "object") {
        Object.assign(filterQuery[dateFieldName], dateCond);
      } else {
        filterQuery[dateFieldName] = dateCond;
      }
    }
  }

  // Cities / Venue
  if (filters.originCity && type === "ticket") {
    filterQuery["origin.city"] = new RegExp(String(filters.originCity).trim(), "i");
  }
  if (filters.destinationCity && type === "ticket") {
    filterQuery["destination.city"] = new RegExp(String(filters.destinationCity).trim(), "i");
  }
  if (filters.venue && (type === "found" || type === "pass")) {
    const vRegex = new RegExp(String(filters.venue).trim(), "i");
    if (type === "found") {
      filterQuery.venue = vRegex;
    } else {
      filterQuery.$or = [
        { "venue.area": vRegex },
        { "venue.city": vRegex },
        { "venue.state": vRegex },
      ];
    }
  }

  // General text search
  if (filters.search && String(filters.search).trim()) {
    const rawSearch = String(filters.search).trim();
    const regex = new RegExp(rawSearch, "i");
    const searchConditions = [
      { name: regex },
      { description: regex },
      { category: regex },
    ];

    if (type === "found") {
      searchConditions.push({ venue: regex });
    } else if (type === "pass") {
      searchConditions.push(
        { "venue.area": regex },
        { "venue.city": regex },
        { "venue.state": regex }
      );
    } else if (type === "ticket") {
      searchConditions.push(
        { ticketType: regex },
        { "origin.city": regex },
        { "origin.area": regex },
        { "destination.city": regex },
        { "destination.area": regex }
      );
    }

    if (filterQuery.$or) {
      filterQuery.$and = filterQuery.$and || [];
      filterQuery.$and.push({ $or: searchConditions });
    } else {
      filterQuery.$or = searchConditions;
    }
  }

  return filterQuery;
};

export const buildSortQuery = (type, sortOption) => {
  const config = getModelConfig(type);
  if (!config) return { createdAt: -1 };

  const { priceField } = config;

  if (sortOption === "price_asc" && priceField) {
    return { [priceField]: 1 };
  } else if (sortOption === "price_desc" && priceField) {
    return { [priceField]: -1 };
  } else if (sortOption === "usage_asc" && type === "sell") {
    return { "usageTime.years": 1, "usageTime.months": 1, "usageTime.days": 1 };
  } else if (sortOption === "usage_desc" && type === "sell") {
    return { "usageTime.years": -1, "usageTime.months": -1, "usageTime.days": -1 };
  }

  return { createdAt: -1 };
};

export const executeFeedQuery = async (type, filters = {}, pagination = {}) => {
  const config = getModelConfig(type);
  if (!config) return { items: [], totalItems: 0 };

  const filterQuery = buildFilterQuery(type, filters);
  const sortQuery = buildSortQuery(type, filters.sort);

  const page = Math.max(1, Number(pagination.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(pagination.limit) || 10));
  const skip = (page - 1) * limit;

  const rawDocs = await config.model
    .find(filterQuery, PUBLIC_LISTING_PROJECTION)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .populate("user", "_id name avatar")
    .lean({ virtuals: true });

  const totalItems = await config.model.countDocuments(filterQuery);

  const items = rawDocs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
    type,
  }));

  return {
    items,
    totalItems,
    page,
    limit,
    totalPages: Math.ceil(totalItems / limit),
    hasNextPage: skip + items.length < totalItems,
    hasPrevPage: page > 1,
  };
};

export const fetchCandidateListings = async (requestedTypes, searchFilters, limitPerType = 30) => {
  const candidatesMap = new Map();

  for (const type of requestedTypes) {
    const config = getModelConfig(type);
    if (!config) continue;

    // 1. Primary filter query (strict or category filters)
    const filterQuery = buildFilterQuery(type, searchFilters);
    const primaryDocs = await config.model
      .find(filterQuery, PUBLIC_LISTING_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(limitPerType)
      .populate("user", "_id name avatar")
      .lean({ virtuals: true });

    for (const doc of primaryDocs) {
      const idStr = doc._id.toString();
      if (!candidatesMap.has(idStr)) {
        candidatesMap.set(idStr, { ...doc, _id: idStr, type });
      }
    }

    // 2. Fuzzy Token Search: handles typos like "Taylot Swift" -> "Taylor Swift"
    if (searchFilters.search && String(searchFilters.search).trim()) {
      const rawSearch = String(searchFilters.search).trim();
      const tokens = rawSearch
        .split(/\s+/)
        .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

      if (tokens.length > 0) {
        const fuzzyConditions = [];
        for (const token of tokens) {
          const fullRegex = new RegExp(token, "i");
          fuzzyConditions.push({ name: fullRegex }, { description: fullRegex }, { category: fullRegex });

          if (token.length >= 4) {
            const prefixRegex = new RegExp(token.substring(0, 4), "i");
            fuzzyConditions.push({ name: prefixRegex }, { description: prefixRegex });
          }
        }

        const fuzzyFilter = {
          ...config.publicFilter,
          $or: fuzzyConditions,
        };

        const fuzzyDocs = await config.model
          .find(fuzzyFilter, PUBLIC_LISTING_PROJECTION)
          .sort({ createdAt: -1 })
          .limit(limitPerType)
          .populate("user", "_id name avatar")
          .lean({ virtuals: true });

        for (const doc of fuzzyDocs) {
          const idStr = doc._id.toString();
          if (!candidatesMap.has(idStr)) {
            candidatesMap.set(idStr, { ...doc, _id: idStr, type });
          }
        }
      }
    }

    // 3. Broad recent active fallback query if candidates are few
    if (candidatesMap.size < 10) {
      const broadFilter = { ...config.publicFilter };

      if (searchFilters.maxPrice && config.priceField) {
        broadFilter[config.priceField] = { $lte: Number(searchFilters.maxPrice) };
      }
      if (searchFilters.isNegotiable !== undefined && searchFilters.isNegotiable !== null && searchFilters.isNegotiable !== "") {
        broadFilter.isNegotiable = String(searchFilters.isNegotiable).toLowerCase() === "true" || searchFilters.isNegotiable === true;
      }
      if (searchFilters.hasWarranty !== undefined && searchFilters.hasWarranty !== null && searchFilters.hasWarranty !== "" && type === "sell") {
        broadFilter.hasWarranty = String(searchFilters.hasWarranty).toLowerCase() === "true" || searchFilters.hasWarranty === true;
      }

      const broadDocs = await config.model
        .find(broadFilter, PUBLIC_LISTING_PROJECTION)
        .sort({ createdAt: -1 })
        .limit(limitPerType)
        .populate("user", "_id name avatar")
        .lean({ virtuals: true });

      for (const doc of broadDocs) {
        const idStr = doc._id.toString();
        if (!candidatesMap.has(idStr)) {
          candidatesMap.set(idStr, { ...doc, _id: idStr, type });
        }
      }
    }
  }

  return Array.from(candidatesMap.values());
};

export const queryListingById = async (id, type) => {
  const config = getModelConfig(type);
  if (!config) return null;

  const doc = await config.model
    .findOne({ _id: id, ...config.publicFilter }, PUBLIC_LISTING_PROJECTION)
    .populate("user", "_id name avatar")
    .lean({ virtuals: true });

  if (!doc) return null;

  return {
    ...doc,
    _id: doc._id.toString(),
    type,
  };
};
