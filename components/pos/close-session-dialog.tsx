'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Loader2,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Tables } from '@/types/supabase'
import { createClient } from '@/lib/supabase/client'

type CashSession = Tables<'cash_sessions'>

interface Manager {
  id: string
  full_name: string | null
}

interface CloseSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: CashSession | null
  onSessionClosed: () => void
}

export function CloseSessionDialog({
  open,
  onOpenChange,
  session,
  onSessionClosed,
}: CloseSessionDialogProps) {
  const [closingAmount, setClosingAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [managers, setManagers] = useState<Manager[]>([])
  const [managerId, setManagerId] = useState('')
  const [managerPin, setManagerPin] = useState('')

  // Fetch managers when dialog opens
  useEffect(() => {
    if (open && session) {
      const fetchManagers = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['manager', 'admin'])
          .or(`store_id.eq.${session.store_id},role.eq.admin`)
          .order('full_name')

        if (data) {
          setManagers(data)
        }
      }

      fetchManagers()
    }
  }, [open, session])

  if (!session) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Calculate expected closing amount
  const openingAmount = Number(session.opening_amount) || 0
  const totalCashSales = Number(session.total_cash_sales) || 0
  const expectedClosing = openingAmount + totalCashSales

  // Calculate discrepancy if closing amount is entered
  const enteredAmount = parseFloat(closingAmount) || 0
  const discrepancy = closingAmount ? enteredAmount - expectedClosing : null
  const requiresApproval = discrepancy !== null && discrepancy !== 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!closingAmount) {
      setError('Veuillez entrer le montant final')
      return
    }

    // Check if manager approval is required
    if (requiresApproval) {
      if (!managerId) {
        setError('Veuillez sélectionner un manager')
        return
      }
      if (!managerPin) {
        setError('Veuillez entrer le PIN du manager')
        return
      }
    }

    setLoading(true)

    try {
      const response = await fetch('/api/pos/session/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          closingAmount: parseFloat(closingAmount),
          notes: notes || undefined,
          managerId: requiresApproval ? managerId : undefined,
          managerPin: requiresApproval ? managerPin : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close session')
      }

      // Reset form
      setClosingAmount('')
      setNotes('')
      onSessionClosed()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const totalSales =
    Number(session.total_cash_sales || 0) +
    Number(session.total_card_sales || 0) +
    Number(session.total_mobile_sales || 0) +
    Number(session.total_other_sales || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Fermer la caisse
          </DialogTitle>
          <DialogDescription>
            Vérifiez le résumé de la session et entrez le montant final en
            espèces.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="space-y-4 py-4 flex-1 overflow-y-auto">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Session Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Résumé de la session</h4>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-600" />
                  <span>Espèces:</span>
                </div>
                <span className="text-right font-medium">
                  {formatCurrency(Number(session.total_cash_sales || 0))}
                </span>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span>Carte:</span>
                </div>
                <span className="text-right font-medium">
                  {formatCurrency(Number(session.total_card_sales || 0))}
                </span>

                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-purple-600" />
                  <span>Mobile:</span>
                </div>
                <span className="text-right font-medium">
                  {formatCurrency(Number(session.total_mobile_sales || 0))}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span>Nombre de transactions:</span>
                <span className="font-medium">{session.transaction_count}</span>
              </div>

              <div className="flex justify-between font-medium">
                <span>Total des ventes:</span>
                <span>{formatCurrency(totalSales)}</span>
              </div>
            </div>

            {/* Cash Calculation */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900">Calcul espèces</h4>
              <div className="grid grid-cols-2 gap-1 text-sm text-blue-800">
                <span>Fond de caisse:</span>
                <span className="text-right">{formatCurrency(openingAmount)}</span>
                <span>+ Ventes espèces:</span>
                <span className="text-right">{formatCurrency(totalCashSales)}</span>
              </div>
              <Separator className="bg-blue-200" />
              <div className="flex justify-between font-bold text-blue-900">
                <span>Espèces attendues:</span>
                <span>{formatCurrency(expectedClosing)}</span>
              </div>
            </div>

            {/* Closing Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="closingAmount">Montant final compté ($)</Label>
              <Input
                id="closingAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                className="text-lg font-medium"
                autoFocus
              />
            </div>

            {/* Discrepancy Display */}
            {discrepancy !== null && (
              <div
                className={`rounded-lg p-3 flex items-center gap-2 ${
                  discrepancy === 0
                    ? 'bg-green-50 text-green-800'
                    : discrepancy > 0
                      ? 'bg-yellow-50 text-yellow-800'
                      : 'bg-red-50 text-red-800'
                }`}
              >
                {discrepancy === 0 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <div>
                  <span className="font-medium">
                    {discrepancy === 0
                      ? 'Caisse équilibrée'
                      : discrepancy > 0
                        ? `Excédent: ${formatCurrency(discrepancy)}`
                        : `Manque: ${formatCurrency(Math.abs(discrepancy))}`}
                  </span>
                </div>
              </div>
            )}

            {/* Manager Approval Section - Only shown when discrepancy exists */}
            {requiresApproval && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  <h4 className="font-medium">Validation manager requise</h4>
                </div>
                <p className="text-sm text-orange-700">
                  Un écart a été détecté. L&apos;approbation d&apos;un manager
                  est nécessaire pour fermer la caisse.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Select value={managerId} onValueChange={setManagerId}>
                    <SelectTrigger id="manager">
                      <SelectValue placeholder="Sélectionner un manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.full_name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerPin">PIN Manager</Label>
                  <Input
                    id="managerPin"
                    type="password"
                    inputMode="numeric"
                    placeholder="Entrez le PIN"
                    value={managerPin}
                    onChange={(e) => setManagerPin(e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes de fermeture (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Observations, incidents..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !closingAmount}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Fermer la caisse
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
