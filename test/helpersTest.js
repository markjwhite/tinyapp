const { assert } = require('chai');
const { fetchUserByEmail } = require("../helpers");

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('fetchUserByEmail', function() {
  it('should return a user with valid email', () => {
    const user = fetchUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.deepEqual(user, expectedOutput);
  });
  it('should return undefined if email is not found within the database', () => {
    const user = fetchUserByEmail("notthere@doesn'texist.com");
    const expectedOutput = undefined;
    assert.deepEqual(user, expectedOutput);
  });
});