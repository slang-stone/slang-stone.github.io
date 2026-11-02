export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback for insecure contexts / older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/** Native share when available, otherwise copy. Returns what happened. */
export async function shareText(text: string, title = 'Slang Translator'): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'failed';
    }
  }
  return (await copyText(text)) ? 'copied' : 'failed';
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export async function shareCanvas(canvas: HTMLCanvasElement, filename: string, text: string) {
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  if (blob && navigator.canShare) {
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text }); return 'shared'; } catch { /* fall through */ }
    }
  }
  downloadCanvas(canvas, filename);
  return 'downloaded';
}
