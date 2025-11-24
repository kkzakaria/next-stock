/**
 * POS Cash Session Close API Route
 * POST: Close an active cash session with final count
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

interface CloseSessionRequest {
  sessionId: string
  closingAmount: number
  notes?: string
  managerId?: string
  managerPin?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CloseSessionRequest = await request.json()

    // Validate request
    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    if (body.closingAmount < 0) {
      return NextResponse.json(
        { error: 'Closing amount cannot be negative' },
        { status: 400 }
      )
    }

    // Get the session and verify ownership
    const { data: session, error: fetchError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('id', body.sessionId)
      .eq('status', 'open')
      .single()

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found or already closed' },
        { status: 404 }
      )
    }

    // Verify user owns this session or is manager/admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('store_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 400 }
      )
    }

    const isOwner = session.cashier_id === user.id
    const isManager = profile.role === 'manager' || profile.role === 'admin'

    if (!isOwner && !isManager) {
      return NextResponse.json(
        { error: 'You can only close your own sessions' },
        { status: 403 }
      )
    }

    // Calculate expected closing amount
    // Expected = opening + cash sales (already tracked in session)
    const expectedClosing =
      Number(session.opening_amount) + Number(session.total_cash_sales)

    // Calculate discrepancy
    const discrepancy = body.closingAmount - expectedClosing

    // Check if manager validation is required (discrepancy detected)
    const requiresApproval = discrepancy !== 0
    let approvedBy: string | null = null

    if (requiresApproval) {
      // Manager validation required
      if (!body.managerId || !body.managerPin) {
        return NextResponse.json(
          {
            error: 'Manager approval required',
            requiresApproval: true,
            discrepancy: discrepancy,
          },
          { status: 400 }
        )
      }

      // Validate manager credentials
      const { data: manager, error: managerError } = await supabase
        .from('profiles')
        .select('id, full_name, role, pin_code, store_id')
        .eq('id', body.managerId)
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
      if (manager.role === 'manager' && manager.store_id !== session.store_id) {
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
      const isValidPin = await bcrypt.compare(body.managerPin, manager.pin_code)

      if (!isValidPin) {
        return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
      }

      approvedBy = manager.id
    }

    // Update session to closed
    const { data: closedSession, error: updateError } = await supabase
      .from('cash_sessions')
      .update({
        closing_amount: body.closingAmount,
        expected_closing_amount: expectedClosing,
        discrepancy: discrepancy,
        closing_notes: body.notes || null,
        closed_at: new Date().toISOString(),
        status: 'closed',
        requires_approval: requiresApproval,
        approved_by: approvedBy,
      })
      .eq('id', body.sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Session close error:', updateError)
      return NextResponse.json(
        { error: 'Failed to close session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      session: closedSession,
      summary: {
        openingAmount: Number(session.opening_amount),
        totalCashSales: Number(session.total_cash_sales),
        totalCardSales: Number(session.total_card_sales),
        totalMobileSales: Number(session.total_mobile_sales),
        totalOtherSales: Number(session.total_other_sales),
        transactionCount: session.transaction_count,
        expectedClosing: expectedClosing,
        actualClosing: body.closingAmount,
        discrepancy: discrepancy,
      },
    })
  } catch (error) {
    console.error('Session close error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
