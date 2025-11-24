#!/usr/bin/env node

/**
 * Script to set a manager's PIN in the database
 * Usage: node scripts/set-manager-pin.mjs <manager-id> <pin>
 */

import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const managerId = process.argv[2]
const pin = process.argv[3]

if (!managerId || !pin) {
  console.error('Usage: node scripts/set-manager-pin.mjs <manager-id> <pin>')
  console.error('Example: node scripts/set-manager-pin.mjs c4420364-0a34-4732-853a-51b872cb2af1 123456')
  process.exit(1)
}

// Hash the PIN
const hashedPin = await bcrypt.hash(pin, 10)

// Update the manager's PIN
const { data, error } = await supabase
  .from('profiles')
  .update({ pin_code: hashedPin })
  .eq('id', managerId)
  .select('id, full_name, role')
  .single()

if (error) {
  console.error('❌ Error updating PIN:', error.message)
  process.exit(1)
}

console.log('✅ PIN set successfully for:', data.full_name, `(${data.role})`)
console.log('📝 Manager ID:', data.id)
console.log('🔐 PIN:', pin)
