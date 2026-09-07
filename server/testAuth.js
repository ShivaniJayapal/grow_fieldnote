/**
 * Automated Verification Script for Fieldnote Authentication
 * Tests:
 * 1. Password hashing with bcrypt
 * 2. Password matching & invalid comparison
 * 3. JWT generation and claims verification
 * 4. Token verification middleware logic
 * 5. Mongoose schema instantiation and validations
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Load Models
const User = require('./models/User');
const Watchlist = require('./models/Watchlist');
const Snapshot = require('./models/Snapshot');
const verifyToken = require('./middleware/verifyToken');

const JWT_SECRET = 'fieldnote_super_secret_jwt_key_2026_growth';

async function runTests() {
  console.log('--- Starting Fieldnote Auth Verification Suite ---');

  // Test 1: Bcrypt Password Hashing
  console.log('\n[Test 1] Testing Bcrypt Password Hashing...');
  const plainPassword = 'Password123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);

  if (!hash || hash === plainPassword) {
    throw new Error('Bcrypt hashing failed: hash is empty or unhashed.');
  }
  const isMatch = await bcrypt.compare(plainPassword, hash);
  const isWrongMatch = await bcrypt.compare('WrongPassword!', hash);

  if (!isMatch) throw new Error('Bcrypt compare failed for correct password.');
  if (isWrongMatch) throw new Error('Bcrypt compare returned true for wrong password.');
  console.log('✓ Bcrypt hashing and comparison verified successfully.');

  // Test 2: JWT Generation & Verification
  console.log('\n[Test 2] Testing JWT Generation & Verification...');
  const fakeUserId = new mongoose.Types.ObjectId().toString();
  const token = jwt.sign({ userId: fakeUserId, email: 'trader@fieldnote.io' }, JWT_SECRET, {
    expiresIn: '7d',
  });

  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.userId !== fakeUserId || decoded.email !== 'trader@fieldnote.io') {
    throw new Error('JWT decoded payload does not match original claims.');
  }
  console.log('✓ JWT issuance and verification verified successfully.');

  // Test 3: verifyToken Middleware Behavior
  console.log('\n[Test 3] Testing verifyToken Middleware...');
  
  // Case A: Missing header
  let resStatus = null;
  let resBody = null;
  const mockRes = {
    status: (code) => {
      resStatus = code;
      return {
        json: (body) => {
          resBody = body;
        },
      };
    },
  };

  verifyToken({ headers: {} }, mockRes, () => {});
  if (resStatus !== 401) throw new Error('verifyToken should reject missing header with 401.');

  // Case B: Valid Bearer Token
  let nextCalled = false;
  const validReq = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  verifyToken(validReq, mockRes, () => {
    nextCalled = true;
  });

  if (!nextCalled || validReq.userId !== fakeUserId) {
    throw new Error('verifyToken failed to attach userId or call next().');
  }
  console.log('✓ verifyToken middleware correctly validates tokens and rejects missing headers.');

  // Test 4: Mongoose Schemas Validation
  console.log('\n[Test 4] Testing Mongoose Schemas...');

  // User schema validation test
  const testUser = new User({
    email: 'alpha@groww.in',
    passwordHash: hash,
  });
  const userJson = testUser.toJSON();
  if (userJson.passwordHash) {
    throw new Error('User.toJSON() must not expose passwordHash.');
  }

  // Watchlist schema validation test
  const testWatchlist = new Watchlist({
    userId: testUser._id,
    name: 'Top Semis & AI',
    symbols: ['nvda', 'tsm', 'asml'],
  });
  // Symbols should be uppercase
  if (testWatchlist.symbols[0] !== 'NVDA') {
    throw new Error('Watchlist symbols should be converted to uppercase.');
  }

  // Snapshot schema validation test
  const testSnapshot = new Snapshot({
    userId: testUser._id,
    watchlistId: testWatchlist._id,
    symbol: 'nvda',
    priceAtSnapshot: 132.84,
  });
  if (testSnapshot.symbol !== 'NVDA' || testSnapshot.priceAtSnapshot !== 132.84) {
    throw new Error('Snapshot schema fields did not populate as expected.');
  }

  console.log('✓ User, Watchlist, and Snapshot Mongoose schemas validated successfully.');

  console.log('\n======================================================');
  console.log('🎉 ALL BACKEND AUTH TESTS PASSED CLEANLY (4/4)');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

