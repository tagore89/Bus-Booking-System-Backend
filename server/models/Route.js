import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  departureTime: {
    type: Date,
    required: true
  },
  arrivalTime: {
    type: Date,
    required: true
  },
  fare: {
    type: Number,
    required: true,
    min: 0
  },
  availableSeats: {
    type: [Number],
    default: function() {
      // Generate array of available seats based on total seats of the bus
      return [...Array(this.totalSeats).keys()].map(i => i + 1);
    }
  },
  totalSeats: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Route = mongoose.model('Route', routeSchema);

export default Route;