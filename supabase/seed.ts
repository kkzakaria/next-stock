/**
 * Supabase User Seeding Script
 * Uses Admin API to properly create test users with hashed passwords
 * Run with: pnpm seed:users
 */

import { createClient } from '@supabase/supabase-js'

// Local Supabase instance
const SUPABASE_URL = 'http://127.0.0.1:9000'
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface TestUser {
  email: string
  password: string
  role: 'admin' | 'manager' | 'cashier'
  store_id: string | null
  full_name: string
}

const testUsers: TestUser[] = [
  {
    email: 'admin@test.nextstock.com',
    password: 'password123',
    role: 'admin',
    store_id: null,
    full_name: 'Admin User',
  },
  {
    email: 'manager1@test.nextstock.com',
    password: 'password123',
    role: 'manager',
    store_id: '11111111-1111-1111-1111-111111111111', // Downtown Store
    full_name: 'Manager Downtown',
  },
  {
    email: 'manager2@test.nextstock.com',
    password: 'password123',
    role: 'manager',
    store_id: '22222222-2222-2222-2222-222222222222', // Uptown Store
    full_name: 'Manager Uptown',
  },
  {
    email: 'cashier1@test.nextstock.com',
    password: 'password123',
    role: 'cashier',
    store_id: '11111111-1111-1111-1111-111111111111', // Downtown Store
    full_name: 'Cashier Downtown',
  },
  {
    email: 'cashier2@test.nextstock.com',
    password: 'password123',
    role: 'cashier',
    store_id: '22222222-2222-2222-2222-222222222222', // Uptown Store
    full_name: 'Cashier Uptown',
  },
  {
    email: 'cashier3@test.nextstock.com',
    password: 'password123',
    role: 'cashier',
    store_id: '33333333-3333-3333-3333-333333333333', // Brooklyn Store
    full_name: 'Cashier Brooklyn',
  },
]

async function deleteExistingTestUsers() {
  console.log('🗑️  Deleting existing test users...')

  // Get all test users
  const { data: users } = await supabase.auth.admin.listUsers()

  if (!users?.users) {
    console.log('No users to delete')
    return
  }

  // Delete test users (those with @test.nextstock.com email)
  const testUserIds = users.users
    .filter((u) => u.email?.endsWith('@test.nextstock.com'))
    .map((u) => u.id)

  for (const userId of testUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.error(`Error deleting user ${userId}:`, error.message)
    }
  }

  console.log(`✅ Deleted ${testUserIds.length} test user(s)`)
}

async function createTestUsers() {
  console.log('👥 Creating test users...')

  for (const user of testUsers) {
    try {
      // Create user with Admin API (handles bcrypt hashing automatically)
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email verification for test users
        user_metadata: {
          full_name: user.full_name,
        },
      })

      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message)
        continue
      }

      if (!data.user) {
        console.error(`❌ No user data returned for ${user.email}`)
        continue
      }

      console.log(`✅ Created user: ${user.email}`)

      // Update profile with correct role and store_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: user.role,
          store_id: user.store_id,
          full_name: user.full_name,
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.error(`❌ Error updating profile for ${user.email}:`, profileError.message)
      } else {
        console.log(`   ✓ Updated profile: role=${user.role}`)
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err)
    }
  }
}

async function main() {
  console.log('\n🌱 Starting user seeding process...\n')

  try {
    // Step 1: Delete existing test users
    await deleteExistingTestUsers()

    console.log('')

    // Step 2: Create new test users
    await createTestUsers()

    console.log('\n✅ User seeding completed successfully!\n')
  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

main()
