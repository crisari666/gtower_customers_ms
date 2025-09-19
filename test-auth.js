const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  try {
    console.log('Testing JWT Authentication...\n');

    // 1. Create a test user
    console.log('1. Creating test user...');
    const createUserResponse = await axios.post(`${BASE_URL}/users`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log('User created:', createUserResponse.data);

    // 2. Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    console.log('Login successful:', loginResponse.data);

    const token = loginResponse.data.access_token;

    // 3. Test protected route with token
    console.log('\n3. Testing protected route with token...');
    const protectedResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Protected route accessed:', protectedResponse.data);

    // 4. Test protected route without token (should fail)
    console.log('\n4. Testing protected route without token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/users`);
    } catch (error) {
      console.log('Expected error (no token):', error.response.status, error.response.data);
    }

    // 5. Test protected route with invalid token (should fail)
    console.log('\n5. Testing protected route with invalid token (should fail)...');
    try {
      await axios.get(`${BASE_URL}/users`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
    } catch (error) {
      console.log('Expected error (invalid token):', error.response.status, error.response.data);
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAuth();
