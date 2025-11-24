/**
 * Manager PIN Validation API
 * Validates a manager/admin PIN for cash session approval
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

interface ValidatePinRequest {
  managerId: string
  pin: string
  storeId: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ValidatePinRequest = await request.json()
    const { managerId, pin, storeId } = body

    if (!managerId || !pin || !storeId) {
      return NextResponse.json(
        { error: 'Manager ID, PIN, and Store ID are required' },
        { status: 400 }
      )
    }

    // Get manager profile with PIN
    const { data: manager, error: managerError } = await supabase
      .from('profiles')
      .select('id, full_name, role, pin_code, store_id')
      .eq('id', managerId)
      .single()

    if (managerError || !manager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      )
    }

    // Check if user is a manager or admin
    if (manager.role !== 'manager' && manager.role !== 'admin') {
      return NextResponse.json(
        { error: 'User is not a manager or admin' },
        { status: 403 }
      )
    }

    // Check if manager has access to this store (admin has access to all)
    if (manager.role === 'manager' && manager.store_id !== storeId) {
      return NextResponse.json(
        { error: 'Manager does not have access to this store' },
        { status: 403 }
      )
    }

    // Check if manager has set a PIN
    if (!manager.pin_code) {
      return NextResponse.json(
        { error: 'Manager has not set a PIN code' },
        { status: 400 }
      )
    }

    // Validate PIN
    const isValidPin = await bcrypt.compare(pin, manager.pin_code)

    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      valid: true,
      managerId: manager.id,
      managerName: manager.full_name,
    })
  } catch (error) {
    console.error('PIN validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
