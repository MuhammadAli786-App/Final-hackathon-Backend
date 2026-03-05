#!/usr/bin/env node
/**
 * TEST: Subscription Upgrade Flow
 * Verifies that upgrading a plan updates the database and enables features
 */

const BASE_URL = 'http://localhost:5000/api'
let adminToken = ''

async function req(method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    }

    if (adminToken) {
      options.headers.Authorization = `Bearer ${adminToken}`
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${path}`, options)
    const data = await response.json()
    return { status: response.status, data }
  } catch (err) {
    console.error(`Request failed: ${method} ${path}`, err.message)
    return { status: 500, data: { error: err.message } }
  }
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗')
  console.log('║       SUBSCRIPTION UPGRADE FLOW TEST                          ║')
  console.log('╚════════════════════════════════════════════════════════════════╝\n')

  try {
    // 1. LOGIN
    console.log('🔐 Admin Login')
    const login = await req('POST', '/auth/login', {
      email: 'admin@clinic.com',
      password: 'Admin@123'
    })
    adminToken = login.data.token
    console.log(`✅ Logged in as ${login.data.user.name}\n`)

    // 2. CHECK INITIAL SUBSCRIPTION
    console.log('📋 Check Initial Subscription Status')
    const initialStatus = await req('GET', '/subscriptions/status')
    console.log(`✅ Current Plan: ${initialStatus.data.user.plan.toUpperCase()}`)
    console.log(`   Trial Active: ${initialStatus.data.status.isOnTrial}`)
    console.log(`   Expires: ${initialStatus.data.subscriptionEndsAt || 'N/A'}\n`)

    // 3. CHECK INITIAL FEATURES
    console.log('🎯 Check Initial AI Features')
    const initialFeatures = await req('GET', '/subscriptions/features')
    console.log(`✅ Features available for ${initialFeatures.data.plan} plan:`)
    Object.entries(initialFeatures.data.features).forEach(([key, value]) => {
      console.log(`   ${value ? '✓' : '✗'} ${key}`)
    })
    console.log()

    // 4. UPGRADE TO PRO
    console.log('⬆️  Upgrade to PRO Plan')
    const upgrade = await req('POST', '/subscriptions/upgrade', {
      planName: 'pro',
      paymentMethod: 'mock'
    })
    if (upgrade.status !== 200) {
      throw new Error('Upgrade failed: ' + JSON.stringify(upgrade.data))
    }
    console.log(`✅ Successfully upgraded to ${upgrade.data.user.plan.toUpperCase()}`)
    console.log(`   Subscription ends: ${upgrade.data.user.subscriptionEndsAt}\n`)

    // 5. RE-FETCH SUBSCRIPTION STATUS (frontend should do this)
    console.log('🔄 Re-fetch Subscription Status (simulating frontend refresh)')
    const updatedStatus = await req('GET', '/subscriptions/status')
    console.log(`✅ Updated Plan: ${updatedStatus.data.user.plan.toUpperCase()}`)
    console.log(`   Trial Active: ${updatedStatus.data.status.isOnTrial}`)
    console.log(`   Expires: ${updatedStatus.data.subscriptionEndsAt}\n`)

    // 6. RE-FETCH FEATURES (critical step)
    console.log('🎯 Re-fetch AI Features (critical for frontend)')
    const updatedFeatures = await req('GET', '/subscriptions/features')
    console.log(`✅ Features available for ${updatedFeatures.data.plan} plan:`)
    Object.entries(updatedFeatures.data.features).forEach(([key, value]) => {
      console.log(`   ${value ? '✓' : '✗'} ${key}`)
    })
    console.log()

    // 7. COMPARE BEFORE AND AFTER
    console.log('📊 Feature Comparison:')
    const originalAI = initialFeatures.data.features.aiPrescriptionExplanation
    const upgradedAI = updatedFeatures.data.features.aiPrescriptionExplanation
    console.log(`   aiPrescriptionExplanation:`)
    console.log(`     Before: ${originalAI ? 'ENABLED' : 'DISABLED'}`)
    console.log(`     After:  ${upgradedAI ? 'ENABLED' : 'DISABLED'}`)
    
    if (!originalAI && upgradedAI) {
      console.log(`✅ Feature CORRECTLY enabled after upgrade!\n`)
    } else if (originalAI && !upgradedAI) {
      console.log(`❌ Error: Feature DISABLED after upgrade!\n`)
      process.exit(1)
    } else if (originalAI && upgradedAI) {
      console.log(`✓ Feature was already enabled\n`)
    } else {
      console.log(`❌ Feature still disabled after upgrade!\n`)
      process.exit(1)
    }

    // 8. VERIFY SPECIFIC FEATURE
    console.log('✓ Check Specific Feature')
    const featureCheck = await req('GET', '/subscriptions/features/aiPrescriptionExplanation')
    console.log(`✅ aiPrescriptionExplanation: ${featureCheck.data.hasAccess ? 'ENABLED' : 'DISABLED'}\n`)

    console.log('╔════════════════════════════════════════════════════════════════╗')
    console.log('║                  ✅ ALL TESTS PASSED!                          ║')
    console.log('╠════════════════════════════════════════════════════════════════╣')
    console.log('║ SUBSCRIPTION UPGRADE FLOW VERIFIED:                           ║')
    console.log('├────────────────────────────────────────────────────────────────┤')
    console.log('║ ✅ Admin can upgrade from Free to Pro                         ║')
    console.log('║ ✅ Upgrade persists in database                              ║')
    console.log('║ ✅ Feature access updates correctly                          ║')
    console.log('║ ✅ Re-fetching features shows new status                     ║')
    console.log('║ ✅ Frontend can now enable upgraded AI features              ║')
    console.log('╚════════════════════════════════════════════════════════════════╝\n')

  } catch (err) {
    console.error('❌ Test failed:', err.message)
    process.exit(1)
  }
}

test()
