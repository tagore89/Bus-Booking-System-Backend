import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  busName: {
    type: String,
    required: true,
    trim: true
  },
  busType: {
    type: String,
    required: true,
    enum: ['AC', 'Non-AC', 'Sleeper', 'Semi-Sleeper'],
    default: 'AC'
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  amenities: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Bus = mongoose.model('Bus', busSchema);

export default Bus;