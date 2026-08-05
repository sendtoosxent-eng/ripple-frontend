"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Mic, MicOff, Phone, Volume2 } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"

type CallPhase = "idle" | "incoming" | "ringing" | "connecting" | "connected" | "failed"

type Signal = {
  callId: string
  fromUserId: number
  toUserId: number
  fromName?: string
  type: "invite" | "accept" | "reject" | "offer" | "answer" | "ice" | "end" | "busy"
  description?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

type Props = {
  channel: any
  user: { id: number; name: string }
  peer: { id: string; name: string; avatar: string }
  onLog: (status: "missed" | "declined" | "completed", duration: number) => void
}

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
}

export function VoiceCall({ channel, user, peer, onLog }: Props) {
  const [phase, setPhase] = useState<CallPhase>("idle")
  const [muted, setMuted] = useState(false)
  const [speakerOn, setSpeakerOn] = useState(true)
  const [error, setError] = useState("")
  const [seconds, setSeconds] = useState(0)
  const phaseRef = useRef<CallPhase>("idle")
  const callIdRef = useRef<string | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const callerRef = useRef(false)
  const loggedRef = useRef(false)
  const secondsRef = useRef(0)
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const moveTo = (next: CallPhase) => {
    phaseRef.current = next
    setPhase(next)
  }

  const send = useCallback((signal: Omit<Signal, "fromUserId" | "toUserId">) => {
    channel?.whisper("voice-call", {
      ...signal,
      fromUserId: user.id,
      toUserId: Number(peer.id),
      fromName: user.name,
    })
  }, [channel, peer.id, user.id, user.name])

  const cleanUp = useCallback(() => {
    if (ringTimerRef.current) clearTimeout(ringTimerRef.current)
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    pendingCandidatesRef.current = []
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
    callIdRef.current = null
    setMuted(false)
    setSpeakerOn(true)
    setSeconds(0)
    secondsRef.current = 0
    callerRef.current = false
    loggedRef.current = false
    moveTo("idle")
  }, [])

  const getMicrophone = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Voice calls are not supported by this browser.")
    if (!localStreamRef.current) {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    }
    return localStreamRef.current
  }, [])

  const makePeerConnection = useCallback(async (activeCallId: string) => {
    if (peerConnectionRef.current) return peerConnectionRef.current
    const stream = await getMicrophone()
    const connection = new RTCPeerConnection(rtcConfiguration)
    stream.getTracks().forEach((track) => connection.addTrack(track, stream))
    connection.ontrack = (event) => {
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0]
    }
    connection.onicecandidate = (event) => {
      if (event.candidate) send({ type: "ice", callId: activeCallId, candidate: event.candidate.toJSON() })
    }
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") moveTo("connected")
      if (["failed", "disconnected"].includes(connection.connectionState)) {
        setError("The call connection was lost.")
        moveTo("failed")
      }
    }
    peerConnectionRef.current = connection
    return connection
  }, [getMicrophone, send])

  const flushCandidates = useCallback(async (connection: RTCPeerConnection) => {
    for (const candidate of pendingCandidatesRef.current) await connection.addIceCandidate(candidate)
    pendingCandidatesRef.current = []
  }, [])

  const startCall = async () => {
    setError("")
    const nextCallId = crypto.randomUUID()
    callerRef.current = true
    callIdRef.current = nextCallId
    moveTo("ringing")
    try {
      if (!channel) throw new Error("Live calling is reconnecting. Please try again in a moment.")
      await getMicrophone()
      send({ type: "invite", callId: nextCallId })
      ringTimerRef.current = setTimeout(() => {
        if (phaseRef.current !== "ringing" || loggedRef.current) return
        loggedRef.current = true
        onLog("missed", 0)
        send({ type: "end", callId: nextCallId })
        setError(`${peer.name} did not answer.`)
        moveTo("failed")
        localStreamRef.current?.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }, 30000)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Microphone access is required for a voice call.")
      moveTo("failed")
    }
  }

  const acceptCall = async () => {
    if (!callIdRef.current) return
    setError("")
    try {
      await makePeerConnection(callIdRef.current)
      moveTo("connecting")
      send({ type: "accept", callId: callIdRef.current })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Microphone access is required for a voice call.")
      send({ type: "reject", callId: callIdRef.current })
      moveTo("failed")
    }
  }

  const finishCall = useCallback((notify = true) => {
    if (callerRef.current && !loggedRef.current && phaseRef.current !== "incoming") {
      loggedRef.current = true
      onLog(phaseRef.current === "connected" ? "completed" : "missed", secondsRef.current)
    }
    if (notify && callIdRef.current) send({ type: phaseRef.current === "incoming" ? "reject" : "end", callId: callIdRef.current })
    cleanUp()
  }, [cleanUp, onLog, send])

  useEffect(() => {
    if (!channel) return
    const onSignal = async (signal: Signal) => {
      if (signal.toUserId !== user.id || signal.fromUserId !== Number(peer.id)) return

      if (signal.type === "invite") {
        if (phaseRef.current !== "idle") {
          send({ type: "busy", callId: signal.callId })
          return
        }
        callIdRef.current = signal.callId
        callerRef.current = false
        setError("")
        moveTo("incoming")
        return
      }
      if (signal.callId !== callIdRef.current) return

      try {
        if (signal.type === "accept") {
          if (ringTimerRef.current) clearTimeout(ringTimerRef.current)
          moveTo("connecting")
          const connection = await makePeerConnection(signal.callId)
          const offer = await connection.createOffer()
          await connection.setLocalDescription(offer)
          send({ type: "offer", callId: signal.callId, description: offer })
        } else if (signal.type === "offer" && signal.description) {
          const connection = await makePeerConnection(signal.callId)
          await connection.setRemoteDescription(signal.description)
          await flushCandidates(connection)
          const answer = await connection.createAnswer()
          await connection.setLocalDescription(answer)
          send({ type: "answer", callId: signal.callId, description: answer })
        } else if (signal.type === "answer" && signal.description) {
          const connection = peerConnectionRef.current
          if (!connection) return
          await connection.setRemoteDescription(signal.description)
          await flushCandidates(connection)
        } else if (signal.type === "ice" && signal.candidate) {
          const connection = peerConnectionRef.current
          if (connection?.remoteDescription) await connection.addIceCandidate(signal.candidate)
          else pendingCandidatesRef.current.push(signal.candidate)
        } else if (["reject", "busy", "end"].includes(signal.type)) {
          if (callerRef.current && !loggedRef.current) {
            loggedRef.current = true
            onLog(signal.type === "reject" ? "declined" : phaseRef.current === "connected" ? "completed" : "missed", secondsRef.current)
          }
          if (signal.type !== "end") setError(signal.type === "busy" ? `${peer.name} is already on another call.` : `${peer.name} declined the call.`)
          if (signal.type === "end") cleanUp()
          else {
            peerConnectionRef.current?.close()
            peerConnectionRef.current = null
            localStreamRef.current?.getTracks().forEach((track) => track.stop())
            localStreamRef.current = null
            moveTo("failed")
          }
        }
      } catch {
        setError("The voice call could not be connected.")
        moveTo("failed")
      }
    }

    channel.listenForWhisper("voice-call", onSignal)
    return () => channel.stopListeningForWhisper?.("voice-call", onSignal)
  }, [channel, cleanUp, flushCandidates, makePeerConnection, onLog, peer.id, peer.name, send, user.id])

  useEffect(() => {
    if (phase !== "connected") return
    const timer = window.setInterval(() => setSeconds((value) => { secondsRef.current = value + 1; return value + 1 }), 1000)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => () => {
    peerConnectionRef.current?.close()
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const toggleMute = () => {
    const next = !muted
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next })
    setMuted(next)
  }

  const toggleSpeaker = () => {
    const next = !speakerOn
    if (remoteAudioRef.current) remoteAudioRef.current.muted = !next
    setSpeakerOn(next)
  }

  const duration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  const status = phase === "incoming" ? "Incoming voice call" : phase === "ringing" ? "Ringing…" : phase === "connecting" ? "Connecting…" : phase === "connected" ? duration : error

  return (
    <>
      <button aria-label="Voice call" onClick={startCall} disabled={phase !== "idle"} title="Voice call" className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-primary disabled:opacity-40">
        <Phone className="size-5" />
      </button>

      {phase !== "idle" && typeof document !== "undefined" && createPortal((
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#071b14] text-center text-white">
          <audio ref={remoteAudioRef} autoPlay playsInline />
          <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-2xl" style={{ backgroundImage: `url(${peer.avatar})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-[#071b14]/55 to-[#03100c]" />
          <div className="relative flex h-full flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Ripple voice call</p>
            <UserAvatar src={peer.avatar} name={peer.name} size="xl" className="mt-12 rounded-full ring-4 ring-white/10 shadow-2xl" />
            <h2 className="mt-6 text-3xl font-semibold tracking-tight">{peer.name}</h2>
            <p className="mt-2 min-h-5 text-sm text-white/65">{status}</p>

          {phase === "incoming" ? (
            <div className="mt-auto flex w-full max-w-xs justify-between">
              <div><button onClick={() => finishCall()} className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-xl" aria-label="Decline call"><Phone className="size-7 rotate-[135deg]" /></button><p className="mt-2 text-xs text-white/70">Decline</p></div>
              <div><button onClick={acceptCall} className="flex size-16 items-center justify-center rounded-full bg-[#25d366] shadow-xl" aria-label="Accept call"><Phone className="size-7" /></button><p className="mt-2 text-xs text-white/70">Accept</p></div>
            </div>
          ) : phase === "failed" ? (
            <button onClick={() => cleanUp()} className="mt-auto h-12 rounded-full bg-white/10 px-8 font-semibold backdrop-blur hover:bg-white/20">Back to chat</button>
          ) : (
            <div className="mt-auto flex items-start gap-7 rounded-[2rem] bg-black/25 px-6 py-5 backdrop-blur-xl">
              <div><button onClick={toggleSpeaker} className={`flex size-14 items-center justify-center rounded-full ${speakerOn ? "bg-white text-slate-950" : "bg-white/10"}`} aria-label={speakerOn ? "Turn speaker off" : "Turn speaker on"}><Volume2 className="size-6" /></button><p className="mt-2 text-[11px] text-white/65">Speaker</p></div>
              <div><button onClick={toggleMute} className={`flex size-14 items-center justify-center rounded-full ${muted ? "bg-white text-slate-950" : "bg-white/10"}`} aria-label={muted ? "Unmute microphone" : "Mute microphone"}>{muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}</button><p className="mt-2 text-[11px] text-white/65">Mute</p></div>
              <div><button onClick={() => finishCall()} className="flex size-14 items-center justify-center rounded-full bg-red-500 shadow-lg" aria-label="End call"><Phone className="size-6 rotate-[135deg]" /></button><p className="mt-2 text-[11px] text-white/65">End</p></div>
            </div>
          )}
          </div>
        </div>
      ), document.body)}
    </>
  )
}
