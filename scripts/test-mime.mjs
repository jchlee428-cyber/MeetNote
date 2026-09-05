// Test audio mime type normalization
function normalizeAudioMimeType(mimeType, fileName) {
  const lower = (mimeType || '').toLowerCase();
  const ext = (fileName || '').split('.').pop()?.toLowerCase();

  if (lower.includes('m4a') || lower.includes('mp4') || ext === 'm4a' || ext === 'mp4') {
    return 'audio/mp4';
  }
  if (lower.includes('mpeg') || lower.includes('mp3') || ext === 'mp3') {
    return 'audio/mp3';
  }
  if (lower.includes('wav') || ext === 'wav') {
    return 'audio/wav';
  }
  if (lower.includes('aac') || ext === 'aac') {
    return 'audio/aac';
  }
  if (lower.includes('ogg') || ext === 'ogg') {
    return 'audio/ogg';
  }
  if (lower.includes('webm') || ext === 'webm') {
    return 'audio/webm';
  }
  return 'audio/mp4';
}

console.log('audio/x-m4a ->', normalizeAudioMimeType('audio/x-m4a', 'test.m4a'));
console.log('empty mime ->', normalizeAudioMimeType('', 'call_recording.m4a'));
console.log('audio/wav ->', normalizeAudioMimeType('audio/wav', 'voice.wav'));
