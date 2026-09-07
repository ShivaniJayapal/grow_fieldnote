/**
 * Automated Verification Test for Fieldnote Watchlist Management Endpoints
 */
const mongoose = require('mongoose');
const watchlistService = require('./services/watchlistService');
const Watchlist = require('./models/Watchlist');
const Snapshot = require('./models/Snapshot');

async function runWatchlistTests() {
  console.log('--- Starting Watchlist Management Verification Suite ---');

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fieldnote_test';
  await mongoose.connect(mongoURI);
  console.log('[MongoDB] Connected to database for testing.');

  // Clean up any previous test collection
  await Watchlist.deleteMany({});
  await Snapshot.deleteMany({});

  const userA = new mongoose.Types.ObjectId().toString();
  const userB = new mongoose.Types.ObjectId().toString();

  // Test 1: Create Watchlist
  console.log('\n[Test 1] Testing Watchlist Creation...');
  const wlData = await watchlistService.createWatchlist(userA, 'Core Tech & Semis');
  if (!wlData.id || wlData.name !== 'Core Tech & Semis' || wlData.symbolCount !== 0) {
    throw new Error('Watchlist creation failed: Invalid response shape');
  }
  const watchlistId = wlData.id;
  console.log('✓ Watchlist created successfully with id:', watchlistId);

  // Test 1b: Rejection of Empty or Duplicate Name
  try {
    await watchlistService.createWatchlist(userA, '');
    throw new Error('Should have failed on empty name');
  } catch (err) {
    if (err.statusCode !== 400) throw err;
    console.log('✓ Rejected empty watchlist name with 400 Bad Request');
  }

  try {
    await watchlistService.createWatchlist(userA, 'Core Tech & Semis');
    throw new Error('Should have failed on duplicate name');
  } catch (err) {
    if (err.statusCode !== 400) throw err;
    console.log('✓ Rejected duplicate watchlist name with 400 Bad Request');
  }

  // Test 2: List Watchlists Matching Contract [{ id, name, symbolCount }]
  console.log('\n[Test 2] Testing List Watchlists Contract...');
  const list = await watchlistService.getWatchlists(userA);
  if (!Array.isArray(list) || list.length !== 1) {
    throw new Error('Listing watchlists did not return expected array');
  }
  const item = list[0];
  if (!item.id || typeof item.name !== 'string' || typeof item.symbolCount !== 'number') {
    throw new Error(`Item does not match contract [{ id, name, symbolCount }]: ${JSON.stringify(item)}`);
  }
  console.log('✓ GET /watchlists strictly conforms to [{ id, name, symbolCount }]:', item);

  // Test 3: Add Symbol (Uppercase, 1-5 chars, no duplicates)
  console.log('\n[Test 3] Testing Add Symbol (POST /watchlists/:id/symbols)...');
  
  // 3a. Add lowercase symbol -> auto-uppercased
  const addResult = await watchlistService.addSymbol(userA, watchlistId, 'nvda');
  if (!addResult.symbols.includes('NVDA') || addResult.symbolCount !== 1) {
    throw new Error('Adding symbol failed to uppercase or update count');
  }
  console.log('✓ Added symbol "nvda" -> converted to uppercase "NVDA"');

  // 3b. Add second symbol
  await watchlistService.addSymbol(userA, watchlistId, 'AAPL');
  console.log('✓ Added second symbol "AAPL"');

  // 3c. Duplicate rejection
  try {
    await watchlistService.addSymbol(userA, watchlistId, 'NVDA');
    throw new Error('Should have rejected duplicate symbol');
  } catch (err) {
    if (err.statusCode !== 400) throw err;
    console.log('✓ Rejected duplicate symbol "NVDA" with 400 Bad Request');
  }

  // 3d. Invalid character / length validations
  const invalidSymbols = ['TOOLONGTICKER', '1234', 'A$', '', 'A B'];
  for (const inv of invalidSymbols) {
    try {
      await watchlistService.addSymbol(userA, watchlistId, inv);
      throw new Error(`Should have rejected invalid symbol: ${inv}`);
    } catch (err) {
      if (err.statusCode !== 400) throw err;
    }
  }
  console.log('✓ Rejected invalid symbols (numbers, special chars, >5 letters) with 400 Bad Request');

  // Test 4: Authorization Checks (403 Forbidden for User B)
  console.log('\n[Test 4] Testing Authorization Checks (403 Forbidden)...');
  try {
    await watchlistService.addSymbol(userB, watchlistId, 'MSFT');
    throw new Error('User B should not be allowed to modify User A watchlist');
  } catch (err) {
    if (err.statusCode !== 403) throw err;
    console.log('✓ User B modifying User A watchlist returned 403 Forbidden');
  }

  try {
    await watchlistService.deleteWatchlist(userB, watchlistId);
    throw new Error('User B should not be allowed to delete User A watchlist');
  } catch (err) {
    if (err.statusCode !== 403) throw err;
    console.log('✓ User B deleting User A watchlist returned 403 Forbidden');
  }

  // Test 5: Not Found Checks (404 Not Found)
  console.log('\n[Test 5] Testing Not Found Checks (404 Not Found)...');
  const fakeId = new mongoose.Types.ObjectId().toString();
  try {
    await watchlistService.addSymbol(userA, fakeId, 'MSFT');
    throw new Error('Should return 404 for nonexistent watchlist');
  } catch (err) {
    if (err.statusCode !== 404) throw err;
    console.log('✓ Nonexistent watchlist ID returned 404 Not Found');
  }

  // Test 6: Remove Symbol (DELETE /watchlists/:id/symbols/:symbol)
  console.log('\n[Test 6] Testing Remove Symbol...');
  const removeRes = await watchlistService.removeSymbol(userA, watchlistId, 'nvda');
  if (removeRes.symbols.includes('NVDA') || removeRes.symbolCount !== 1) {
    throw new Error('Symbol NVDA was not properly removed');
  }
  console.log('✓ Symbol "NVDA" removed successfully. Remaining symbols:', removeRes.symbols);

  // Removing already removed symbol -> 404
  try {
    await watchlistService.removeSymbol(userA, watchlistId, 'NVDA');
    throw new Error('Should have returned 404 for missing symbol');
  } catch (err) {
    if (err.statusCode !== 404) throw err;
    console.log('✓ Removing nonexistent symbol returned 404 Not Found');
  }

  // Verify updated list count
  const updatedList = await watchlistService.getWatchlists(userA);
  if (updatedList[0].symbolCount !== 1) {
    throw new Error(`Symbol count in list should be 1, found ${updatedList[0].symbolCount}`);
  }
  console.log('✓ List reflects updated symbolCount: 1');

  // Test 7: Delete Watchlist (DELETE /watchlists/:id)
  console.log('\n[Test 7] Testing Delete Watchlist...');
  const delRes = await watchlistService.deleteWatchlist(userA, watchlistId);
  if (delRes.id !== watchlistId) {
    throw new Error('Delete response ID did not match');
  }
  const emptyList = await watchlistService.getWatchlists(userA);
  if (emptyList.length !== 0) {
    throw new Error('Watchlist was not removed from database');
  }
  console.log('✓ Watchlist deleted successfully. User A watchlists count: 0');

  console.log('\n======================================================');
  console.log('🎉 ALL WATCHLIST MANAGEMENT TESTS PASSED (7/7)');
  console.log('======================================================');
  await mongoose.disconnect();
}

runWatchlistTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
