#!/usr/bin/env node

/**
 * Simple script to generate a bcrypt hash for a PIN
 */

import bcrypt from 'bcryptjs'

const pin = process.argv[2] || '123456'
const hash = await bcrypt.hash(pin, 10)

console.log('PIN:', pin)
console.log('Hash:', hash)
