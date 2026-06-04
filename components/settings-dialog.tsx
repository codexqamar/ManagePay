"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAppStore } from "@/lib/store"
import { CURRENCIES } from "@/lib/currencies"

export function SettingsDialog() {
  const { toast } = useToast()
  const { settings, updateSettings } = useAppStore()
  const [isOpen, setIsOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    updateSettings(localSettings)
    setIsOpen(false)
    toast({
      title: "Settings Updated",
      description: "Your application settings have been saved successfully",
    })
  }

  const handleCancel = () => {
    setLocalSettings(settings) // Reset to original settings
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>Configure your default currency, tax rates, and processing fees</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Currency & Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={localSettings.defaultCurrency}
                  onValueChange={(value) => setLocalSettings({ ...localSettings, defaultCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax & Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                <Input
                  id="defaultTaxRate"
                  type="number"
                  value={localSettings.defaultTaxRate * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      defaultTaxRate: Number.parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                  placeholder="20"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="processingFeeRate">Processing Fee Rate (%)</Label>
                <Input
                  id="processingFeeRate"
                  type="number"
                  value={localSettings.processingFeeRate * 100}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      processingFeeRate: Number.parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                  placeholder="2.9"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>

              <div>
                <Label htmlFor="processingFeeFixed">
                  Fixed Processing Fee ({CURRENCIES.find((c) => c.code === localSettings.defaultCurrency)?.symbol})
                </Label>
                <Input
                  id="processingFeeFixed"
                  type="number"
                  value={localSettings.processingFeeFixed}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      processingFeeFixed: Number.parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.20"
                  min="0"
                  step="0.01"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
