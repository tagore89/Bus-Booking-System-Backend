import express from 'express';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all buses (public)
router.get('/', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search buses by source, destination and date
router.get('/search', async (req, res) => {
  try {
    const { source, destination, date } = req.query;
    
    if (!source || !destination || !date) {
      return res.status(400).json({ message: 'Source, destination and date are required' });
    }
    
    // Create date range for the given date (entire day)
    const searchDate = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const routes = await Route.find({
      source: { $regex: source, $options: 'i' },
      destination: { $regex: destination, $options: 'i' },
      departureTime: { $gte: searchDate, $lt: nextDay },
      isActive: true
    }).populate('bus');
    
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bus by ID
router.get('/:id', async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get routes for a specific bus
router.get('/:id/routes', async (req, res) => {
  try {
    const routes = await Route.find({ bus: req.params.id });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add new bus (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { busNumber, busName, busType, totalSeats, amenities } = req.body;
    
    // Check if bus already exists
    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ message: 'Bus with this number already exists' });
    }
    
    const bus = new Bus({
      busNumber,
      busName,
      busType,
      totalSeats,
      amenities
    });
    
    await bus.save();
    res.status(201).json(bus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add route for a bus (admin only)
router.post('/:id/routes', adminAuth, async (req, res) => {
  try {
    const { source, destination, departureTime, arrivalTime, fare } = req.body;
    
    // Check if bus exists
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    const route = new Route({
      bus: bus._id,
      source,
      destination,
      departureTime,
      arrivalTime,
      fare,
      totalSeats: bus.totalSeats,
      availableSeats: [...Array(bus.totalSeats).keys()].map(i => i + 1)
    });
    
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bus (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { busName, busType, totalSeats, amenities } = req.body;
    
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { busName, busType, totalSeats, amenities },
      { new: true, runValidators: true }
    );
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete bus (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    
    // Also delete all routes for this bus
    await Route.deleteMany({ bus: req.params.id });
    
    res.json({ message: 'Bus and its routes deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;