const Venue = require('../models/Venue');

const ALLOWED_FIELDS = [
  'name',
  'type',
  'capacity',
  'facilities',
  'location',
  'description',
  'imageUrl',
  'isActive',
];

const pickAllowed = (body) =>
  ALLOWED_FIELDS.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});

const prepareVenueData = (body) => {
  const data = pickAllowed(body);
  if (data.capacity !== undefined) data.capacity = Number(data.capacity);
  if (data.facilities !== undefined) {
    if (!Array.isArray(data.facilities)) {
      const error = new Error('Facilities must be a list');
      error.statusCode = 400;
      throw error;
    }
    data.facilities = [...new Set(data.facilities.map((item) => String(item).trim()).filter(Boolean))];
  }
  return data;
};

const handleError = (res, error) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A venue with this name already exists' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server error' });
};

const createVenue = async (req, res) => {
  try {
    const data = prepareVenueData(req.body);
    const venue = await Venue.create(data);
    res.status(201).json({ venue });
  } catch (error) {
    handleError(res, error);
  }
};

const getVenues = async (req, res) => {
  try {
    const { minCapacity, facilities, type, includeInactive } = req.query;
    const filter = {};

    if (includeInactive !== 'true') {
      filter.isActive = true;
    }
    if (minCapacity !== undefined) {
      const min = Number(minCapacity);
      if (Number.isNaN(min)) {
        return res.status(400).json({ message: 'minCapacity must be a number' });
      }
      filter.capacity = { $gte: min };
    }
    if (facilities) {
      filter.facilities = { $all: facilities.split(',') };
    }
    if (type) {
      filter.type = type;
    }

    const venues = await Venue.find(filter).sort({ name: 1 });
    res.json(venues);
  } catch (error) {
    handleError(res, error);
  }
};

const getVenueById = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    handleError(res, error);
  }
};

const updateVenue = async (req, res) => {
  try {
    const data = prepareVenueData(req.body);
    const venue = await Venue.findByIdAndUpdate(req.params.id, data, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json({ venue });
  } catch (error) {
    handleError(res, error);
  }
};

const deactivateVenue = async (req, res) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { returnDocument: 'after' }
    );
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json(venue);
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { createVenue, getVenues, getVenueById, updateVenue, deactivateVenue };
