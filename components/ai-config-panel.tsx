"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { aiService } from "@/lib/ai-service"
import { Settings, Cpu, Globe, Key, Zap } from "lucide-react"

export function AIConfigPanel() {
  const [config, setConfig] = useState(aiService.getConfig())
  const [showConfig, setShowConfig] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gpt-4")
  const [endpoint, setEndpoint] = useState("")

  const handleModeChange = (mode: "local" | "online") => {
    const newConfig = { ...config, mode }
    setConfig(newConfig)
    aiService.setConfig(newConfig)
  }

  const handleSaveOnlineConfig = () => {
    const newConfig = {
      ...config,
      apiKey,
      model,
      endpoint: endpoint || undefined,
    }
    setConfig(newConfig)
    aiService.setConfig(newConfig)
    setShowConfig(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-300">AI Mode:</span>
          <Badge
            variant="outline"
            className={
              config.mode === "local" ? "border-blue-500/50 text-blue-400" : "border-emerald-500/50 text-emerald-400"
            }
          >
            {config.mode === "local" ? (
              <>
                <Cpu className="w-3 h-3 mr-1" />
                Local AI
              </>
            ) : (
              <>
                <Globe className="w-3 h-3 mr-1" />
                Online AI
              </>
            )}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfig(!showConfig)}
          className="text-slate-400 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {showConfig && (
        <Card className="bg-black/20 border-slate-700/50 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span>AI Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>AI Mode</Label>
              <Select value={config.mode} onValueChange={handleModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4" />
                      <span>Local AI (No API required)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="online">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Online AI (API required)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.mode === "online" && (
              <>
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="endpoint">Custom Endpoint (Optional)</Label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                  />
                </div>

                <Button onClick={handleSaveOnlineConfig} className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
              </>
            )}

            {config.mode === "local" && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-sm text-blue-400 mb-2">Local AI Features:</div>
                <ul className="text-xs text-slate-300 space-y-1">
                  <li>• No API costs or internet required</li>
                  <li>• Privacy-focused processing</li>
                  <li>• Instant responses</li>
                  <li>• Trading-specific intelligence</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
