function fallbackCopyTextToClipboard(text: string): void {
  const textArea = document.createElement('textarea')
  textArea.value = text

  // Avoid scrolling to bottom
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.position = 'fixed'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (!successful) throw new Error('Could not copy to clipboard')
  } finally {
    document.body.removeChild(textArea)
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) fallbackCopyTextToClipboard(text)
  else await navigator.clipboard.writeText(text)
}
