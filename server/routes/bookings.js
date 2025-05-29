import express from 'express';
import Booking from '../models/Booking.js';
import Route from '../models/Route.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings for current user
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate({
        path: 'route',
        populate: { path: 'bus' }
      })
      .sort({ bookingDate: -1 });
    
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get booking by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'route',
        populate: { path: 'bus' }
      });
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the booking belongs to the current user or user is admin
    if (booking.user.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new booking
router.post('/', auth, async (req, res) => {
  try {
    const { routeId, seats, passengerDetails, totalAmount } = req.body;
    
    // Check if route exists
    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }
    
    // Check if seats are available
    const unavailableSeats = seats.filter(seat => !route.availableSeats.includes(seat));
    if (unavailableSeats.length > 0) {
      return res.status(400).json({ 
        message: 'Some seats are not available', 
        unavailableSeats 
      });
    }
    
    // Create booking
    const booking = new Booking({
      user: req.user.userId,
      route: routeId,
      seats,
      totalAmount,
      passengerDetails
    });
    
    // Update available seats in route
    route.availableSeats = route.availableSeats.filter(seat => !seats.includes(seat));
    await route.save();
    
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Check if the booking belongs to the current user
    if (booking.user.toString() !== req.user.userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    // Check if booking is already cancelled
    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    // Update booking status
    booking.bookingStatus = 'Cancelled';
    
    // If payment was completed, mark for refund
    if (booking.paymentStatus === 'Completed') {
      booking.paymentStatus = 'Refunded';
    }
    
    // Update available seats in route
    const route = await Route.findById(booking.route);
    if (route) {
      route.availableSeats = [...route.availableSeats, ...booking.seats];
      await route.save();
    }
    
    await booking.save();
    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all bookings (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const total = await Booking.countDocuments();
    const bookings = await Booking.find()
      .populate({
        path: 'route',
        populate: { path: 'bus' }
      })
      .populate('user', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ bookingDate: -1 });
    
    res.json({
      bookings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;