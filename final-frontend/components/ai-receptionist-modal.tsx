"use client"

import React, { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Send, Bot, PhoneCall, Sparkles, Volume2, User, RefreshCw, CheckCircle2, Clock } from "lucide-react"
import { toast } from "sonner"

interface AiReceptionistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Message {
  role: "user" | "assistant"
  text: string
  intent?: string
  audioUrl?: string
  data?: any
  timestamp: string
}

export function AiReceptionistModal({ open, onOpenChange }: AiReceptionistModalProps) {
  const [phone, setPhone] = useState("+919876543210")
  const [inputQuery, setInputQuery] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hello! I am CatchQ's AI Voice Receptionist. You can ask about your token status, book an appointment, or inquire about clinic timings.",
      intent: "GREETING",
      timestamp: "Just now",
    },
  ])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const quickPrompts = [
    "What is my token number and wait time?",
    "Book an appointment with Dr. Sarah Jenkins",
    "What are the clinic timings and consultation fees?",
    "Is Dr. Michael Chen available today?",
  ]

  const handleSendText = async (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim()
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
        body: JSON.stringify({
          phone,
          text,
        }),
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

      if (data.audioUrl) {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.src = data.audioUrl
          audioPlayerRef.current.play().catch(() => {})
        }
      }
    } catch (err: any) {
      toast.error(err.message || "AI Voice Pipeline error")
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
      toast.info("Listening... speak your request")
    } catch (err) {
      toast.error("Microphone permission denied or unavailable")
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
        body: JSON.stringify({
          phone,
          audioBase64: base64Audio,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not transcribe audio")
      }

      const userMsg: Message = {
        role: "user",
        text: data.transcript || "[Voice audio clip]",
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

  const getIntentBadgeColor = (intent?: string) => {
    switch (intent) {
      case "CHECK_STATUS":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "BOOK_APPOINTMENT":
        return "bg-green-100 text-green-800 border-green-200"
      case "FAQ":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#164772] to-[#1BBA8D] text-white p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  CatchQ Voice AI Receptionist
                  <Badge variant="outline" className="bg-white/20 text-white border-none text-xs font-normal">
                    Live Simulator
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-white/80 text-xs mt-0.5">
                  Twilio &middot; Whisper STT &middot; GPT-4o Intent Classifier &middot; ElevenLabs TTS
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Caller Phone selector */}
          <div className="flex items-center gap-3 mt-2 bg-black/20 p-2.5 rounded-lg border border-white/10">
            <PhoneCall className="w-4 h-4 text-[#1BBA8D]" />
            <span className="text-xs text-white/90">Simulated Caller Phone:</span>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="h-7 w-44 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([messages[0]])}
              className="h-7 ml-auto text-xs text-white/80 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset Session
            </Button>
          </div>
        </div>

        {/* Message / Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#164772] text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                  msg.role === "user"
                    ? "bg-[#164772] text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                {msg.intent && msg.intent !== "GREETING" && (
                  <div className="mb-2">
                    <Badge variant="outline" className={`text-[10px] font-semibold ${getIntentBadgeColor(msg.intent)}`}>
                      Intent: {msg.intent}
                    </Badge>
                  </div>
                )}

                <p className="text-sm leading-relaxed">{msg.text}</p>

                {/* Structured booking or queue info card */}
                {msg.data?.booked && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-emerald-900">Appointment Booked Successfully</div>
                      <div className="text-emerald-700 mt-0.5">
                        Token Number: <span className="font-bold">#{msg.data.queueNumber}</span> &middot; {msg.data.doctorName}
                      </div>
                    </div>
                  </div>
                )}

                {msg.data?.queueNumber && !msg.data?.booked && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-900">
                      <span className="font-bold">Token #{msg.data.queueNumber}</span> &middot;{" "}
                      {msg.data.peopleAhead !== undefined ? `${msg.data.peopleAhead} people ahead` : msg.data.status}
                      {msg.data.estimatedWaitMinutes ? ` (~${msg.data.estimatedWaitMinutes} mins wait)` : ""}
                    </div>
                  </div>
                )}

                {/* Audio replay button */}
                {msg.audioUrl && (
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (audioPlayerRef.current) {
                          audioPlayerRef.current.src = msg.audioUrl!
                          audioPlayerRef.current.play()
                        }
                      }}
                      className="h-7 text-xs flex items-center gap-1.5 text-slate-700 hover:bg-slate-100"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#1BBA8D]" /> Play AI Voice
                    </Button>
                  </div>
                )}

                <span className={`text-[10px] block mt-1.5 ${msg.role === "user" ? "text-white/60 text-right" : "text-slate-400"}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-[#1BBA8D] text-white flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-[#164772] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-3.5 h-3.5 text-[#1BBA8D] animate-spin" />
                AI Receptionist is reasoning & synthesizing speech...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-6 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-medium shrink-0">Try asking:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendText(prompt)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input & Voice Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            className={`h-11 w-11 rounded-full shrink-0 transition-all ${
              isRecording ? "animate-pulse ring-4 ring-red-200" : "hover:border-[#1BBA8D]"
            }`}
            title={isRecording ? "Stop recording" : "Record voice via microphone"}
          >
            {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#164772]" />}
          </Button>

          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendText()
              }
            }}
            placeholder={isRecording ? "Listening to your voice..." : "Type or speak your inquiry (e.g. What is my token status?)..."}
            disabled={loading || isRecording}
            className="flex-1 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white"
          />

          <Button
            type="button"
            onClick={() => handleSendText()}
            disabled={!inputQuery.trim() || loading}
            className="h-11 px-5 bg-[#164772] hover:bg-[#123657] text-white rounded-lg flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Hidden audio element for speech playback */}
        <audio ref={audioPlayerRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
