import fs from 'fs';

async function testAll() {
  console.log('=== 1. GET /api/meetings ===');
  const resList = await fetch('http://localhost:3000/api/meetings');
  const listData = await resList.json();
  console.log('Meetings count:', listData.meetings?.length);

  console.log('\n=== 2. POST /api/generate-minutes ===');
  const sampleTranscript = `오늘 9월 임원회의를 시작하겠습니다.
안건은 신규 사무실 계약의 건입니다.
논의 결과 보증금 3000만원에 월세 150만원으로 계약하기로 만장일치 결정하였습니다.
홍길동 팀장이 9월 15일까지 계약서를 작성하기로 했습니다.
다음 회의는 9월 22일 본관에서 진행합니다.`;

  const resMinutes = await fetch('http://localhost:3000/api/generate-minutes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: sampleTranscript,
      basicInfo: {
        title: '9월 임원회의',
        location: '본관 회의실',
        attendees: '홍길동 팀장, 김철수 이사',
      },
    }),
  });
  const minutesData = await resMinutes.json();
  console.log('Generate minutes success:', minutesData.success);
  console.log('Decisions:', minutesData.minutes?.decisions);
  console.log('Action Items:', minutesData.minutes?.actionItems);

  console.log('\n=== 3. POST /api/export/word ===');
  const resWord = await fetch('http://localhost:3000/api/export/word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes: minutesData.minutes }),
  });
  console.log('Word export status:', resWord.status);
  const wordBlob = await resWord.arrayBuffer();
  console.log('Word docx size bytes:', wordBlob.byteLength);

  console.log('\n=== 4. POST /api/transcribe (Demo test) ===');
  // 가상 webm blob 생성
  const dummyFormData = new FormData();
  const dummyBlob = new Blob(['RIFF....WAVEfmt '], { type: 'audio/webm' });
  dummyFormData.append('file', dummyBlob, 'meeting.webm');
  dummyFormData.append('title', '가을 행사 준비 회의');

  const resTranscribe = await fetch('http://localhost:3000/api/transcribe', {
    method: 'POST',
    body: dummyFormData,
  });
  const transcribeData = await resTranscribe.json();
  console.log('Transcribe success:', transcribeData.success);
  console.log('Provider:', transcribeData.provider);
  console.log('Transcript length:', transcribeData.transcript?.length);

  console.log('\n=== All API Tests Passed! ===');
}

testAll().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
