"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Mic, MicOff, Phone, X } from "lucide-react"
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
}

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }],
}

export function VoiceCall({ channel, user, peer }: Props) {
  const [phase, setPhase] = useState<CallPhase>("idle")
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState("")
  const [seconds, setSeconds] = useState(0)
  const phaseRef = useRef<CallPhase>("idle")
  const callIdRef = useRef<string | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])

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
    peerConnectionRef.current?.close()
    peerConnectionRef.current = null
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    pendingCandidatesRef.current = []
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
    callIdRef.current = null
    setMuted(false)
    setSeconds(0)
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
    try {
      await getMicrophone()
      const nextCallId = crypto.randomUUID()
      callIdRef.current = nextCallId
      moveTo("ringing")
      send({ type: "invite", callId: nextCallId })
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
    if (notify && callIdRef.current) send({ type: phaseRef.current === "incoming" ? "reject" : "end", callId: callIdRef.current })
    cleanUp()
  }, [cleanUp, send])

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
        setError("")
        moveTo("incoming")
        return
      }
      if (signal.callId !== callIdRef.current) return

      try {
        if (signal.type === "accept") {
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
          if (signal.type !== "end") setError(signal.type === "busy" ? `${peer.name} is already on another call.` : `${peer.name} declined the call.`)
          if (signal.type === "end") cleanUp()
          else moveTo("failed")
        }
      } catch {
        setError("The voice call could not be connected.")
        moveTo("failed")
      }
    }

    channel.listenForWhisper("voice-call", onSignal)
    return () => channel.stopListeningForWhisper?.("voice-call", onSignal)
  }, [channel, cleanUp, flushCandidates, makePeerConnection, peer.id, peer.name, send, user.id])

  useEffect(() => {
    if (phase !== "connected") return
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
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

  const duration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  const status = phase === "incoming" ? "Incoming voice call" : phase === "ringing" ? "Ringing…" : phase === "connecting" ? "Connecting…" : phase === "connected" ? duration : error

  return (
    <>
      <button aria-label="Voice call" onClick={startCall} disabled={!channel || phase !== "idle"} title="Voice call" className="inline-flex size-10 items-center justify-center rounded-full text-foreground/70 hover:bg-muted hover:text-primary disabled:opacity-40">
        <Phone className="size-5" />
      </button>

      {phase !== "idle" && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
          <audio ref={remoteAudioRef} autoPlay playsInline />
          <button onClick={() => finishCall()} aria-label="Close voice call" className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><X className="size-5" /></button>
          <UserAvatar src={peer.avatar} name={peer.name} size="xl" className="rounded-full ring-4 ring-white/15" />
          <h2 className="mt-5 text-2xl font-bold">{peer.name}</h2>
          <p className="mt-1 min-h-5 text-sm text-white/65">{status}</p>

          {phase === "incoming" ? (
            <div className="mt-10 flex gap-8">
              <button onClick={() => finishCall()} className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/25" aria-label="Decline call"><Phone className="size-7 rotate-[135deg]" /></button>
              <button onClick={acceptCall} className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/25" aria-label="Accept call"><Phone className="size-7" /></button>
            </div>
          ) : phase === "failed" ? (
            <button onClick={() => cleanUp()} className="mt-8 h-12 rounded-full bg-white/10 px-7 font-semibold hover:bg-white/20">Close</button>
          ) : (
            <div className="mt-10 flex gap-8">
              <button onClick={toggleMute} className={`flex size-16 items-center justify-center rounded-full ${muted ? "bg-white text-slate-950" : "bg-white/10 hover:bg-white/20"}`} aria-label={muted ? "Unmute microphone" : "Mute microphone"}>{muted ? <MicOff className="size-7" /> : <Mic className="size-7" />}</button>
              <button onClick={() => finishCall()} className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/25" aria-label="End call"><Phone className="size-7 rotate-[135deg]" /></button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
