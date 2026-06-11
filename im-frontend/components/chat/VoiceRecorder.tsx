"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button, Typography, Space } from "antd";
import { AudioOutlined, StopOutlined, CloseOutlined } from "@ant-design/icons";

interface VoiceRecorderProps {
  onRecordComplete: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onRecordComplete, onCancel }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    if (typeof MediaRecorder === "undefined") {
      alert("您的浏览器不支持语音录制，请使用 Chrome 或 Firefox");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        onRecordComplete(blob, duration);
      };

      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      alert("无法访问麦克风，请检查权限设置");
    }
  }, [onRecordComplete, duration]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const cancelRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    chunksRef.current = [];
    setRecording(false);
    setDuration(0);
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="im4-voice-recorder" style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      {!recording ? (
        <Button type="primary" icon={<AudioOutlined />} onClick={startRecording}>
          开始录音
        </Button>
      ) : (
        <>
          <StopOutlined style={{ color: "#ff4d4f", fontSize: 18, animation: "pulse 1s infinite" }} />
          <Typography.Text>{duration}s</Typography.Text>
          <Button type="primary" danger size="small" onClick={stopRecording}>停止并发送</Button>
          <Button size="small" icon={<CloseOutlined />} onClick={cancelRecording}>取消</Button>
        </>
      )}
    </div>
  );
}
