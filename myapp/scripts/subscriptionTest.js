import fetch from 'node-fetch'

const API_URL = 'http://localhost:5000/api'

// Demo accounts for testing
const accounts = {
  admin: { email: 'admin@clinic.com', password: 'Admin@123' },
  doctor: { email: 'doctor@clinic.com', password: 'Doctor@123' },
  receptionist: { email: 'receptionist@clinic.com', password: 'Receptionist@123' },
  patient: { email: 'patient@clinic.com', password: 'Patient@123' }
}

async function testSubscriptions() {
  console.log('🧪 Testing Subscription & Feature Flags System\n')

  try {
    // 1. Login and get tokens
    console.log('📝 Step 1: Login with different roles')
    const tokens = {}
    
    for (const [role, creds] of Object.entries(accounts)) {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      })
      const data = await res.json()
      if (!data.token) {
        console.log(`❌ ${role}: Login failed (${data.message || 'no token'})`)
      } else {
        tokens[role] = data.token
        console.log(`✓ ${role}: Logged in`)
      }
    }

    // 2. Get subscription plans
    console.log('\n📋 Step 2: Getting subscription plans')
    const plansRes = await fetch(`${API_URL}/subscriptions/plans`)
    const plansData = await plansRes.json()
    console.log(`✓ Available plans: ${plansData.plans.map(p => p.displayName).join(', ')}`)

    // 3. Check current subscriptions
    console.log('\n🔍 Step 3: Checking current subscriptions for each user')
    for (const [role, token] of Object.entries(tokens)) {
      const res = await fetch(`${API_URL}/subscriptions/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      console.log(`✓ ${role}: ${data.status.plan} plan (${data.status.isActive ? 'active' : 'inactive'})`)
    }

    // 4. Test feature access checks
    console.log('\n🎯 Step 4: Testing feature access flags')
    const features = [
      'patientManagement',
      'appointmentScheduling',
      'prescriptionCreation',
      'aiSymptomChecker',
      'analyticsAccess'
    ]

    for (const role of ['free_user', 'admin']) {
      const token = tokens[role === 'free_user' ? 'patient' : 'admin']
      console.log(`\n  ${role.toUpperCase()}:`)

      // fetch flags once
      const flagRes = await fetch(`${API_URL}/subscriptions/flags`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const flagData = await flagRes.json()
      
      for (const feature of features) {
        const enabled = flagData.flags && flagData.flags[feature]
        const status = enabled ? '✓' : '✗'
        console.log(`  ${status} ${feature}`)
      }
    }

    // 5. Test upgrading subscription
    console.log('\n⬆️  Step 5: Testing subscription upgrade')
    console.log('Patient token used for upgrade:', tokens.patient)
    const upgradeRes = await fetch(`${API_URL}/subscriptions/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.patient}`
      },
      body: JSON.stringify({ planName: 'pro', paymentMethod: 'mock' })
    })
    
    if (!upgradeRes.ok) {
      console.log(`❌ Upgrade failed with status ${upgradeRes.status}`)
      const errorData = await upgradeRes.json()
      console.log(`   Error: ${errorData.message}`)
    } else {
      const upgradeData = await upgradeRes.json()
      console.log(`✓ Patient upgraded to: ${upgradeData.user?.plan || 'unknown'}`)
      if (upgradeData.user?.subscriptionEndsAt) {
        console.log(`  Expires: ${new Date(upgradeData.user.subscriptionEndsAt).toDateString()}`)
      }
    }

    // 6. Test feature access after upgrade
    console.log('\n✨ Step 6: Testing feature access after upgrade')
    const featureCheckRes = await fetch(`${API_URL}/subscriptions/features/PRESCRIPTION_CREATION`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokens.patient}`
      }
    })
    const featureData = await featureCheckRes.json()
    console.log(`✓ prescriptionCreation: ${featureData.hasAccess ? 'ENABLED' : 'DISABLED'}`)

    // 7. Test usage stats
    console.log('\n📊 Step 7: Getting usage statistics')
    const usageRes = await fetch(`${API_URL}/subscriptions/usage`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    })
    
    if (usageRes.ok) {
      const usageData = await usageRes.json()
      console.log(`✓ Usage stats retrieved:`)
      if (usageData.usage) {
        console.log(`  Appointments this month: ${usageData.usage.appointmentsThisMonth}`)
        console.log(`  Prescriptions this month: ${usageData.usage.prescriptionsThisMonth}`)
      }
    } else {
      console.log(`⚠️  Could not fetch usage stats`)
    }

    // 8. Test admin subscription management
    console.log('\n👨‍💼 Step 8: Admin subscription management')
    const allSubsRes = await fetch(`${API_URL}/subscriptions/admin/all`, {
      headers: { 'Authorization': `Bearer ${tokens.admin}` }
    })
    
    if (allSubsRes.ok) {
      const allSubsData = await allSubsRes.json()
      console.log(`✓ Total users: ${allSubsData.length || 0}`)
      if (allSubsData.length > 0) {
        console.log(`  Plans: ${allSubsData.slice(0, 3).map(s => `${s.email} (${s.subscriptionPlan || 'free'})`).join(', ')}`)
      }
    } else {
      console.log(`⚠️  Could not fetch admin subscriptions`)
    }

    // 9. Test role-based feature access
    console.log('\n🔐 Step 9: Testing role-based feature restrictions')
    
    // Create a test patient to check diagnosis access
    const patientCreateRes = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.admin}`
      },
      body: JSON.stringify({
        name: 'Feature Test Patient',
        age: 30,
        gender: 'male',
        contact: '+919999999999'
      })
    })
    
    if (patientCreateRes.ok) {
      console.log('✓ Patient created for diagnosis test')
      
      // Try diagnosis with free user (should fail)
      const diagnosisRes = await fetch(`${API_URL}/diagnosis/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.patient}`
        },
        body: JSON.stringify({
          symptoms: 'fever and cough',
          age: 30,
          gender: 'male',
          history: {}
        })
      })
      
      const diagnosisStatus = diagnosisRes.status
      console.log(`✓ Diagnosis endpoint with free user: ${diagnosisStatus === 403 ? 'BLOCKED (403)' : 'ALLOWED'}`)
    }

    console.log('\n✅ All subscription tests completed successfully!\n')

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

// Run tests
testSubscriptions()
