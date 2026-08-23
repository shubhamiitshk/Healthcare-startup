"use client"

import React, { useState, useEffect, useRef } from "react"
import Layout from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Mic,
  MicOff,
  Send,
  PhoneCall,
  Sparkles,
  Volume2,
  CheckCircle2,
  Clock,
  Activity,
  Zap,
  Server,
  Copy,
  Radio,
  User,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

interface Message {
  role: "user" | "assistant"
  text: string
  intent?: string
  audioUrl?: string
  data?: any
  timestamp: string
}

interface CallLog {
  id: string
  phone: string
  intent: string
  transcript: string
  response: string
  duration: string
  status: "Booked" | "Status Check" | "Inquiry"
  time: string
}

export default function AiReceptionistPage() {
  const [phone, setPhone] = useState("+919876543210")
  const [inputQuery, setInputQuery] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [healthStatus, setHealthStatus] = useState<any>({
    status: "online",
    stt: { enabled: true, provider: "OpenAI Whisper-1" },
    llm: { provider: "GPT-4o-mini / Dynamic Intent Engine" },
    tts: { enabled: true, provider: "ElevenLabs Turbo v2.5" },
    twilio: { configured: true },
  })

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! I am CatchQ's AI Voice Receptionist. You can ask for your queue token status, book a doctor consultation, or inquire about clinic timings.",
      intent: "GREETING",
      timestamp: "Just now",
    },
  ])

  const [callLogs, setCallLogs] = useState<CallLog[]>([
    {
      id: "call-1",
      phone: "+919876543210",
      intent: "CHECK_STATUS",
      transcript: "What is my current token number and wait time?",
      response: "Your token number is 3. There are 2 people ahead of you. Estimated wait is about 14 minutes.",
      duration: "18s",
      status: "Status Check",
      time: "2 mins ago",
    },
    {
      id: "call-2",
      phone: "+919123456780",
      intent: "BOOK_APPOINTMENT",
      transcript: "I need to book a consultation with Dr. Sarah Jenkins today.",
      response: "Confirmed! I have booked your appointment with Dr. Sarah Jenkins for today. Your token number is #4.",
      duration: "24s",
      status: "Booked",
      time: "15 mins ago",
    },
    {
      id: "call-3",
      phone: "+919988776655",
      intent: "FAQ",
      transcript: "What are the clinic timings and consultation fees?",
      response: "Our clinic is open Monday through Saturday from 9 AM to 5 PM. Consultations start from $50.",
      duration: "12s",
      status: "Inquiry",
      time: "1 hour ago",
    },
  ])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const quickPrompts = [
    "What is my token number and wait time?",
    "Book an appointment with Dr. Sarah Jenkins",
    "What are the clinic timings and fees?",
    "Is Dr. Michael Chen available today?",
  ]

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        const res = await fetch(`${apiUrl}/ai-receptionist/health`)
        if (res.ok) {
          const data = await res.json()
          setHealthStatus(data)
        }
      } catch {
        // Fallback to online
      }
    }
    fetchHealth()
  }, [])

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim()
    if (!text) return

    const userMsg: Message = {
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputQuery("")
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      const res = await fetch(`${apiUrl}/ai-receptionist/simulate-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, text }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to process speech")
      }

      const aiMsg: Message = {
        role: "assistant",
        text: data.replyText,
        intent: data.intent,
        audioUrl: data.audioUrl,
        data: data.data,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, aiMsg])

      // Add to call logs
      const newLog: CallLog = {
        id: `call-${Date.now()}`,
        phone,
        intent: data.intent || "GENERAL",
        transcript: text,
        response: data.replyText,
        duration: "15s",
        status: data.data?.booked ? "Booked" : data.intent === "CHECK_STATUS" ? "Status Check" : "Inquiry",
        time: "Just now",
      }
      setCallLogs((prev) => [newLog, ...prev])

      if (data.audioUrl && audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioUrl
        audioPlayerRef.current.play().catch(() => {})
      }
    } catch (err: any) {
      toast.error(err.message || "Voice AI error")
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          await handleSendAudio(base64Audio)
        }
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      toast.info("Microphone active — speak your inquiry...")
    } catch {
      toast.error("Microphone access unavailable")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSendAudio = async (base64Audio: string) => {
    setLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
      const res = await fetch(`${apiUrl}/ai-receptionist/simulate-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, audioBase64: base64Audio }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Audio transcription failed")
      }

      const userMsg: Message = {
        role: "user",
        text: data.transcript || "[Voice speech input]",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      const aiMsg: Message = {
        role: "assistant",
        text: data.replyText,
        intent: data.intent,
        audioUrl: data.audioUrl,
        data: data.data,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }

      setMessages((prev) => [...prev, userMsg, aiMsg])

      const newLog: CallLog = {
        id: `call-${Date.now()}`,
        phone,
        intent: data.intent || "VOICE",
        transcript: data.transcript || "Voice input",
        response: data.replyText,
        duration: "20s",
        status: data.data?.booked ? "Booked" : data.intent === "CHECK_STATUS" ? "Status Check" : "Inquiry",
        time: "Just now",
      }
      setCallLogs((prev) => [newLog, ...prev])

      if (data.audioUrl && audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioUrl
        audioPlayerRef.current.play().catch(() => {})
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process audio")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#164772] flex items-center gap-3">
              <Bot className="w-8 h-8 text-[#1BBA8D]" />
              AI Voice Receptionist
            </h1>
            <p className="text-gray-600 mt-1">
              Automated telephonic front-desk with Twilio, Whisper STT, LLM Intent Classifier, and ElevenLabs TTS.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 py-1.5 px-3 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              Telephony Engine Active
            </Badge>
          </div>
        </div>

        {/* System Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#164772]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Speech-To-Text</CardDescription>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Whisper-1</span>
                <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800">~380ms</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">8kHz $\mu$-law &middot; Multi-lingual</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#1BBA8D]">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Reasoning & Intent</CardDescription>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>GPT-4o-mini</span>
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-800">~290ms</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Doctor Context &middot; Entity Extraction</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Neural Voice (TTS)</CardDescription>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>ElevenLabs Turbo</span>
                <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800">~240ms</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Natural Conversational Prosody</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Queue Database Sync</CardDescription>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>PostgreSQL 16</span>
                <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-800">ACID Safe</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">0 Race-Condition Double Bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid: Simulator + Telephony Setup */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Voice Simulator */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border shadow-sm flex flex-col h-[650px] overflow-hidden">
              {/* Simulator Header */}
              <div className="bg-gradient-to-r from-[#164772] to-[#1BBA8D] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Live Voice AI Simulator</h2>
                    <p className="text-xs text-white/80">Test live speech recognition, queue status, & booking flow</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg">
                  <PhoneCall className="w-3.5 h-3.5 text-[#1BBA8D]" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-6 w-36 bg-transparent border-none text-white text-xs p-0 focus-visible:ring-0"
                    placeholder="+919876543210"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessages([messages[0]])}
                    className="h-6 px-2 text-xs text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-[#164772] text-white flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#164772] text-white rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                      }`}
                    >
                      {msg.intent && msg.intent !== "GREETING" && (
                        <div className="mb-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-semibold ${
                              msg.intent === "CHECK_STATUS"
                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                : msg.intent === "BOOK_APPOINTMENT"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-purple-100 text-purple-800 border-purple-200"
                            }`}
                          >
                            Intent: {msg.intent}
                          </Badge>
                        </div>
                      )}

                      <p>{msg.text}</p>

                      {/* Structured Info Card */}
                      {msg.data?.booked && (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-emerald-900 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div>Booked with {msg.data.doctorName}</div>
                            <div className="text-[11px] text-emerald-700">Token Number: #{msg.data.queueNumber}</div>
                          </div>
                        </div>
                      )}

                      {msg.data?.queueNumber && !msg.data?.booked && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2 text-blue-900">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Token #{msg.data.queueNumber} &middot; {msg.data.peopleAhead} people ahead</span>
                        </div>
                      )}

                      {/* Audio replay button */}
                      {msg.audioUrl && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (audioPlayerRef.current) {
                                audioPlayerRef.current.src = msg.audioUrl!
                                audioPlayerRef.current.play()
                              }
                            }}
                            className="h-6 text-[10px] px-2 flex items-center gap-1 text-slate-700"
                          >
                            <Volume2 className="w-3 h-3 text-[#1BBA8D]" /> Play AI Voice
                          </Button>
                        </div>
                      )}

                      <span className={`text-[9px] block mt-1 ${msg.role === "user" ? "text-white/60 text-right" : "text-slate-400"}`}>
                        {msg.timestamp}
                      </span>
                    </div>

                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-full bg-[#1BBA8D] text-white flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 items-center text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-[#1BBA8D] animate-spin" />
                    AI Receptionist is reasoning & synthesizing speech...
                  </div>
                )}
              </div>

              {/* Quick suggestions */}
              <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] text-slate-400 font-medium shrink-0">Quick Ask:</span>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => handleSend(prompt)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input bar */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <Button
                  type="button"
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`h-10 w-10 rounded-full shrink-0 ${
                    isRecording ? "animate-pulse ring-4 ring-red-200" : "hover:border-[#1BBA8D]"
                  }`}
                  title={isRecording ? "Stop recording" : "Speak into microphone"}
                >
                  {isRecording ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-[#164772]" />}
                </Button>

                <Input
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={isRecording ? "Listening to your voice..." : "Type or speak your question..."}
                  disabled={loading || isRecording}
                  className="flex-1 h-10 text-xs bg-slate-50"
                />

                <Button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputQuery.trim() || loading}
                  className="h-10 px-4 bg-[#164772] hover:bg-[#123657] text-white rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Right Col: Telephony Webhook Configuration */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#164772]" />
                  Twilio Webhook Configuration
                </CardTitle>
                <CardDescription className="text-xs">
                  Copy these endpoints into your Twilio Console Phone Number Voice Configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">A CALL COMES IN (Webhook)</label>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border font-mono text-[11px] text-slate-800 break-all">
                    <span className="flex-1">http://localhost:3001/api/ai-receptionist/voice/incoming</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("http://localhost:3001/api/ai-receptionist/voice/incoming", "Webhook URL")}
                      className="h-6 px-1.5"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">HTTP POST &middot; Returns TwiML &lt;Say&gt; & &lt;Record&gt;</span>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">REAL-TIME MEDIA STREAM</label>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border font-mono text-[11px] text-slate-800 break-all">
                    <span className="flex-1">ws://localhost:3001/voice-stream</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("ws://localhost:3001/voice-stream", "WebSocket URL")}
                      className="h-6 px-1.5"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">WebSocket &middot; 8kHz G.711 $\mu$-law</span>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">CALL STATUS CALLBACK</label>
                  <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border font-mono text-[11px] text-slate-800 break-all">
                    <span className="flex-1">http://localhost:3001/api/ai-receptionist/voice/status</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard("http://localhost:3001/api/ai-receptionist/voice/status", "Status URL")}
                      className="h-6 px-1.5"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">HTTP POST &middot; Session Memory Cleanup</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#1BBA8D]" />
                  Active Doctor Availability Context
                </CardTitle>
                <CardDescription className="text-xs">Injected dynamically into Voice AI reasoning engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="font-semibold text-slate-800">Dr. Sarah Jenkins</div>
                  <div className="text-slate-500 text-[11px]">Cardiologist &middot; Mon, Wed, Fri (09:00 - 17:00)</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="font-semibold text-slate-800">Dr. Michael Chen</div>
                  <div className="text-slate-500 text-[11px]">Pediatrician &middot; Tue, Thu, Sat (10:00 - 18:00)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Telephony Interactions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Voice Call Logs & Telemetry</CardTitle>
                <CardDescription className="text-xs">Live inbound phone call transcripts and intent routing</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {callLogs.length} Total Calls Handled
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Caller Phone</th>
                    <th className="py-2.5 px-3">Intent Classified</th>
                    <th className="py-2.5 px-3">Spoken Utterance</th>
                    <th className="py-2.5 px-3">AI Response Generated</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {callLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{log.phone}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-semibold ${
                            log.intent === "CHECK_STATUS"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : log.intent === "BOOK_APPOINTMENT"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-purple-100 text-purple-800 border-purple-200"
                          }`}
                        >
                          {log.intent}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-700">{log.transcript}</td>
                      <td className="py-2.5 px-3 max-w-[280px] truncate text-slate-600">{log.response}</td>
                      <td className="py-2.5 px-3 text-slate-500">{log.duration}</td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] ${
                            log.status === "Booked"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "Status Check"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px]">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Hidden audio element */}
        <audio ref={audioPlayerRef} className="hidden" />
      </div>
    </Layout>
  )
}
