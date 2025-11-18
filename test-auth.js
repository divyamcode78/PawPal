// Simple test script for authentication endpoints
// Run with: node test-auth.js

const BASE_URL = 'http://localhost:5172';

async function testAuth() {
  console.log('🧪 Testing PawPal Authentication System\n');

  // Test 1: Register a new user
  console.log('1. Testing user registration...');
  try {
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_phone: '+1234567891'
      }),
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful');
      console.log('   User ID:', registerData.user.id);
      console.log('   Email:', registerData.user.email);
      console.log('   Token received:', !!registerData.token);
      
      const token = registerData.token;
      
      // Test 2: Get current user
      console.log('\n2. Testing get current user...');
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const meData = await meResponse.json();
      
      if (meResponse.ok) {
        console.log('✅ Get current user successful');
        console.log('   User name:', meData.name);
        console.log('   User email:', meData.email);
      } else {
        console.log('❌ Get current user failed:', meData.error);
      }
      
      // Test 3: Update profile
      console.log('\n3. Testing profile update...');
      const updateResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Updated Test User',
          phone: '+9876543210',
        }),
      });
      
      const updateData = await updateResponse.json();
      
      if (updateResponse.ok) {
        console.log('✅ Profile update successful');
        console.log('   Updated name:', updateData.user.name);
        console.log('   Updated phone:', updateData.user.phone);
      } else {
        console.log('❌ Profile update failed:', updateData.error);
      }
      
      // Test 4: Login with same credentials
      console.log('\n4. Testing login...');
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
        }),
      });
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log('   User name:', loginData.user.name);
        console.log('   Token received:', !!loginData.token);
      } else {
        console.log('❌ Login failed:', loginData.error);
      }
      
      // Test 5: Logout
      console.log('\n5. Testing logout...');
      const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const logoutData = await logoutResponse.json();
      
      if (logoutResponse.ok) {
        console.log('✅ Logout successful');
      } else {
        console.log('❌ Logout failed:', logoutData.error);
      }
      
    } else {
      console.log('❌ Registration failed:', registerData.error);
      if (registerData.details) {
        console.log('   Details:', registerData.details);
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }

  console.log('\n🏁 Authentication tests completed!');
}

// Test password validation
async function testPasswordValidation() {
  console.log('\n🔒 Testing password validation...');
  
  const weakPasswords = [
    '123',
    'password',
    'PASSWORD',
    'Password',
    'Password123',
    'Password!',
  ];
  
  for (const password of weakPasswords) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: password,
          name: 'Test User',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok && data.details) {
        console.log(`✅ Password "${password}" correctly rejected:`, data.details.join(', '));
      } else {
        console.log(`❌ Password "${password}" should have been rejected`);
      }
    } catch (error) {
      console.log(`❌ Error testing password "${password}":`, error.message);
    }
  }
}

// Run tests
testAuth().then(() => {
  testPasswordValidation();
});
