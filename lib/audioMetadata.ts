/** Read metadata without uploading the file; always release the temporary URL. */
export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const source = extension === 'm4a' || extension === 'mp4a'
      ? new Blob([file], { type: 'audio/mp4' })
      : file;
    const url = URL.createObjectURL(source);
    const audio = new Audio();
    const cleanup = () => {
      clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.ondurationchange = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(url);
    };
    const fail = () => {
      cleanup();
      reject(new Error('Cannot read audio duration. Enter the duration in seconds before uploading.'));
    };
    const timeout = setTimeout(fail, 15000);
    const update = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const duration = Math.max(1, Math.round(audio.duration));
        cleanup();
        resolve(duration);
      }
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = update;
    audio.ondurationchange = update;
    audio.onerror = fail;
    audio.src = url;
    audio.load();
  });
}