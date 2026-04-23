const fs = require('fs');
const path = './client/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add refs for state
const imports = "import React, { useState, useRef, useEffect, useCallback } from 'react';";
content = content.replace(
  "  const [modelsReady, setModelsReady] = useState<boolean>(false);",
  `  const [modelsReady, setModelsReady] = useState<boolean>(false);

  const isProcessingRef = useRef(isProcessing);
  const wsRef = useRef(ws);
  const audioContextRef = useRef(audioContext);

  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
  useEffect(() => { wsRef.current = ws; }, [ws]);
  useEffect(() => { audioContextRef.current = audioContext; }, [audioContext]);`
);

// 2. Update scriptProcessor.onaudioprocess
content = content.replace(
  "if (!isProcessing || !ws || ws.readyState !== WebSocket.OPEN) return;",
  "if (!isProcessingRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;"
);

content = content.replace(
  "ws.send(JSON.stringify({",
  "wsRef.current.send(JSON.stringify({"
);

// 3. Update websocket.onmessage
content = content.replace(
  "const currentContext = audioContext;",
  "const currentContext = audioContextRef.current;"
);

fs.writeFileSync(path, content);
console.log('App.tsx updated');
