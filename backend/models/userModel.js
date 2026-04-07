  // Defines the structure of user documents in MongoDB.
 

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


  // userSchema: Defines the structure of a User document

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                    // No duplicate emails allowed
    lowercase: true,                 // Normalize to lowercase
    match: [
      /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
      'Please provide a valid email address'
    ]
  },

  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Never return password in queries by default (security!)
  },

  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },

  boards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board'  // Reference to Board model
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});


  // PRE-SAVE HOOK: Hash password before saving to database

userSchema.pre('save', async function(next) {
  // Only hash password if it's new or has been modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt (random value to make hash unique)
    const salt = await bcrypt.genSalt(10);
    
    // Hash password with salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


//  INSTANCE METHOD: Compare passwords during login

userSchema.methods.matchPassword = async function(incomingPassword) {
  return await bcrypt.compare(incomingPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
