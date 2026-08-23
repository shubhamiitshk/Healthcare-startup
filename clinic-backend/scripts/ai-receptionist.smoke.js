/* Smoke-test AiReceptionistController from compiled dist with mocked deps */
const {
  AiReceptionistController,
} = require('../dist/ai-receptionist/ai-receptionist.controller.js');
const { Intent } = require('../dist/ai-receptionist/providers/llm.service.js');

const cfg = { get: () => 'http://localhost:3001' };
const aiMock = {
  startSession: () => ({}),
  endSession: () => {},
  handleUtterance: async () => ({
    replyText: 'You are next! Token number 3.',
    intent: Intent.CHECK_STATUS,
  }),
};
const sttMock = { enabled: true, transcribe: async () => 'what is my token status' };
const ttsMock = { enabled: false, synthesizeToFile: async () => null };

function makeRes() {
  return {
    code: null,
    body: null,
    type(t) { this._type = t; return this; },
    send(b) { this.body = b; return this; },
    status(c) { this.code = c; return this; },
  };
}

(async () => {
  const c = new AiReceptionistController(aiMock, sttMock, ttsMock, cfg);

  const r1 = makeRes();
  c.incoming(r1);
  console.log('TYPE:', r1._type);
  console.log('INCOMING TWIML:', r1.body);

  const r2 = makeRes();
  await c.recording(
    {
      CallSid: 'CA123',
      From: '+919876543210',
      RecordingUrl: null,
    },
    r2,
  );
  console.log('NO-RECORDING TWIML:', r2.body);

  const r3 = makeRes();
  c.status({ CallSid: 'CA123', CallStatus: 'completed' }, r3);
  console.log('STATUS CODE:', r3.code);

  const ok =
    r1._type === 'text/xml' &&
    r1.body.includes('<Record') &&
    r1.body.includes('<Say') &&
    r2.body.includes('<Record') &&
    r3.code === 204;
  console.log(ok ? 'SMOKE PASS' : 'SMOKE FAIL');
  process.exit(ok ? 0 : 1);
})();
